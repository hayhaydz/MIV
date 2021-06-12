const { app, BrowserWindow, screen, ipcMain } = require("electron");

let win = null;
const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    win = new BrowserWindow({
        width: 800,
        height: 750,
        resizable: false,
        frame: false,
        transparent: true,
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

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

ipcMain.on('resize-window', (event, arg) => {
    let size = arg;
    win.setSize(size[0], size[1]);
    // win.setPosition(50, 50);
    event.reply('resize-window-response', 'resize complete');
});

ipcMain.on('close', () => {
    win.close();
});

ipcMain.on('fullscreen', () => {
    win.setFullScreen(true);
});

ipcMain.on('disableFullscreen', () => {
    win.setFullScreen(false);
});

ipcMain.on('console-log', (event, arg) => {
    console.log(arg);
});