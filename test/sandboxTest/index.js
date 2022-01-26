const path = require("path");

const VirtualFileServer = require("../../src/virtualFileServer");
const { SandboxManager } = require("../../../sandbox");
const sandboxManager = new SandboxManager(50);
sandboxManager.createSandbox().then(sandbox => {
    // sandbox.container.runExec(['/bin/bash', '-c', `echo ${`"333222111 \n32111"`} > ./1.txt`]).then(() => {
    //     sandbox.container.runExec(['/bin/bash', '-c', `cat ./1.txt`]).then(console.log)
    // })

    // sandbox.container.runExec(['/bin/bash', '-c', `touch ${path.join("./","/123.txt")}`]).then(console.log)
    
    // sandbox.container.kill();

})