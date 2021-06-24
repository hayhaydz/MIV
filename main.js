const { app, BrowserWindow, screen, ipcMain, dialog } = require("electron");
const fs = require("fs");

let win = null;
let maxSize = { width: 0, height: 0 };
let ready = false;

const createWindow = () => {
    maxSize = screen.getPrimaryDisplay().workAreaSize;

    win = new BrowserWindow({
        width: 100,
        height: 100,
        resizable: false,
        frame: false,
        transparent: true,
        fullscreen: true,
        maxWidth: maxSize.width,
        maxHeight: maxSize.height,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');
    win.focus();
    // win.removeMenu();
    win.webContents.openDevTools();
};

app.whenReady().then(() => {
    setTimeout(function() {
        createWindow();
    }, 10);

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    ready = true;
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

ipcMain.on('resize-window', (event, arg) => {
    if(ready) {
        win.setFullScreen(false);
        let size = arg;
        win.setResizable(true);
        win.setSize(size[0], size[1]);
        win.setResizable(false);
        win.setPosition(50, 50);
        event.reply('resize-window-response', 'resize complete');
    }
});

ipcMain.on('close', () => {
    if(ready) {
        win.close();
    }
});

ipcMain.on('fullscreen', (event) => {
    if(ready) {
        win.setFullScreen(true);
        event.reply('fullscreen-response', 'fullscreen complete');
    }
});

ipcMain.on('disableFullscreen', (event) => {
    if(ready) {
        win.setFullScreen(false);
        event.reply('disableFullscreen-response', 'disable fullscreen complete');
    }
});

ipcMain.on('console-log', (event, arg) => {
    if(ready) {
        console.log(arg);
    }
});

ipcMain.on("chooseFile", (event, arg) => {
    if(ready) {
        const result = dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
        });
    
        result.then(({canceled, filePaths, bookmarks}) => {
            console.log(filePaths);
            if(filePaths !== undefined) {
                const base64 = fs.readFileSync(filePaths[0]).toString('base64');
            }
            event.reply("chosenFile", base64);
        });
    }
});

// read the file and send data to the render process
ipcMain.on('getFileData', (event) => {
    if(ready) {
        let data = null;
        if (process.platform == 'win32' && process.argv.length >= 2) {
            let openFilePath = process.argv[1];
            data = openFilePath;
        }
    
        event.reply('getFileData-response', data);
    }
})