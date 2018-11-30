const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

let storeList = "";

ipcRenderer.on("showResults", function(e, _storeList) {
    storeList = _storeList;
    console.log(storeList);

    let para = document.createElement("p");
    let node = document.createTextNode(storeList);
    para.appendChild(node);

    let element = document.getElementById("tableDiv");
    element.appendChild(para);
});