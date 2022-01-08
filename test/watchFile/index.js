const path = require("path");
const { VirtualFileServer } = require("../../src/virtualFileServer");
const { VirtualFile } = require("../../src/virtualFile");
const virtualFileEvent = require("../../src/virtualFileEvent")
let virtualFileServer = new VirtualFileServer(path.join(__dirname, "./files"));
let virtualFile = new VirtualFile();

const PubSub = require('pubsub-js'); // 模拟socket

PubSub.subscribe("sendClientEvent",(flag,events) => {
    virtualFileEvent.execEvents(events,virtualFile);
    console.log(flag)
    console.log(events)
})

PubSub.subscribe("sendServerEvent",(flag,events) => {
    virtualFileEvent.execEvents(events,virtualFileServer);
    console.log(flag)
    console.log(events)
})

virtualFileEvent.setEventEmiter((events) => {
    PubSub.publish("sendClientEvent",events)
},virtualFileServer)

virtualFileEvent.setEventEmiter((events) => {
    PubSub.publish("sendServerEvent",events)
},virtualFile)

virtualFile.initialize();

// virtualFileServer.execEvent(virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.changeFile, { virtualPath: "/1.txt", data: "123" }))
// virtualFileServer.execEvent(virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.createDir,{ virtualPath: "/", dirName: "1234" }))
// virtualFileServer.execEvent(virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.createFile,{ virtualPath: "/", fileName: "12" }))
// virtualFileServer.execEvent(virtualFileEvent.generateEvent(virtualFileEvent.EVENT_TYPE.getFileContent,{ virtualPath: "/1.txt"})).then(console.log);




