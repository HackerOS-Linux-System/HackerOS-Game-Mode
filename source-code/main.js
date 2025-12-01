const { app, BrowserWindow, ipcMain, Menu, screen, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const si = require('systeminformation');
const { uIOhook, UiohookKey } = require('uiohook-napi');

let mainWindow;
let config = { autoLaunch: false, shortcut: 'CommandOrControl+G' };
let updateInterval;
let isCtrlPressed = false;
let isRecording = false;
let interactRect = null;

async function collectStats() {
    const stats = {};

    try {
        // CPU Stats
        const cpuTemp = await si.cpuTemperature();
        stats.cpuTemp = cpuTemp.main !== null && cpuTemp.main !== undefined ? cpuTemp.main.toFixed(1) : '--';

        const currentLoad = await si.currentLoad();
        stats.cpuUsage = currentLoad.currentLoad ? currentLoad.currentLoad.toFixed(1) : '--';

        const cpu = await si.cpu();
        stats.cpuFreq = cpu.speed ? (cpu.speed * 1000).toFixed(0) : '--';

        stats.cpuCores = os.cpus().length; // Zastąpienie voltage liczbą rdzeni (zawsze osiągalne)

        const chassis = await si.chassis();
        stats.cpuFan = chassis.fans && chassis.fans.length > 0 ? chassis.fans[0].speed : '--';

        // GPU Stats (zbierane, ale nie wyświetlane w top-right)
        const graphics = await si.graphics();
        if (graphics.controllers && graphics.controllers.length > 0) {
            const gpu = graphics.controllers[0];
            stats.gpuTemp = gpu.temperatureGpu !== undefined && gpu.temperatureGpu !== null ? gpu.temperatureGpu.toFixed(1) : '--';
            stats.gpuUsage = gpu.utilizationGpu !== undefined && gpu.utilizationGpu !== null ? gpu.utilizationGpu.toFixed(1) : '--';
            stats.gpuFan = gpu.fanPercent !== undefined && gpu.fanPercent !== null ? gpu.fanPercent.toFixed(1) : '--';
            stats.gpuMem = gpu.memoryUsed && gpu.memoryTotal ? `${gpu.memoryUsed}/${gpu.memoryTotal}` : '--';
            stats.gpuPower = gpu.powerDraw !== undefined && gpu.powerDraw !== null ? gpu.powerDraw.toFixed(1) : '--';
        } else {
            stats.gpuTemp = '--';
            stats.gpuUsage = '--';
            stats.gpuFan = '--';
            stats.gpuMem = '--';
            stats.gpuPower = '--';
        }

        // RAM Usage
        const mem = await si.mem();
        stats.ramUsage = mem.used && mem.total ? `${(mem.used / 1024 / 1024 / 1024).toFixed(1)} / ${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB` : '--';

        // Disk Usage
        const fsSize = await si.fsSize();
        const root = fsSize.find(d => d.mount === '/' || d.mount === 'C:\\');
        stats.diskUsage = root ? `${(root.used / 1024 / 1024 / 1024).toFixed(1)} / ${(root.size / 1024 / 1024 / 1024).toFixed(1)} GB` : '--';

        // Battery
        const battery = await si.battery();
        stats.batteryLevel = battery.hasBattery && battery.percent !== null ? battery.percent : '--';

        // Uptime
        const time = await si.time();
        stats.uptime = time.uptime ? `${Math.floor(time.uptime / 3600)}h ${Math.floor((time.uptime % 3600) / 60)}m` : '--';

        // Network
        const defaultIface = await si.networkInterfaceDefault();
        const netStats = await si.networkStats(defaultIface);
        if (netStats.length > 0 && netStats[0].rx_sec !== null && netStats[0].tx_sec !== null) {
            stats.netDownload = (netStats[0].rx_sec / 1024 / 1024 * 8).toFixed(2);
            stats.netUpload = (netStats[0].tx_sec / 1024 / 1024 * 8).toFixed(2);
        } else {
            stats.netDownload = '--';
            stats.netUpload = '--';
        }

        stats.fps = '--'; // Zostawiamy, ale w renderer.js dodamy counter

        stats.loadAvg = os.loadavg().map(l => l.toFixed(2)).join(' ');
    } catch (error) {
        console.error('Error collecting stats:', error);
        // Fallback defaults
        stats.cpuTemp = '--';
        stats.cpuUsage = '--';
        stats.cpuFreq = '--';
        stats.cpuCores = os.cpus().length;
        stats.cpuFan = '--';
        stats.gpuTemp = '--';
        stats.gpuUsage = '--';
        stats.gpuFan = '--';
        stats.gpuMem = '--';
        stats.gpuPower = '--';
        stats.ramUsage = '--';
        stats.diskUsage = '--';
        stats.batteryLevel = '--';
        stats.uptime = '--';
        stats.netDownload = '--';
        stats.netUpload = '--';
        stats.fps = '--';
        stats.loadAvg = '--';
    }

    return stats;
}

function startUpdating() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(async () => {
        if (mainWindow && mainWindow.isVisible()) {
            const stats = await collectStats();
            mainWindow.webContents.send('update-stats', stats);
        }
    }, 1000);
}

