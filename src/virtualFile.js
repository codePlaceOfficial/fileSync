const _ = require("loadsh")
const util = require('util')
var path = require('path');
const FILE_TYPE = { dir: "DIR", file: "FILE" };
const virtualFileHelper = require("./virtualFileHelper");
const virtualFileEvent = require("./virtualFileEvent");

class VirtualFile {
    constructor() {
        // 是否已经初始化
        this.init = false;
        // this.virtualFileObj = virtualFileHelper.buildRootDir()
    }

    showVirtualFile() {
        console.log(util.inspect(this.virtualFileObj, { showHidden: false, depth: null }));
    }

    initialize() {
        let event = virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.resetFiles);
        virtualFileEvent.emitEvents(event, this);
    }

    /** 
     * ================================================
     * 虚拟文件的操作 ===================================
     * ================================================
     * */
    resetVirtualFile(virtualFileObj) {
        this.virtualFileObj = virtualFileObj;
    }

    // 得到文件内容
    getFileContent(relativePath, fetchContent) {
        let { targetObj, fatherObj } = this.__getFileObjByPath(relativePath)
        return targetObj.content;
    }

    createDir(virtualPath, dirName) {
        if (virtualPath == "/" && dirName == "") {
            this.virtualFileObj = virtualFileHelper.buildRootDir(); //构造根文件
            return;
        }

        let { targetObj, fatherObj } = this.__getFileObjByPath(virtualPath)
        targetObj.children.push(virtualFileHelper.__buildVirtualFile(FILE_TYPE.dir, dirName, path.join(virtualPath, dirName)));
    }

    createFile(virtualPath, fileName) {

        let { targetObj, fatherObj } = this.__getFileObjByPath(virtualPath)
        targetObj.children.push(virtualFileHelper.__buildVirtualFile(FILE_TYPE.file, fileName, path.join(virtualPath, fileName)));
    }

    changeFileContent(relativePath, newContent) {
        let { targetObj, fatherObj } = this.__getFileObjByPath(relativePath)
        targetObj.content = newContent;
    }

    // 文件重命名
    renameFile(relativePath, newName) {
        let { targetObj, fatherObj } = this.__getFileObjByPath(relativePath)
        // 改名同时更改路径
        _.assign(targetObj, { name: newName, __path: path.join(fatherObj.__path, newName) })
        return this.virtualFileObj;
    }

    // 文件移动位置
    // newPath为其父文件的位置
    moveFile(relativePath, newPath) {
        let { targetObj, fatherObj } = this.__getFileObjByPath(newPath);
        let beMoveObj = this.deleteFile(relativePath); // 待移动的数据
        beMoveObj.__path = path.join(newPath, beMoveObj.name); // 构建新的路径
        targetObj.children.push(beMoveObj);
    }

    // 文件删除
    deleteFile(relativePath) {
        let { targetObj, fatherObj } = this.__getFileObjByPath(relativePath);

        if (fatherObj == undefined) return; // 根文件无法删除
        for (let index in fatherObj.children) {
            // console.log(fatherObj.children[index].__path)
            if (fatherObj.children[index].__path == relativePath) {
                fatherObj.children.splice(index, 1)
                return targetObj;
            }
        }
    }

    // 通过文件的相对地址得到文件对象和其父对象
    __getFileObjByPath(path) {
        let names = path.split("/");
        let root = this.virtualFileObj;
        if (path == "/") return { targetObj: root, fatherObj: root };

        let targetObj = undefined;
        for (let index in names) {
            for (let json of root.children) {
                if (json.name == names[index]) {
                    if (index == names.length - 1) {
                        targetObj = json
                        break;
                    }
                    if (json.children != undefined) {
                        root = json;
                        break;
                    }
                }
            }
        }
        return { targetObj, fatherObj: root };
    }

    getVirtualFileObj() {
        this.virtualFileObj = this.__files2Json(this.dirPath);
        return this.virtualFileObj;
    }
}

module.exports.VirtualFile = VirtualFile;
