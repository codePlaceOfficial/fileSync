const chokidar = require('chokidar');
const util = require('util')
const {FileJson} = require("../../services/index")
const path = require("path");


let fileJson = new FileJson(path.join(__dirname , "./files"));
let json = fileJson.getfileJson();
// console.log(json)
// fileJson.getFileContent("123/2.txt").then(console.log)
// fileJson.editFile("123/2.txt","qwe")

// console.log(util.inspect(json, {showHidden: false, depth: null}));
  
// console.log(fileJson.__getObjByPath("123").targetObj)
// console.log(fileJson.renameFile("123","321"))
// fileJson.deleteFile("123");
console.log(fileJson.moveFile("123/1.txt","123/456"))


// One-liner for current directory
// const watcher = chokidar.watch('./files');
// watcher.on('all', (path, stats) => {

// });

// var fs = require('fs');
// var path = require('path');

// function traversalFolder(dir, fatherJson = []) {
//   const files = fs.readdirSync(dir);
//   files.forEach((item, index) => {
//     var fullPath = path.join(dir, item);
//     const stat = fs.statSync(fullPath);
//     if (stat.isDirectory()) {
//       let dirJson = {
//         type: "dir",
//         name: item,
//         children: []
//       };// 构建父目录
//       fatherJson.push(dirJson);
//       traversalFolder(path.join(dir, item), dirJson.children);
//     } else {
//       let fileJson = {
//         type: "file",
//         name: item
//       }
//       fatherJson.push(fileJson);
//     }
//   });
//   return fatherJson;
// }


// let fatherJson = traversalFolder("../watchFile/files");
// console.log(fatherJson);

// function traversalFolder(basePath) {
//   let fileJson = {};
//   basePath = path.join(basePath, ""); // 将路径处理为标准的形式
//   let dirs = [basePath]
//   while (dirs.length > 0) {
//     let dirPath = dirs.pop();
//     let files = fs.readdirSync(dirPath);
//     // console.log(dirPath);
//     let relativePath = path.relative(basePath, dirPath) // 获得相对路径  
//     let dirJson;//文件夹

//     // fileJson[relativePath] = {
//     //   type: "dir",
//     //   path: relativePath,
//     //   name: path.basename(relativePath),
//     //   children: []
//     // };// 构建父目录
//     let fatherJson;
//     fatherJson = 

//     // console.log(path.basename(relativePath))
//     files.forEach((item, index) => {
//       var fullPath = path.join(dirPath, item);
//       const stat = fs.statSync(fullPath);
//       if (stat.isDirectory()) {

//         dirs.push(path.join(dirPath, item));
//       } else {
//         // console.log(fullPath);
//       }
//     });
//   }
// }

// traversalFolder("../../node_modules");

