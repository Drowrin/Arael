const {app, BrowserWindow, globalShortcut} = require('electron')
const path = require('path')

let mainWindow

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: { experimentalCanvasFeatures: true },
        fullscreenable: true
    })

    mainWindow.setMenu(null);

    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', () => {
    globalShortcut.register('CommandOrControl+F', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
    globalShortcut.register('CommandOrControl+D', () => {
        mainWindow.webContents.openDevTools();
        mainWindow.webContents.send('toggle-debug');
    });
    createWindow();
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    if (mainWindow === null) createWindow()
})