const { app, BrowserWindow, screen, ipcMain } = require("electron");

let win = null;
let maxSize = { width: 0, height: 0 };

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
    // win.removeMenu();
    // win.webContents.openDevTools();
};

app.whenReady().then(() => {
    setTimeout(function() {
        createWindow();
    }, 10);

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

ipcMain.on('resize-window', (event, arg) => {
    win.setFullScreen(false);
    let size = arg;
    win.setResizable(true);
    win.setSize(size[0], size[1]);
    win.setResizable(false);
    win.setPosition(50, 50);
    event.reply('resize-window-response', 'resize complete');
});

ipcMain.on('close', () => {
    win.close();
});

ipcMain.on('fullscreen', (event) => {
    win.setFullScreen(true);
    event.reply('fullscreen-response', 'fullscreen complete');
});

ipcMain.on('disableFullscreen', (event) => {
    win.setFullScreen(false);
    event.reply('disableFullscreen-response', 'disable fullscreen complete');
});

ipcMain.on('console-log', (event, arg) => {
    console.log(arg);
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});