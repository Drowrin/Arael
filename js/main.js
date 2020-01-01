const {app, BrowserWindow, globalShortcut} = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const path = require('path');

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreenable: true
    });

    electronLocalshortcut.register(win, 'CommandOrControl+Shift+F', () => {
        win.setFullScreen(!win.isFullScreen());
    });
    
    electronLocalshortcut.register(win, 'CommandOrControl+Shift+D', () => {
        win.webContents.send('toggle-debug');
    });

    electronLocalshortcut.register(win, 'CommandOrControl+Shift+I', () => {
        win.webContents.openDevTools();
    });

    win.setMenu(null);

    win.loadFile('index.html');

    win.on('closed', function () {
        win = null;
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (win === null) createWindow();
});