const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

let columbusFile = __dirname + "/data/ColumbusList.txt";
let resilientFile = __dirname + "/data/ResilientList.txt";
let DSPFile = __dirname + "/data/DSPList.txt";
let CHSFile = __dirname + "/data/CHSList.txt";
let configFile = __dirname + "/connection.json";

global.sqlConfigString = fs.readFileSync(configFile).toString();

app.on("ready", function() {
  // Create the browser window.
  win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webSecurity: true
  });

  // and load the index.html of the app.
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "electronIndex.html"),
      protocol: "file:",
      slashes: true
    })
  );
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.once("ready-to-show", () => {
    //getMasterLBList();
    win.webContents.send("initPageContent");
    win.show();
  });

  const winMenu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(winMenu);
});

// ipcMain.on('showServerWindow', function(e,data){
//   serverWin = new BrowserWindow({
//     show: false,
//     width: 800,
//     height: 600
//   });
//   serverWin.loadURL(
//     url.format({
//       pathname: path.join(__dirname, "serverWindow.html"),
//       protocol: "file:",
//       slashes: true
//     })
//   );
//   serverWin.on("closed", () => {
//     serverWin = null;
//   });

//   serverWin.once("ready-to-show", () => {
//     serverWin.webContents.send("showServerList", data);
//     serverWin.show();
//   });
// })

ipcMain.on('getFilterLists',getFilterLists);

function getFilterLists() {

  let columbusList = [];
  let resilientList = [];
  let CHSList = [];
  let DSPList = [];

  let data,allTextLines, headers;
  
  data = fs.readFileSync(columbusFile).toString();

  allTextLines = data.split(/\r\n|\n/);
  headers = allTextLines[0].split(",");

  for (let i = 1; i < allTextLines.length; i++) {
    // split content based on comma
    let data = allTextLines[i].split(",");
    if (data.length == headers.length) {
      columbusList.push(data[0].replace(/['"]+/g, ""));
    }
  }

  data = fs.readFileSync(resilientFile).toString();

  allTextLines = data.split(/\r\n|\n/);
  headers = allTextLines[0].split(",");

  for (let i = 1; i < allTextLines.length; i++) {
    // split content based on comma
    let data = allTextLines[i].split(",");
    if (data.length == headers.length) {
      resilientList.push(data[0].replace(/['"]+/g, ""));
    }
  }

  data = fs.readFileSync(DSPFile).toString();

  allTextLines = data.split(/\r\n|\n/);
  headers = allTextLines[0].split(",");

  for (let i = 1; i < allTextLines.length; i++) {
    // split content based on comma
    let data = allTextLines[i].split(",");
    if (data.length == headers.length) {
      DSPList.push(data[0].replace(/['"]+/g, ""));
    }
  }

  data = fs.readFileSync(CHSFile).toString();

  allTextLines = data.split(/\r\n|\n/);
  headers = allTextLines[0].split(",");

  for (let i = 1; i < allTextLines.length; i++) {
    // split content based on comma
    let data = allTextLines[i].split(",");
    if (data.length == headers.length) {
      CHSList.push(data[0].replace(/['"]+/g, ""));
    }
  }

  win.webContents.send("setFilterLists", columbusList, resilientList, DSPList, CHSList);
}

ipcMain.on('spawnMap', function (e,data,mode,filters){
  mapWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600
  });
  mapWin.loadURL(
    url.format({
      //pathname: path.join(__dirname, "map","index.html"),
      //pathname: path.join(__dirname, "leaf","leaf.html"),
      pathname: path.join(__dirname, "google","google.html"),
      protocol: "file:",
      slashes: true
    })
  );
  mapWin.on("closed", () => {
    mapWin = null;
  });

  mapWin.once("ready-to-show", () => {
    mapWin.webContents.send("mapMyData", data,mode,filters);
    mapWin.show();
  });
})


ipcMain.on('selectedFromMap', function(e,data){
  win.webContents.send("refreshFromMap",data);
})

ipcMain.on('showResultsWindow', function(e,data){
  resultsWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600
  });
  resultsWin.loadURL(
    url.format({
      pathname: path.join(__dirname, "results.html"),
      protocol: "file:",
      slashes: true
    })
  );
  resultsWin.on("closed", () => {
    resultsWin = null;
  });

  resultsWin.once("ready-to-show", () => {
    resultsWin.webContents.send("showResults", data);
    resultsWin.show();
  });
})

// class MasterLB {
//   constructor(envname, hostname, endpoint, username, password) {
//     this.envname = envname;
//     this.hostname = hostname;
//     this.endpoint = endpoint;
//     this.username = username;
//     this.password = password;
//   }
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

//app.on('ready', createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {

  let regEx =  new RegExp("^https:\/\/.+corp.internal:");
  let res = regEx.exec(url);
  if (res) {
    // Verification logic.
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

const template = [
  {
    label: "Edit",
    submenu: [{ role: "copy" }, { role: "selectall" }]
  },
  {
    label: "View",
    submenu: [
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        }
      },
      {
        label: "Toggle Developer Tools",
        accelerator:
          process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
        }
      },
      { type: "separator" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" },
      { type: "separator" },
      { role: "togglefullscreen" }
    ]
  },
  {
    role: "window",
    submenu: [{ role: "minimize" }, { role: "close" }]
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click() {
          require("electron").shell.openExternal("http://electron.atom.io");
        }
      }
    ]
  }
];

if (process.platform === "darwin") {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "services", submenu: [] },
      { type: "separator" },
      { role: "hide" },
      { role: "hideothers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" }
    ]
  });
  // Edit menu.
  template[1].submenu.push(
    { type: "separator" },
    {
      label: "Speech",
      submenu: [
        {
          role: "startspeaking"
        },
        {
          role: "stopspeaking"
        }
      ]
    }
  );
  // Window menu.
  template[3].submenu = [
    {
      label: "Close",
      accelerator: "CmdOrCtrl+W",
      role: "close"
    },
    {
      label: "Minimize",
      accelerator: "CmdOrCtrl+M",
      role: "minimize"
    },
    {
      label: "Zoom",
      role: "zoom"
    },
    {
      type: "separator"
    },
    {
      label: "Bring All to Front",
      role: "front"
    }
  ];
}
