const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const si = require('systeminformation');

let mainWindow;
let config = { autoLaunch: false, shortcut: 'CommandOrControl+G' };
let updateInterval;

async function collectStats() {
    const stats = {};

    // CPU Stats
    const cpuTemp = await si.cpuTemperature();
    stats.cpuTemp = cpuTemp.main !== null ? cpuTemp.main.toFixed(1) : 'N/A';

    const currentLoad = await si.currentLoad();
    stats.cpuUsage = currentLoad.currentLoad.toFixed(1);

    const cpu = await si.cpu();
    stats.cpuFreq = cpu.speed ? (cpu.speed * 1000).toFixed(0) : 'N/A';

    stats.cpuVoltage = 'N/A'; // systeminformation doesn't provide voltage directly

    // For fans, systeminformation has si.chassis() but limited, fallback to sensors if needed
    stats.cpuFan = 'N/A';

    // GPU Stats
    const graphics = await si.graphics();
    if (graphics.controllers && graphics.controllers.length > 0) {
        const gpu = graphics.controllers[0];
        stats.gpuTemp = gpu.temperatureGpu ? gpu.temperatureGpu.toFixed(1) : 'N/A';
        stats.gpuUsage = gpu.utilizationGpu ? gpu.utilizationGpu.toFixed(1) : 'N/A';
        stats.gpuFan = gpu.fanPercent ? gpu.fanPercent.toFixed(1) : 'N/A';
        stats.gpuMem = gpu.memoryUsed ? `${gpu.memoryUsed}/${gpu.memoryTotal}` : 'N/A';
        stats.gpuPower = gpu.powerDraw ? gpu.powerDraw.toFixed(1) : 'N/A';
    } else {
        stats.gpuTemp = 'N/A';
        stats.gpuUsage = 'N/A';
        stats.gpuFan = 'N/A';
        stats.gpuMem = 'N/A';
        stats.gpuPower = 'N/A';
    }

    // RAM Usage
    const mem = await si.mem();
    stats.ramUsage = `${(mem.used / 1024 / 1024 / 1024).toFixed(1)} / ${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB`;

    // Disk Usage
    const fsSize = await si.fsSize();
    const root = fsSize.find(d => d.mount === '/');
    stats.diskUsage = root ? `${(root.used / 1024 / 1024 / 1024).toFixed(1)} / ${(root.size / 1024 / 1024 / 1024).toFixed(1)} GB` : 'N/A';

    // Battery
    const battery = await si.battery();
    stats.batteryLevel = battery.hasBattery ? battery.percent : 'N/A';

    // Uptime
    const time = si.time();
    stats.uptime = time.uptimeFormatted || `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`;

    // Network
    const netStats = await si.networkStats();
    if (netStats.length > 0) {
        const net = netStats[0];
        stats.netDownload = (net.rx_sec / 1024 / 1024 * 8).toFixed(2) + ' Mbps';
        stats.netUpload = (net.tx_sec / 1024 / 1024 * 8).toFixed(2) + ' Mbps';
    } else {
        stats.netDownload = 'N/A';
        stats.netUpload = 'N/A';
    }

    // FPS placeholder
    stats.fps = 'N/A';

    // Load Avg
    stats.loadAvg = os.loadavg().map(l => l.toFixed(2)).join(' ');

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
}

app.whenReady().then(() => {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    createWindow();

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
