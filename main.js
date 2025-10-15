const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

let mainWindow;
let config = { autoLaunch: false, shortcut: 'CommandOrControl+G' };
let updateInterval;

async function collectStats() {
    const stats = {};

    // CPU Temperature
    try {
        let { stdout } = await execAsync('sensors | grep -A 0 "Tctl:" | cut -c15-22');
        stats.cpuTemp = parseFloat(stdout.trim()).toFixed(1);
    } catch {
        try {
            const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
            stats.cpuTemp = (parseInt(raw) / 1000).toFixed(1);
        } catch {
            stats.cpuTemp = 'N/A';
        }
    }

    // CPU Usage
    try {
        let { stdout } = await execAsync('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
        stats.cpuUsage = parseFloat(stdout.trim()).toFixed(1);
    } catch {
        stats.cpuUsage = 'N/A';
    }

    // CPU Frequency
    try {
        let { stdout } = await execAsync('cat /proc/cpuinfo | grep "cpu MHz" | head -1 | awk \'{print $4}\'');
        stats.cpuFreq = parseFloat(stdout.trim()).toFixed(0);
    } catch {
        stats.cpuFreq = 'N/A';
    }

    // CPU Fan
    try {
        let { stdout } = await execAsync('sensors | grep "fan1:" | awk \'{print $2}\'');
        stats.cpuFan = stdout.trim();
    } catch {
        stats.cpuFan = 'N/A';
    }

    // GPU Temperature
    try {
        let { stdout } = await execAsync('nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader');
        stats.gpuTemp = parseFloat(stdout.trim()).toFixed(1);
    } catch {
        try {
            let { stdout } = await execAsync('rocm-smi --showtemp | grep "GPU Temp" | awk \'{print $4}\'');
            stats.gpuTemp = parseFloat(stdout.trim()).toFixed(1);
        } catch {
            stats.gpuTemp = 'N/A';
        }
    }

    // GPU Usage
    try {
        let { stdout } = await execAsync('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader');
        stats.gpuUsage = parseFloat(stdout.trim()).toFixed(1);
    } catch {
        try {
            let { stdout } = await execAsync('rocm-smi --showutil | grep "GPU use" | awk \'{print $4}\'');
            stats.gpuUsage = parseFloat(stdout.trim()).toFixed(1);
        } catch {
            stats.gpuUsage = 'N/A';
        }
    }

    // GPU Fan
    try {
        let { stdout } = await execAsync('nvidia-smi --query-gpu=fan.speed --format=csv,noheader');
        stats.gpuFan = parseFloat(stdout.trim()).toFixed(1);
    } catch {
        try {
            let { stdout } = await execAsync('rocm-smi --showfan | grep "Fan Level" | awk \'{print $4}\'');
            stats.gpuFan = parseFloat(stdout.trim()).toFixed(1);
        } catch {
            stats.gpuFan = 'N/A';
        }
    }

    // GPU Memory
    try {
        let { stdout } = await execAsync('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader');
        const [used, total] = stdout.trim().split(',').map(s => s.trim().replace(' MiB', ''));
        stats.gpuMem = `${used}/${total}`;
    } catch {
        try {
            let { stdout } = await execAsync('rocm-smi --showmeminfo vram | grep "Used" | awk \'{print $4 "/" $5}\'');
            stats.gpuMem = stdout.trim();
        } catch {
            stats.gpuMem = 'N/A';
        }
    }

    // RAM Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    stats.ramUsage = ((usedMem / totalMem) * 100).toFixed(1);

    // Disk Usage
    try {
        let { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'');
        stats.diskUsage = stdout.trim();
    } catch {
        stats.diskUsage = 'N/A';
    }

    // Battery Level
    try {
        const batteryPath = '/sys/class/power_supply/BAT0/capacity';
        if (fs.existsSync(batteryPath)) {
            stats.batteryLevel = fs.readFileSync(batteryPath, 'utf8').trim();
        } else {
            stats.batteryLevel = 'N/A';
        }
    } catch {
        stats.batteryLevel = 'N/A';
    }

    // Uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    stats.uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Network (placeholder)
    stats.netDownload = (Math.random() * 100).toFixed(1);
    stats.netUpload = (Math.random() * 20).toFixed(1);

    // FPS (placeholder)
    stats.fps = Math.floor(Math.random() * 60 + 30);

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
