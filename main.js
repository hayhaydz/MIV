const { app, BrowserWindow, screen, ipcMain } = require("electron");

let win = null;
const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    win = new BrowserWindow({
        // width: 700,
        // height: 550,
        resizable: false,
        frame: false,
        transparent: true,
        fullscreen: true,
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
    win.setFullScreen(false);
    let size = arg;
    console.log(size);
    // win.setSize(size[0], size[1]);
    win.setSize(500, 700);
    console.log(win.getSize());
    event.reply('resize-window-response', 'resize complete');
    // win.setPosition(50, 50);
    
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