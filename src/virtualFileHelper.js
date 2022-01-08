const util = require('util')
var path = require('path');
const FILE_TYPE = { dir: "DIR", file: "FILE" };
const _ = require("loadsh")

module.exports = {
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
}