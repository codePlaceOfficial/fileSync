const _ = require("loadsh")

const EVENT_TYPE = {
    changeFileContent: "CHANGE_FILE_CONTENT", createFile: "CREATE_FILE",
    createDir: "CREATE_DIR", deleteFile: "DELETE_FILE",
    getFileContent: "GET_FILE_CONTENT", moveFile: "MOVE_FILE",
    renameFile: "RENAME_FILE", resetFiles: "RESET_VIRTUAL_FILE",
    setFileContent: "SET_FILE_CONTENT"
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
    moveFileEvent: (oldPath, newPath) => {
        return __generateEvent(EVENT_TYPE.moveFile, { virtualPath: oldPath, newPath })
    },
    getFileContentEvent: (path, data) => {
        return __generateEvent(EVENT_TYPE.getFileContent, { virtualPath: path, data: data })
    },
    renameFileEvent: (path, newName) => {
        return __generateEvent(EVENT_TYPE.renameFile, { virtualPath: path, newName })
    },
    changeFileContentEvent: (filePath, content) => {
        return __generateEvent(EVENT_TYPE.changeFileContent, { virtualPath: filePath, content })
    }
}

module.exports.emitEvent = (event, vfs) => {
    // 如果为单独event则变为数组
    vfs.eventEmiter(event);
}

module.exports.setEventEmiter = (eventEmiter, vfs) => {
    vfs.eventEmiter = eventEmiter;
}

__execEvent = (event, virtualFile) => {
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
            virtualFile.renameFile(event.data.virtualPath, event.data.newName)
            break;
        case EVENT_TYPE.deleteFile:
            virtualFile.deleteFile(event.data.virtualPath)
            break;
        case EVENT_TYPE.moveFile:
            virtualFile.moveFile(event.data.virtualPath, event.data.newPath)
            break;
        default:
            break;
    }
}

module.exports.serverDefaultExecEvent = (event, virtualFile) => {
    switch (event.eventType) {
        case EVENT_TYPE.createDir:
        case EVENT_TYPE.createFile:
        case EVENT_TYPE.renameFile:
        case EVENT_TYPE.deleteFile:
            __execEvent(event, vfs);
            break;
        case EVENT_TYPE.getFileContent:
            virtualFile.getFileContent(event.data.virtualPath).then(
                (data) => {
                    this.emitEvent(this.generateEvent.getFileContentEvent(event.data.virtualPath, data), virtualFile)
                }
            )
            return;
        case EVENT_TYPE.changeFileContent:
            virtualFile.changeFileContent(event.data.virtualPath, event.data.content)
            break;
    }
}
module.exports.clientDefaultExecEvent = (event, virtualFile) => {
    switch (event.eventType) {
        case EVENT_TYPE.createDir:
        case EVENT_TYPE.createFile:
        case EVENT_TYPE.renameFile:
        case EVENT_TYPE.deleteFile:
        case EVENT_TYPE.getFileContent:
            __execEvent(event, virtualFile);
            break;
        case EVENT_TYPE.getFileContent:
            virtualFile.setFileContent(event.data.virtualPath, event.data.data);
            return;
        case EVENT_TYPE.changeFileContent:
            console.log(event.data.virtualPath,"change")
            break;
    }
}


module.exports.EVENT_TYPE = EVENT_TYPE