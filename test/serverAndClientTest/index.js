const path = require("path");
const VirtualFileServer = require("../../src/virtualFileServer");
const { VirtualFileClient } = require("../../../virtualFileClient");
const virtualFileEvent = require("../../../virtualFileEvent")
const { EventEmitter } = virtualFileEvent

const util = require("util")
let fs = require("fs");

const PubSub = require('pubsub-js'); // 模拟socket.IO

const vfServerEventEmitter = new EventEmitter((events) => {
    PubSub.publish("sendClientEvent", events)
})
const vfClientEventEmitter = new EventEmitter((events) => {
    PubSub.publish("sendServerEvent", events)
})

let virtualFileServer = new VirtualFileServer(path.join(__dirname, "./files"), vfServerEventEmitter);
let virtualFileClient = new VirtualFileClient();

const showVirtualFile = (virtualFileObj) => {
    console.log(util.inspect(virtualFileObj, { showHidden: false, depth: null }));
}

PubSub.subscribe("sendClientEvent", (flag, events) => {
    virtualFileEvent.clientDefaultExecEvent(events, virtualFileClient);
})

PubSub.subscribe("sendServerEvent", (flag, events) => {
    virtualFileEvent.serverDefaultExecEvent(events, virtualFileServer);
})

// 添加文件
/**
 * files --| file1.txt
 *         | file2.txt
 *         | dir1 
 *         | dir2 ---------|file3.txt
 *         | dir3 ---------|file4.txt
 */
// 创建文件
function createFiles() {
    fs.mkdirSync(`${__dirname}/files`);
    fs.writeFileSync(`${__dirname}/files/file1.txt`, ``);
    fs.writeFileSync(`${__dirname}/files/file2.txt`, ``);
    fs.mkdirSync(`${__dirname}/files/dir1`);
    fs.mkdirSync(`${__dirname}/files/dir2`);
    fs.mkdirSync(`${__dirname}/files/dir3`);
    fs.writeFileSync(`${__dirname}/files/dir2/file3.txt`, ``);
    fs.writeFileSync(`${__dirname}/files/dir3/file4.txt`, ``);
}

// 修改文件
/**
 * files --| file9.txt
 *         | file2.txt
 *         | dir4 ---------|file4.txt (content:1234)
 *         | dir3 ---------|
 */
function changeFiles() {
    fs.renameSync(`${__dirname}/files/file1.txt`, `${__dirname}/files/file9.txt`)
    fs.renameSync(`${__dirname}/files/dir1`, `${__dirname}/files/dir4`)
    fs.renameSync(`${__dirname}/files/dir3/file4.txt`, `${__dirname}/files/dir4/file4.txt`)
    fs.writeFileSync(`${__dirname}/files/dir4/file4.txt`, "1234")
    rmFiles(`${__dirname}/files/dir2`)
}

function rmFiles(path = `${__dirname}/files`) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                rmFiles(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

// 测试服务器端的更改同步到用户端
function testServerToClient() {
    rmFiles();
    createFiles();
    testSubEvent();
    virtualFileServer.start();
    setTimeout(() => {
        changeFiles()
        showVirtualFile(virtualFileClient.getVirtualFile())
        setTimeout(() => {
            showVirtualFile(virtualFileClient.getVirtualFile())
            testClientToServer();
        }, 500);
    }, 500);
}
testServerToClient();

// 测试用户端的更改同步到用户端

/**
 * files --| file9.txt
 *         | file2.txt
 *         | dir4 ---------|file4.txt (content:1234)
 *         | dir3 
 *         | dir1 ---------|1.txt (content:77777)
 */
function testClientToServer() {

    vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.createDirEvent("/", "dir5"));
    vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.createFileEvent("/dir3", "1.txt"));
    vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.renameFileEvent("/dir5", "/dir1"));
    vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.setFileContentEvent("/dir3/1.txt", "123321"));
    vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.moveFileEvent("/dir3/1.txt", "/dir1"));
    setTimeout(() => {
        vfClientEventEmitter.emitEvent(virtualFileEvent.generateEvent.getFileContentEvent("/dir1/1.txt"));
        setTimeout(() => {
            showVirtualFile(virtualFileClient.getVirtualFile());
        }, 100);
    }, 100);
}

// todo
// 测试结果会有重复的错误，因为fileEvent目前处于同一地方，PubSub处于同一命名空间
function testSubEvent() {
    // vfClientEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.createDir, (data) => {
    //     console.log("client --- create Dir", data);
    // })

    // vfClientEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.createFile, (data) => {
    //     console.log("client --- create file", data);
    // })

    // vfClientEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.deleteFile, (data) => {
    //     console.log("client --- delete file", data);
    // })
    // // change事件显示不出来，应该是chokidar的bug,手动修改文件并保存，可以显示出来
    // vfClientEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.fileChange, (data) => {
    //     console.log("client --- changeFile", data);
    // })
    // vfClientEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.getFileContent, (data) => {
    //     console.log("client --- getFileContent", data);
    // })
    // vfServerEventEmitter.subscribe(virtualFileEvent.EVENT_TYPE.createDir, (data) => {
    //     console.log("server --- createDir", data)
    // })
}
