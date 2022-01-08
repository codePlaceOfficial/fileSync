
/**
 * 文件的Json格式
 */
var fs = require('fs');
var path = require('path');
const FILE_TYPE = { dir: "DIR", file: "FILE" };
const util = require('util')
const _ = require("loadsh")

class VirtualFileService {
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
    // // 得到文件内容
    // getFileContent(relativePath) {
    //     return new Promise((resolve, reject) => {
    //         fs.readFile(this.__getRealPath(relativePath), "utf-8", function (err, data) {
    //             if (err) reject("文件读取失败");
    //             else resolve(data);
    //         });
    //     })
    // }

    // showFileJson() {
    //     // 展现fileJson
    //     console.log(util.inspect(this.fileJson, { showHidden: false, depth: null }));
    // }

    // // 修改文件内容
    // changeFileContent(relativePath, data) {
    //     fs.writeFileSync(this.__getRealPath(relativePath), data);
    // }

    // // 文件重命名
    // renameFile(relativePath, newName) {
    //     let { targetObj, fatherObj } = this.__getObjByPath(relativePath)
    //     // 改名同时更改路径
    //     _.assign(targetObj, {name:newName,__path:path.join(fatherObj.__path, newName)})
    //     return this.fileJson;
    // }

    // // 文件删除
    // deleteFile(relativePath) {
    //     let { targetObj, fatherObj } = this.__getObjByPath(relativePath);
    //     if (fatherObj == undefined) return; // 根文件无法删除
    //     for (let index in fatherObj.children) {
    //         if (fatherObj.children[index].__path == relativePath) {
    //             fatherObj.children.splice(index, 1)
    //             return targetObj;
    //         }
    //     }
    // }

    // // 文件移动位置
    // // newPath为其父文件的位置
    // moveFile(relativePath, newPath) {
    //     let { targetObj, fatherObj } = this.__getObjByPath(newPath);
    //     let beMoveObj = this.deleteFile(relativePath); // 待移动的数据
    //     beMoveObj.__path = path.join(newPath, beMoveObj.name); // 构建新的路径
    //     targetObj.children.push(beMoveObj);
    // }

    // // 通过文件的相对地址得到文件对象和其父对象
    // __getObjByPath(path) {
    //     let names = path.split("/");
    //     let root = this.fileJson;
    //     let targetObj = undefined;
    //     for (let index in names) {
    //         for (let json of root.children) {
    //             if (json.name == names[index]) {
    //                 if (index == names.length - 1) {
    //                     targetObj = json
    //                     break;
    //                 }
    //                 if (json.children != undefined) {
    //                     root = json;
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    //     return { targetObj, fatherObj: root };
    // }

    // __getRealPath(relativePath) {
    //     return path.join(this.dirPath, relativePath);
    // }

    // getfileJson() {
    //     this.fileJson = this.__files2Json(this.dirPath);
    //     return this.fileJson;
    // }

    // __buildJsonFile(type, name, fatherPath) {
    //     let jsonFile = {
    //         type,
    //         name,
    //         // __fatherPath:fatherPath,
    //         __path: path.join(fatherPath, name)
    //     };
    //     if (type == FILE_TYPE.dir) jsonFile.children = [];
    //     return jsonFile;
    // }

    // /**
    //  * 将文件目录转为json格式
    //  * 不附带文件内容
    //  * fatherJson 默认为 {name = "",path="/"}的dir文件
    //  */
    // __files2Json(dir, fatherJson = this.__buildJsonFile(FILE_TYPE.dir, "", "/")) {
    //     const files = fs.readdirSync(dir);
    //     files.forEach((item, index) => {
    //         var fullPath = path.join(dir, item);
    //         const stat = fs.statSync(fullPath);
    //         if (stat.isDirectory()) {
    //             let relativePath = path.relative(this.dirPath, fullPath)
    //             let dirJson = this.__buildJsonFile(FILE_TYPE.dir, item, fatherJson.__path);
    //             fatherJson.children.push(dirJson);
    //             this.__files2Json(path.join(dir, item), dirJson);
    //         } else {
    //             let relativePath = path.relative(this.dirPath, fullPath)
    //             let newFileJson = this.__buildJsonFile(FILE_TYPE.file, item, fatherJson.__path);
    //             fatherJson.children.push(newFileJson);
    //         }
    //     });
    //     return fatherJson;
    // }
}

module.exports.VirtualFileService = VirtualFileService;
