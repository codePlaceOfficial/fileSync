const _ = require("loadsh")

const EVENT_TYPE = {
    changeFile: "CHANGE_FILE", createFile: "CREATE_FILE",
    createDir: "CREATE_DIR", deleteFile: "DELETE_FILE",
    getFileContent: "GET_FILE_CONTENT", moveFile: "MOVE_FILE",
    renameFile: "RENAME_FILE", resetFiles: "RESET_VIRTUAL_FILE"
};

__generateEvent = (eventType, data) => {
    let event = {
        eventType,
        data
    }
    return event;
}

module.exports.generateEvent = {
    createDirEvent: (dirPath, dirName) => {
       return __generateEvent(EVENT_TYPE.createDir, { virtualPath: dirPath, dirName })
    },
    createFileEvent: (dirPath, fileName) => {
        return __generateEvent(EVENT_TYPE.createFile, { virtualPath: dirPath, fileName })
    },
    changeFileEvent: (filePath, data) => {
        return __generateEvent(EVENT_TYPE.changeFile, { virtualPath: filePath, data })
    },
    deleteFileEvent: (filePath) => {
        return __generateEvent(EVENT_TYPE.deleteFile, { virtualPath: filePath })
    },
    moveFileEvent: (oldPath,newPath) => {
        return __generateEvent(EVENT_TYPE.moveFile, { virtualPath: oldPath,newPath })
    },
    getFileContentEvent:(path)=>{
        return __generateEvent(EVENT_TYPE.getFileContent, { virtualPath: path })
    },
    // resetFilesEvent:() =>{
        
    // }
}

module.exports.emitEvents = (events, vfs) => {
    if (!events) return;
    // 如果为单独event则变为数组
    if (!Array.isArray(events)) events = [events]
    else events = _.uniqWith(events, _.isEqual); // 过滤冗余事件

    vfs.eventEmiter(events);
}

module.exports.setEventEmiter = (eventEmiter, vfs) => {
    vfs.eventEmiter = eventEmiter;
}

module.exports.execEvents = (events, virtualFile) => {
    for (let event of events) {
        switch (event.eventType) {
            case EVENT_TYPE.changeFile:
                virtualFile.changeFileContent(event.data.virtualPath, event.data.data)
                break;
            case EVENT_TYPE.createDir:
                virtualFile.createDir(event.data.virtualPath, event.data.dirName)
                break;
            case EVENT_TYPE.createFile:
                virtualFile.createFile(event.data.virtualPath, event.data.fileName)
                break;
            case EVENT_TYPE.renameFile:
                virtualFile.createDir(event.data.virtualPath, event.data.newName)
                break;
            case EVENT_TYPE.deleteFile:
                virtualFile.deleteFile(event.data.virtualPath)
                break;
            case EVENT_TYPE.getFileContent:
                return virtualFile.getFileContent(event.data.virtualPath)
            case EVENT_TYPE.moveFile:
                return virtualFile.getFileContent(event.data.virtualPath, event.data.newPath)
            case EVENT_TYPE.resetFiles:
                // 客户端和浏览器端的实现不同
                return virtualFile.resetVirtualFile(event.data == undefined ? "" : event.data.virtualFile)
            default:
                break;
        }
    }
}


module.exports.EVENT_TYPE = EVENT_TYPE