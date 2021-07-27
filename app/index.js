const { app, BrowserWindow, screen, ipcMain, dialog } = require("electron");
const fs = require("fs");

let win;
let childWin;
let maxSize = { width: 0, height: 0 };
let ready = false;
let modalOpen = false;
let currentModal = "";
let winPos = {
    x: 100,
    y: 100,
}
let childWinPos = {
    x: 0,
    y: 0,
};

const createWindow = () => {
    maxSize = screen.getPrimaryDisplay().workAreaSize;

    win = new BrowserWindow({
        width: 400,
        height: 500,
        minHeight: 400,
        minWidth: 500,
        resizable: false,
        frame: false,
        transparent: true,
        fullscreen: true,
        maxWidth: maxSize.width,
        maxHeight: maxSize.height,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
        }
    });

    win.loadFile('app/render/html/index.html');
    win.focus();

    childWin = new BrowserWindow({
        parent: win,
        width: 360,
        height: 460,
        maxWidth: 360,
        maxHeight: 460,
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    childWin.loadFile('app/render/html/child.html');
    childWin.hide();

    childWin.on('moved', () => {
        childWinPos.x = childWin.getPosition()[0];
        childWinPos.y = childWin.getPosition()[1];
    });

    win.on('moved', () => {
        winPos.x = win.getPosition()[0];
        winPos.y = win.getPosition()[1];
    })
    
    // win.webContents.openDevTools();
    // childWin.webContents.openDevTools();
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
        win.setPosition(winPos.x, winPos.y);
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

ipcMain.on('chooseFile', (event, arg) => {
    if(ready) {
        const result = dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
        });
    
        result.then(({canceled, filePaths, bookmarks}) => {
            if(filePaths !== undefined) {
                const base64 = fs.readFileSync(filePaths[0]).toString('base64');
                event.reply("chosenFile", base64);
            }
        });
    }
});

ipcMain.on('getFileData', (event) => {
    if(ready) {
        let data = null;
        if (process.platform == 'win32' && process.argv.length >= 2) {
            let openFilePath = process.argv[1];
            data = openFilePath;

            if(data !== ".") {
                const base64 = fs.readFileSync(data).toString('base64');
                event.reply('getFileData-response', base64);
            }
        }
    }
});

ipcMain.on('toggleModal', (event, arg) => {
    if(arg !== currentModal) {
        currentModal = arg;
        childWin.show();
        if(childWinPos.x == 0) {
            let mainWinPos = win.getPosition();
            let centerPadding = {
                x: Math.round(win.getSize()[0] / 2 - 360 / 2),
                y: Math.round(win.getSize()[1] / 2 - 460 / 2),
            };
            childWin.setPosition(mainWinPos[0] + centerPadding.x, mainWinPos[1] + centerPadding.y);
        } else {
            childWin.setPosition(childWinPos.x, childWinPos.y);
        }
        win.webContents.send('toggleModal', [arg, modalOpen]);
        childWin.webContents.send('toggleModal', [arg, modalOpen]);
        modalOpen = true;
    } else {
        currentModal = "";
        childWin.hide();
        win.focus();
        win.webContents.send('toggleModal', [arg, modalOpen]);
        childWin.webContents.send('toggleModal', [arg, modalOpen]);
        modalOpen = false;
    }
});

ipcMain.handle('isModalOpen', async (event) => {
    return modalOpen;
});