function stopUpdating() {
    if (updateInterval) clearInterval(updateInterval);
}

function toggleWindow() {
    if (isRecording) {
        mainWindow.webContents.send('stop-recording');
        isRecording = false;
        mainWindow.show();
    } else if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        mainWindow.show();
    }
}

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        fullscreen: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
                                   nodeIntegration: false,
                                   contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.hide();

    mainWindow.on('show', startUpdating);
    mainWindow.on('hide', stopUpdating);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('get-rects');
    });
}

app.whenReady().then(() => {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    createWindow();

    // Użyj uiohook-napi do globalnego nasłuchu klawiszy na Waylandzie
    uIOhook.start();

    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Ctrl) isCtrlPressed = true;
        if (isCtrlPressed && e.keycode === UiohookKey.G) {
            console.log('Ctrl + G detected');
            toggleWindow();
        }
    });

    uIOhook.on('keyup', (e) => {
        if (e.keycode === UiohookKey.Ctrl) isCtrlPressed = false;
    });

        uIOhook.on('mousemove', (e) => {
            if (mainWindow && mainWindow.isVisible() && interactRect) {
                const display = screen.getPrimaryDisplay();
                const left = display.workArea.width - interactRect.right - interactRect.width;
                const right = display.workArea.width - interactRect.right;
                const top = interactRect.top;
                const bottom = interactRect.top + interactRect.height;
                if (e.x > left && e.x < right && e.y > top && e.y < bottom) {
                    mainWindow.setIgnoreMouseEvents(false);
                } else {
                    mainWindow.setIgnoreMouseEvents(true);
                }
            }
        });

        // Opcjonalne menu dla alternatywy
        const menu = Menu.buildFromTemplate([
            {
                label: 'Toggle Overlay',
                accelerator: 'Ctrl+G',
                click: toggleWindow
            }
        ]);
        Menu.setApplicationMenu(menu);
});

app.on('will-quit', () => {
    uIOhook.stop();
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

ipcMain.on('rects', (event, rects) => {
    if (rects && rects.topRight) {
        interactRect = rects.topRight;
    }
});

ipcMain.on('take-screenshot', async () => {
    mainWindow.hide();
    await new Promise(resolve => setTimeout(resolve, 100)); // Opóźnienie, aby upewnić się, że okno jest ukryte
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: screen.getPrimaryDisplay().workAreaSize
        });
        const image = sources[0].thumbnail.toPNG();
        const filePath = path.join(os.homedir(), 'Desktop', `screenshot_${Date.now()}.png`);
        fs.writeFileSync(filePath, image);
    } catch (err) {
        console.error('Error taking screenshot:', err);
    }
    mainWindow.show();
});

ipcMain.on('start-recording', () => {
    mainWindow.hide();
    isRecording = true;
});
