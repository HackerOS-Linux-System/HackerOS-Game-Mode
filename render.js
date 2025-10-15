const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

let prevNetStats = null;

function updateCpuTemp() {
    exec('sensors | grep -A 0 "Tctl:" | cut -c15-22', (error, stdout, stderr) => {
        let temp = 'N/A';
        if (!error && stdout) {
            temp = parseFloat(stdout.trim()).toFixed(1);
        } else {
            try {
                const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
                temp = (parseInt(raw) / 1000).toFixed(1);
            } catch (e) {
                console.error('Failed to read CPU temp');
            }
        }
        document.getElementById('cpu-temp').textContent = temp;
    });
}

function updateCpuUsage() {
    exec('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'', (error, stdout, stderr) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = parseFloat(stdout.trim()).toFixed(1);
        }
        document.getElementById('cpu-usage').textContent = usage;
    });
}

function updateCpuFreq() {
    exec('cat /proc/cpuinfo | grep "cpu MHz" | head -1 | awk \'{print $4}\'', (error, stdout, stderr) => {
        let freq = 'N/A';
        if (!error && stdout) {
            freq = parseFloat(stdout.trim()).toFixed(0);
        }
        document.getElementById('cpu-freq').textContent = freq;
    });
}

function updateGpuTemp() {
    // NVIDIA
    exec('nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader', (error, stdout, stderr) => {
        let temp = 'N/A';
        if (!error && stdout) {
            temp = parseFloat(stdout.trim()).toFixed(1);
        } else {
            // Try AMD (assuming rocm-smi)
            exec('rocm-smi --showtemp | grep "GPU Temp" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) {
                    temp = parseFloat(out.trim()).toFixed(1);
                }
                // Could add Intel iGPU, but more complex
            });
        }
        document.getElementById('gpu-temp').textContent = temp;
    });
}

function updateGpuUsage() {
    exec('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader', (error, stdout, stderr) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = parseFloat(stdout.trim()).toFixed(1);
        } else {
            exec('rocm-smi --showutil | grep "GPU use" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) {
                    usage = parseFloat(out.trim()).toFixed(1);
                }
            });
        }
        document.getElementById('gpu-usage').textContent = usage;
    });
}

function updateGpuFan() {
    exec('nvidia-smi --query-gpu=fan.speed --format=csv,noheader', (error, stdout, stderr) => {
        let fan = 'N/A';
        if (!error && stdout) {
            fan = parseFloat(stdout.trim()).toFixed(1);
        } else {
            exec('rocm-smi --showfan | grep "Fan Level" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) {
                    fan = parseFloat(out.trim()).toFixed(1);
                }
            });
        }
        document.getElementById('gpu-fan').textContent = fan;
    });
}

function updateGpuMem() {
    exec('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader', (error, stdout, stderr) => {
        let mem = 'N/A';
        if (!error && stdout) {
            const [used, total] = stdout.trim().split(',').map(s => s.trim().replace(' MiB', ''));
            mem = `${used}/${total}`;
        } else {
            exec('rocm-smi --showmeminfo vram | grep "Used" | awk \'{print $4 "/" $5}\'', (err, out) => {
                if (!err && out) {
                    mem = out.trim();
                }
            });
        }
        document.getElementById('gpu-mem').textContent = mem;
    });
}

function updateRamUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = ((usedMem / totalMem) * 100).toFixed(1);
    document.getElementById('ram-usage').textContent = usage;
}

function updateDiskUsage() {
    exec('df -h / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'', (error, stdout, stderr) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = stdout.trim();
        }
        document.getElementById('disk-usage').textContent = usage;
    });
}

function updateBatteryLevel() {
    try {
        const batteryPath = '/sys/class/power_supply/BAT0/capacity'; // Assuming BAT0, may vary
        if (fs.existsSync(batteryPath)) {
            const level = fs.readFileSync(batteryPath, 'utf8').trim();
            document.getElementById('battery-level').textContent = level;
        } else {
            document.getElementById('battery-level').textContent = 'N/A';
        }
    } catch (e) {
        document.getElementById('battery-level').textContent = 'N/A';
    }
}

function updateUptime() {
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    document.getElementById('uptime').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Update every 2 seconds
setInterval(() => {
    updateCpuTemp();
    updateCpuUsage();
    updateCpuFreq();
    updateGpuTemp();
    updateGpuUsage();
    updateGpuFan();
    updateGpuMem();
    updateRamUsage();
    updateDiskUsage();
    updateBatteryLevel();
    updateUptime();
}, 2000);

// Initial update
updateCpuTemp();
updateCpuUsage();
updateCpuFreq();
updateGpuTemp();
updateGpuUsage();
updateGpuFan();
updateGpuMem();
updateRamUsage();
updateDiskUsage();
updateBatteryLevel();
updateUptime();
