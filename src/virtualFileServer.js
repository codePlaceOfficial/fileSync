var fs = require('fs');
var path = require('path');
const chokidar = require('chokidar');
const virtualFileEvent = require("../../virtualFileEvent");
const os = require('os');

const deleteFolderRecursive = function (path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

class VirtualFileServer {
    constructor(basePath,eventEmitter,sandbox) {
        this.LABEL = "_server"
        this.basePath = basePath;
        this.virtualFile = {};
        this.eventEmitter = eventEmitter;

        // 设置sandbox增强安全性，如果设置sandbox的话,涉及到文件操作的api就通过sandbox来操作了
        this.sandbox = sandbox;
    }

    /** 
    * ================================================
    * 本地文件的操作 ===================================
    * ================================================
    * */
    // 强制获得文件
    resetVirtualFile() {
        this.virtualFile = this.__buildVirtualFiles();
        virtualFileEvent.emitEvents(virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.resetFiles, { virtualFile: this.virtualFile }), this)
        return this.virtualFile;
    }

    // 修改文件内容
    changeFileContent({virtualPath, content}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `echo ${content} > ${path.join("./",virtualPath)}`])
            return;
        }
        fs.writeFileSync(this.__getRealPath(virtualPath), content);
    }

    createDir({virtualPath, dirName}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `mkdir ${path.join("./",virtualPath,dirName)}`])
            return;
        }

        let filePath = this.__getRealPath(virtualPath);
        filePath = path.join(filePath, dirName);
        fs.mkdirSync(filePath);
    }

    createFile({virtualPath, fileName}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `touch ${path.join("./",virtualPath,fileName)}`])
            return;
        }

        let filePath = this.__getRealPath(virtualPath);
        filePath = path.join(filePath, fileName);
        fs.writeFileSync(filePath, "")
    }

    // 得到文件内容
    getFileContent(relativePath) {
        return new Promise((resolve, reject) => {
            if(this.sandbox){
                this.sandbox?.container?.runExec(['/bin/bash', '-c', `cat ${path.join("./",relativePath)}`]).then(resolve)
                return;
            }

            fs.readFile(this.__getRealPath(relativePath), "utf-8", function (err, data) {
                if (err) reject("文件读取失败");
                else resolve(data);
            });
        })
    }

    // 文件删除
    deleteFile({virtualPath}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `rm -rf ${path.join("./",virtualPath)}`])
            return;
        }

        let realPath = this.__getRealPath(virtualPath)
        if (!fs.existsSync(realPath)) return;
        const stat = fs.statSync(realPath);
        if (stat.isDirectory()) { // 删除文件夹
            deleteFolderRecursive(realPath);
        } else {
            fs.unlinkSync(realPath);
        }
    }

    // 文件移动位置
    // newPath为其父文件的位置
    moveFile({virtualPath, newPath}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `mv ${path.join("./",virtualPath)} ${path.join("./",newPath)}`])
            return;
        }

        let oldPath = this.__getRealPath(virtualPath);
        newPath = this.__getRealPath(newPath);
        newPath = path.join(newPath, path.basename(oldPath));
        fs.renameSync(oldPath, newPath);
    }

    // 文件重命名
    renameFile({virtualPath, newName}) {
        if(this.sandbox){
            this.sandbox?.container?.runExec(['/bin/bash', '-c', `mv ${path.join("./",virtualPath)} ${path.join("./",virtualPath,"../",newName)}`])
            return;
        }

        let oldPath = this.__getRealPath(virtualPath);
        let newPath = path.join(path.dirname(oldPath), newName);
        fs.renameSync(oldPath, newPath);
    }

    // 开启服务
    start(){
        this.__watch();
    }

    ////////////////////////////////////////////////////////////////////
    // 监听本地文件改变
    __watch() {
        // when Mac os , usePolling to avoid bug
        // https://github.com/paulmillr/chokidar#performance
        chokidar.watch(this.basePath,{usePolling:os.type() == "Darwin"}).on('all', (e, realPath) => {
            let virtualPath = this.__getVirtualPath(realPath);
            let event;
            let pp = path.parse(virtualPath)
            
            switch (e) {
                case "addDir":
                    event = virtualFileEvent.generateEvent.createDirEvent(pp.dir,pp.base)
                    break;
                case "add":
                    event = virtualFileEvent.generateEvent.createFileEvent(pp.dir,pp.base)
                    break;
                case "unlink":
                case "unlinkDir":
                    event = virtualFileEvent.generateEvent.deleteFileEvent(virtualPath)
                    break;
                case "change":
                    event = virtualFileEvent.generateEvent.fileChangeEvent(virtualPath)
                    break;
                default:
                    break;
            }
            this.eventEmitter.emitEvent(event)
        });
    }

    //  得到真实的文件地址
    __getRealPath(relativePath) {
        return path.join(this.basePath, relativePath);
    }

    __getVirtualPath(realPath) {
        return path.join("/", path.relative(this.basePath, realPath));
    }

    __getRealPath(relativePath) {
        return path.join(this.basePath, relativePath);
    }
}

module.exports = VirtualFileServer