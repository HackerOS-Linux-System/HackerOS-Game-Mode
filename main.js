const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let config = { autoLaunch: false, shortcut: 'CommandOrControl+G' };

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 500,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
                                   nodeIntegration: true,
                                   contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.setIgnoreMouseEvents(true); // Make it non-interactive, just overlay
    mainWindow.hide(); // Start hidden
}

app.whenReady().then(() => {
    // Load config
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    createWindow();

    // Register global shortcut
    const ret = globalShortcut.register(config.shortcut, () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    if (!ret) {
        console.log('Shortcut registration failed');
    }

    // If autoLaunch is true, show immediately
    if (config.autoLaunch) {
        mainWindow.show();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
