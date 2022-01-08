var fs = require('fs');
var path = require('path');
const FILE_TYPE = { dir: "DIR", file: "FILE" };
const chokidar = require('chokidar');
const virtualFileEvent = require("./virtualFileEvent");
const _ = require("loadsh");

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
        this.init = false; // 还未初始化
        this.watch(); // 监听文件变化

    }



    /** 
    * ================================================
    * 本地文件的操作 ===================================
    * ================================================
    * */

    resetVirtualFile() {
        // console.log(1)
        this.virtualFile = this.__buildVirtualFiles();
        console.log(123)
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

    ////////////////////////////////////////////////////////////////////
    // 监听本地文件改变
    watch() {
        let events = []

        // 防抖,一秒内的多次请求合并为一次更新即可
        let emitEventThrottle = _.throttle((events, cb) => {
            virtualFileEvent.emitEvents(events, this);
            cb()
        }, 1000, { leading: false })

        let pushEvent = (event) => {
            this.events.push(event);
            emitEventThrottle(events, () => events = []);
        }

        chokidar.watch(this.basePath).on('all', (e, realPath) => {

            if (!this.init) return;
            let virtualPath = this.__getVirtualPath(realPath);
            let event;
            switch (e) {
                case "addDir":
                    event = virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.createDir, { virtualPath })
                    break;
                case "add":
                    event = virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.createFile, { virtualPath })
                    break;
                case "unlink":
                    event = virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.deleteFile, { virtualPath })
                    break;
                case "change":
                    event = virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.change, { virtualPath })
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
    __buildVirtualFiles(dir = this.basePath, fatherJson = this.__buildVirtualFile(FILE_TYPE.dir, "", "/")) {
        const files = fs.readdirSync(dir);
        files.forEach((item, index) => {
            var fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                let virtualPath = this.__getVirtualPath(fullPath)
                let dirJson = this.__buildVirtualFile(FILE_TYPE.dir, item, virtualPath);
                fatherJson.children.push(dirJson);
                this.__buildVirtualFile(path.join(dir, item), dirJson);
            } else {
                let virtualPath = this.__getVirtualPath(fullPath)
                let newFileJson = this.__buildVirtualFile(FILE_TYPE.file, item, virtualPath);
                fatherJson.children.push(newFileJson);
            }
        });
        return fatherJson;
    }

    __buildVirtualFile(type, name, virtualPath) {
        let virtualFile = {
            type,
            name,
            // __fatherPath:fatherPath,
            __path: virtualPath
        };
        if (type == FILE_TYPE.dir) virtualFile.children = [];
        return virtualFile;
    }

    __getRealPath(relativePath) {
        return path.join(this.basePath, relativePath);
    }
}

module.exports.VirtualFileServer = VirtualFileServer