const path = require("path");
const { VirtualFileServer } = require("../src/virtualFileServer");
const { VirtualFileClient } = require("../src/virtualFileClient");
const virtualFileEvent = require("../src/virtualFileEvent")
const util = require("util")
let fs = require("fs");
let virtualFileServer = new VirtualFileServer(path.join(__dirname, "./files"));
let virtualFileClient = new VirtualFileClient();
let _ = require("loadsh")
const PubSub = require('pubsub-js'); // 模拟socket.IO

PubSub.subscribe("sendClientEvent", (flag, events) => {
    virtualFileEvent.clientDefaultExecEvent(events, virtualFileClient);
})

PubSub.subscribe("sendServerEvent", (flag, events) => {
    virtualFileEvent.serverDefaultExecEvent(events, virtualFileServer);
})

virtualFileEvent.setEventEmiter((events) => {
    PubSub.publish("sendClientEvent", events)
}, virtualFileServer)

virtualFileEvent.setEventEmiter((events) => {
    PubSub.publish("sendServerEvent", events)
}, virtualFileClient)



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
        virtualFileClient.showVirtualFile()
        setTimeout(() => {
            virtualFileClient.showVirtualFile()
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
    virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.createDirEvent("/","dir5"),virtualFileClient);
    virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.createFileEvent("/dir3","1.txt"),virtualFileClient);
    virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.renameFileEvent("/dir5","/dir1"),virtualFileClient);
    virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.setFileContentEvent("/dir3/1.txt","123321"),virtualFileClient);
    virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.moveFileEvent("/dir3/1.txt","/dir1"),virtualFileClient);
    setTimeout(() => {
        virtualFileEvent.emitEvent(virtualFileEvent.generateEvent.getFileContentEvent("/dir1/1.txt"),virtualFileClient);
        setTimeout(() => {
            virtualFileClient.showVirtualFile()
        }, 100);
    }, 100);
}

function testSubEvent() {
    virtualFileClient.subscribe(virtualFileEvent.EVENT_TYPE.createDir,(data) => {
        console.log("client --- create Dir",data);
    })

    virtualFileClient.subscribe(virtualFileEvent.EVENT_TYPE.createFile,(data) => {
        console.log("client --- create file",data);
    })

    virtualFileClient.subscribe(virtualFileEvent.EVENT_TYPE.deleteFile,(data) => {
        console.log("client --- delete file",data);
    })
    // change事件显示不出来，应该是chokidar的bug,手动修改文件并保存，可以显示出来
    virtualFileClient.subscribe(virtualFileEvent.EVENT_TYPE.fileChange,(data) => {
        console.log("client --- changeFile",data);
    })
    virtualFileClient.subscribe(virtualFileEvent.EVENT_TYPE.getFileContent,(data) => {
        console.log("client --- getFileContent",data);
    })


    virtualFileServer.subscribe(virtualFileEvent.EVENT_TYPE.createDir,(data) => {
        console.log("server --- createDir",data)
    })
}
