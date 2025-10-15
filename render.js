const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

let cpuUsageHistory = [];
let gpuUsageHistory = [];
const maxHistory = 30; // For charts

function updateCpuTemp() {
    exec('sensors | grep -A 0 "Tctl:" | cut -c15-22', (error, stdout) => {
        let temp = 'N/A';
        if (!error && stdout) {
            temp = parseFloat(stdout.trim()).toFixed(1);
        } else {
            try {
                const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
                temp = (parseInt(raw) / 1000).toFixed(1);
            } catch (e) {}
        }
        document.getElementById('cpu-temp').textContent = temp;
    });
}

function updateCpuUsage() {
    exec('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'', (error, stdout) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = parseFloat(stdout.trim()).toFixed(1);
            cpuUsageHistory.push(usage);
            if (cpuUsageHistory.length > maxHistory) cpuUsageHistory.shift();
            drawCpuChart();
        }
        document.getElementById('cpu-usage').textContent = usage;
    });
}

function updateCpuFreq() {
    exec('cat /proc/cpuinfo | grep "cpu MHz" | head -1 | awk \'{print $4}\'', (error, stdout) => {
        let freq = 'N/A';
        if (!error && stdout) {
            freq = parseFloat(stdout.trim()).toFixed(0);
        }
        document.getElementById('cpu-freq').textContent = freq;
    });
}

function updateCpuFan() {
    exec('sensors | grep "fan1:" | awk \'{print $2}\'', (error, stdout) => {
        let fan = 'N/A';
        if (!error && stdout) {
            fan = stdout.trim();
        }
        document.getElementById('cpu-fan').textContent = fan;
    });
}

function updateGpuTemp() {
    exec('nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader', (error, stdout) => {
        let temp = 'N/A';
        if (!error && stdout) {
            temp = parseFloat(stdout.trim()).toFixed(1);
        } else {
            exec('rocm-smi --showtemp | grep "GPU Temp" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) temp = parseFloat(out.trim()).toFixed(1);
            });
        }
        document.getElementById('gpu-temp').textContent = temp;
    });
}

function updateGpuUsage() {
    exec('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader', (error, stdout) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = parseFloat(stdout.trim()).toFixed(1);
            gpuUsageHistory.push(usage);
            if (gpuUsageHistory.length > maxHistory) gpuUsageHistory.shift();
            drawGpuChart();
        } else {
            exec('rocm-smi --showutil | grep "GPU use" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) usage = parseFloat(out.trim()).toFixed(1);
            });
        }
        document.getElementById('gpu-usage').textContent = usage;
    });
}

function updateGpuFan() {
    exec('nvidia-smi --query-gpu=fan.speed --format=csv,noheader', (error, stdout) => {
        let fan = 'N/A';
        if (!error && stdout) {
            fan = parseFloat(stdout.trim()).toFixed(1);
        } else {
            exec('rocm-smi --showfan | grep "Fan Level" | awk \'{print $4}\'', (err, out) => {
                if (!err && out) fan = parseFloat(out.trim()).toFixed(1);
            });
        }
        document.getElementById('gpu-fan').textContent = fan;
    });
}

function updateGpuMem() {
    exec('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader', (error, stdout) => {
        let mem = 'N/A';
        if (!error && stdout) {
            const [used, total] = stdout.trim().split(',').map(s => s.trim().replace(' MiB', ''));
            mem = `${used}/${total}`;
        } else {
            exec('rocm-smi --showmeminfo vram | grep "Used" | awk \'{print $4 "/" $5}\'', (err, out) => {
                if (!err && out) mem = out.trim();
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
    exec('df -h / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'', (error, stdout) => {
        let usage = 'N/A';
        if (!error && stdout) {
            usage = stdout.trim();
        }
        document.getElementById('disk-usage').textContent = usage;
    });
}

function updateBatteryLevel() {
    try {
        const batteryPath = '/sys/class/power_supply/BAT0/capacity';
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

function updateNetwork() {
    // Simple approximation; for real, use speedtest-cli or similar
    document.getElementById('net-download').textContent = (Math.random() * 100).toFixed(1);
    document.getElementById('net-upload').textContent = (Math.random() * 20).toFixed(1);
}

function updateFps() {
    // Placeholder; in real app, integrate with game or use requestAnimationFrame for approx
    document.getElementById('fps').textContent = Math.floor(Math.random() * 60 + 30);
}

function drawCpuChart() {
    const ctx = document.getElementById('cpu-chart').getContext('2d');
    drawLineChart(ctx, cpuUsageHistory, '#00BFFF');
}

function drawGpuChart() {
    const ctx = document.getElementById('gpu-chart').getContext('2d');
    drawLineChart(ctx, gpuUsageHistory, '#FF4500');
}

function drawLineChart(ctx, data, color) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const step = ctx.canvas.width / (maxHistory - 1);
    data.forEach((val, i) => {
        const x = i * step;
        const y = ctx.canvas.height - (val / 100 * ctx.canvas.height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
        ctx.stroke();
}

// Update every 1 second for smoother updates
setInterval(() => {
    updateCpuTemp();
    updateCpuUsage();
    updateCpuFreq();
    updateCpuFan();
    updateGpuTemp();
    updateGpuUsage();
    updateGpuFan();
    updateGpuMem();
    updateRamUsage();
    updateDiskUsage();
    updateBatteryLevel();
    updateUptime();
    updateNetwork();
    updateFps();
}, 1000);

// Initial update
updateCpuTemp();
updateCpuUsage();
updateCpuFreq();
updateCpuFan();
updateGpuTemp();
updateGpuUsage();
updateGpuFan();
updateGpuMem();
updateRamUsage();
updateDiskUsage();
updateBatteryLevel();
updateUptime();
updateNetwork();
updateFps();
