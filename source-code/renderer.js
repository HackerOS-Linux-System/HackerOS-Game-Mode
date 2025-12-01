let cpuUsageHistory = [];
let gpuUsageHistory = [];
const maxHistory = 30;

// Prosty FPS counter via requestAnimationFrame
let fps = 0;
let frameCount = 0;
let lastTime = performance.now();

let recorder;
let chunks = [];
let stream;

function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = now;
    }
    document.getElementById('fps').textContent = fps;
    requestAnimationFrame(updateFPS);
}

requestAnimationFrame(updateFPS); // Uruchom counter

window.electronAPI.onUpdateStats((event, stats) => {
    document.getElementById('cpu-temp').textContent = stats.cpuTemp;
    document.getElementById('cpu-usage').textContent = stats.cpuUsage;
    document.getElementById('cpu-freq').textContent = stats.cpuFreq;
    document.getElementById('cpu-cores').textContent = stats.cpuCores; // Nowe pole
    document.getElementById('cpu-fan').textContent = stats.cpuFan;
    document.getElementById('ram-usage').textContent = stats.ramUsage;
    document.getElementById('disk-usage').textContent = stats.diskUsage;
    document.getElementById('battery-level').textContent = stats.batteryLevel;
    document.getElementById('uptime').textContent = stats.uptime;
    document.getElementById('net-download').textContent = stats.netDownload;
    document.getElementById('net-upload').textContent = stats.netUpload;
    document.getElementById('load-avg').textContent = stats.loadAvg;

    if (stats.cpuUsage !== '--') {
        cpuUsageHistory.push(parseFloat(stats.cpuUsage));
        if (cpuUsageHistory.length > maxHistory) cpuUsageHistory.shift();
        drawCpuChart();
        drawCpuGauge(parseFloat(stats.cpuUsage) || 0);
    }

    if (stats.gpuUsage !== '--') {
        gpuUsageHistory.push(parseFloat(stats.gpuUsage));
        if (gpuUsageHistory.length > maxHistory) gpuUsageHistory.shift();
        drawGpuChart();
    }
});

window.electronAPI.onGetRects(() => {
    const topRightElement = document.querySelector('.overlay-top-right');
    const topRight = topRightElement.getBoundingClientRect();
    window.electronAPI.send('rects', {
        topRight: {
            top: topRight.top,
            right: parseFloat(getComputedStyle(topRightElement).right), // right z CSS (30px)
    width: topRight.width,
    height: topRight.height
        }
    });
});

document.getElementById('screenshot-btn').addEventListener('click', () => {
    window.electronAPI.send('take-screenshot');
});

document.getElementById('record-btn').addEventListener('click', async () => {
    try {
        const sources = await window.electronAPI.desktopCapturer.getSources({ types: ['screen'] });
        const sourceId = sources[0].id;
        const constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        recorder = new MediaRecorder(stream);
        chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        recorder.start();
        window.electronAPI.send('start-recording');
    } catch (err) {
        console.error('Error starting recording:', err);
    }
});

window.electronAPI.onStopRecording(() => {
    if (recorder) {
        recorder.stop();
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
    if (data.length === 0) return;
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
