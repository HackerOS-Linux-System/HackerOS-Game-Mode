const { ipcRenderer } = require('electron');

let cpuUsageHistory = [];
let gpuUsageHistory = [];
const maxHistory = 30;

ipcRenderer.on('update-stats', (event, stats) => {
    document.getElementById('cpu-temp').textContent = stats.cpuTemp || 'N/A';
    document.getElementById('cpu-usage').textContent = stats.cpuUsage || 'N/A';
    document.getElementById('cpu-freq').textContent = stats.cpuFreq || 'N/A';
    document.getElementById('cpu-fan').textContent = stats.cpuFan || 'N/A';
    document.getElementById('gpu-temp').textContent = stats.gpuTemp || 'N/A';
    document.getElementById('gpu-usage').textContent = stats.gpuUsage || 'N/A';
    document.getElementById('gpu-fan').textContent = stats.gpuFan || 'N/A';
    document.getElementById('gpu-mem').textContent = stats.gpuMem || 'N/A';
    document.getElementById('ram-usage').textContent = stats.ramUsage || 'N/A';
    document.getElementById('disk-usage').textContent = stats.diskUsage || 'N/A';
    document.getElementById('battery-level').textContent = stats.batteryLevel || 'N/A';
    document.getElementById('uptime').textContent = stats.uptime || 'N/A';
    document.getElementById('net-download').textContent = stats.netDownload || 'N/A';
    document.getElementById('net-upload').textContent = stats.netUpload || 'N/A';
    document.getElementById('fps').textContent = stats.fps || 'N/A';

    if (stats.cpuUsage !== 'N/A') {
        cpuUsageHistory.push(parseFloat(stats.cpuUsage));
        if (cpuUsageHistory.length > maxHistory) cpuUsageHistory.shift();
        drawCpuChart();
    }

    if (stats.gpuUsage !== 'N/A') {
        gpuUsageHistory.push(parseFloat(stats.gpuUsage));
        if (gpuUsageHistory.length > maxHistory) gpuUsageHistory.shift();
        drawGpuChart();
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
