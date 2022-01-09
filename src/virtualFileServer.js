var fs = require('fs');
var path = require('path');
const FILE_TYPE = { dir: "DIR", file: "FILE" };
const chokidar = require('chokidar');
const virtualFileEvent = require("./virtualFileEvent");
const _ = require("loadsh");
const virtualFileHelper = require('./virtualFileHelper');

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
    constructor(basePath) {
        this.basePath = basePath;
        this.virtualFile = {};
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
    changeFileContent(relativePath, data) {
        fs.writeFileSync(this.__getRealPath(relativePath), data);
    }

    createDir(virtualPath, dirName) {
        let filePath = this.__getRealPath(virtualPath);
        filePath = path.join(filePath, dirName);
        fs.mkdirSync(filePath);
    }

    createFile(virtualPath, fileName) {
        let filePath = this.__getRealPath(virtualPath);
        filePath = path.join(filePath, fileName);
        fs.writeFileSync(filePath, "")
    }

    // 得到文件内容
    getFileContent(relativePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(this.__getRealPath(relativePath), "utf-8", function (err, data) {
                if (err) reject("文件读取失败");
                else resolve(data);
            });
        })
    }

    // 文件删除
    deleteFile(relativePath) {
        let realPath = this.__getRealPath(relativePath)
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
    moveFile(relativePath, newPath) {
        let oldPath = this.__getRealPath(relativePath);
        newPath = this.__getRealPath(newPath);
        newPath = path.join(newPath, path.basename(oldPath));
        fs.renameSync(oldPath, newPath);
    }

    // 文件重命名
    renameFile(relativePath, newName) {
        let oldPath = this.__getRealPath(relativePath);
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
        let events = []

        // 防抖,一秒内的多次请求合并为一次更新即可
        let emitEventThrottle = _.throttle((events, cb) => {
            virtualFileEvent.emitEvents(events, this);
            cb()
        }, 1000, { leading: false })

        let pushEvent = (event) => {
            events.push(event);
            emitEventThrottle(events, () => events = []);
        }

        chokidar.watch(this.basePath).on('all', (e, realPath) => {
            // if (!this.init) return;
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
                    event = virtualFileEvent.generateEvent.changeFileEvent(virtualPath)
                    break;
                default:
                    break;
            }
            pushEvent(event);
        });
    }

    //  得到真实的文件地址
    __getRealPath(relativePath) {
        return path.join(this.basePath, relativePath);
    }

    __getVirtualPath(realPath) {
        return path.join("/", path.relative(this.basePath, realPath));
    }

    /**
    * 将文件目录转为json格式
    * 不附带文件内容
    * fatherJson 默认为 {name = "",path="/"}的dir文件
    */
    __buildVirtualFiles(dir = this.basePath, fatherJson = virtualFileHelper.buildRootDir()) {
        const files = fs.readdirSync(dir);
        files.forEach((item, index) => {
            var fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                let virtualPath = this.__getVirtualPath(fullPath)
                let dirJson = virtualFileHelper.__buildVirtualFile(FILE_TYPE.dir, item, virtualPath);
                fatherJson.children.push(dirJson);
                virtualFileHelper.__buildVirtualFile(path.join(dir, item), dirJson);
            } else {
                let virtualPath = this.__getVirtualPath(fullPath)
                let newFileJson = virtualFileHelper.__buildVirtualFile(FILE_TYPE.file, item, virtualPath);
                fatherJson.children.push(newFileJson);
            }
        });
        return fatherJson;
    }

    __getRealPath(relativePath) {
        return path.join(this.basePath, relativePath);
    }
}

module.exports.VirtualFileServer = VirtualFileServer