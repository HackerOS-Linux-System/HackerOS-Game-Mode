const { ipcRenderer } = require('electron');

let cpuUsageHistory = [];
let gpuUsageHistory = [];
const maxHistory = 30;

ipcRenderer.on('update-stats', (event, stats) => {
    document.getElementById('cpu-temp').textContent = stats.cpuTemp;
    document.getElementById('cpu-usage').textContent = stats.cpuUsage;
    document.getElementById('cpu-freq').textContent = stats.cpuFreq;
    document.getElementById('cpu-voltage').textContent = stats.cpuVoltage;
    document.getElementById('cpu-fan').textContent = stats.cpuFan;
    document.getElementById('gpu-temp').textContent = stats.gpuTemp;
    document.getElementById('gpu-usage').textContent = stats.gpuUsage;
    document.getElementById('gpu-fan').textContent = stats.gpuFan;
    document.getElementById('gpu-mem').textContent = stats.gpuMem;
    document.getElementById('gpu-power').textContent = stats.gpuPower;
    document.getElementById('ram-usage').textContent = stats.ramUsage;
    document.getElementById('disk-usage').textContent = stats.diskUsage;
    document.getElementById('battery-level').textContent = stats.batteryLevel;
    document.getElementById('uptime').textContent = stats.uptime;
    document.getElementById('net-download').textContent = stats.netDownload;
    document.getElementById('net-upload').textContent = stats.netUpload;
    document.getElementById('fps').textContent = stats.fps;
    document.getElementById('load-avg').textContent = stats.loadAvg;

    if (stats.cpuUsage !== 'N/A') {
        cpuUsageHistory.push(parseFloat(stats.cpuUsage));
        if (cpuUsageHistory.length > maxHistory) cpuUsageHistory.shift();
        drawCpuChart();
        drawCpuGauge(parseFloat(stats.cpuUsage) || 0);
    }

    if (stats.gpuUsage !== 'N/A') {
        gpuUsageHistory.push(parseFloat(stats.gpuUsage));
        if (gpuUsageHistory.length > maxHistory) gpuUsageHistory.shift();
        drawGpuChart();
        drawGpuGauge(parseFloat(stats.gpuUsage) || 0);
    }
});

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

function drawCpuGauge(value) {
    const ctx = document.getElementById('cpu-gauge').getContext('2d');
    drawGauge(ctx, value / 100, '#00BFFF', 'CPU Usage');
}

function drawGpuGauge(value) {
    const ctx = document.getElementById('gpu-gauge').getContext('2d');
    drawGauge(ctx, value / 100, '#FF4500', 'GPU Usage');
}

function drawGauge(ctx, percent, color, label) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();

    // Value arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 0.75 + (Math.PI * 1.5 * percent));
    ctx.strokeStyle = color;
    ctx.stroke();

    // Text
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX, centerY - 10);
    ctx.fillText((percent * 100).toFixed(0) + '%', centerX, centerY + 10);
}
