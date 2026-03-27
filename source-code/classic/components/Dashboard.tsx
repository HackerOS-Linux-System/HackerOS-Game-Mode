'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, HardDrive, Wifi, Battery, Clock, Monitor, Download, Upload, Zap, Camera, Video, Settings, Crosshair } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data generator
const generateData = (length = 30) => Array.from({ length }, (_, i) => ({ time: i, value: Math.floor(Math.random() * 100) }));

export default function Dashboard() {
  const [cpuData, setCpuData] = useState(generateData());
  const [gpuData, setGpuData] = useState(generateData());
  const [stats, setStats] = useState({
    cpuTemp: 45, cpuUsage: 32, cpuFreq: 4200, cpuFan: 1200, cpuPower: 65,
    gpuTemp: 55, gpuUsage: 45, gpuVram: 4.2, gpuFan: 1500, gpuPower: 120,
    ramUsage: 16.4, ramTotal: 32,
    diskUsage: 450, diskTotal: 1000,
    battery: 85, uptime: '4h 20m',
    download: 120.5, upload: 45.2, ping: 12, fps: 144
  });
  const [activeMode, setActiveMode] = useState('PERFORMANCE');

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, value: Math.floor(Math.random() * 100) }]);
      setGpuData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, value: Math.floor(Math.random() * 100) }]);

      setStats(prev => ({
        ...prev,
        cpuTemp: Math.floor(40 + Math.random() * 40),
                        cpuUsage: Math.floor(10 + Math.random() * 80),
                        cpuFreq: Math.floor(3800 + Math.random() * 1000),
                        cpuFan: Math.floor(1000 + Math.random() * 2000),
                        gpuTemp: Math.floor(50 + Math.random() * 30),
                        gpuUsage: Math.floor(20 + Math.random() * 70),
                        download: +(Math.random() * 200).toFixed(1),
                        upload: +(Math.random() * 50).toFixed(1),
                        fps: Math.floor(120 + Math.random() * 40),
                        ping: Math.floor(10 + Math.random() * 20)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const Panel = ({ children, title, icon: Icon, className = '' }: any) => (
    <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-black/60 backdrop-blur-md border border-red-900/30 rounded-lg p-5 shadow-[0_0_15px_rgba(255,0,0,0.1)] relative overflow-hidden group ${className}`}
    >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="flex items-center gap-2 mb-4 text-red-500 border-b border-red-900/30 pb-2">
    <Icon size={18} />
    <h2 className="font-bold tracking-widest text-sm text-gray-200">{title}</h2>
    </div>
    {children}
    </motion.div>
  );

  const StatRow = ({ label, value, unit, highlight = false }: any) => (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
    <span className="text-xs text-gray-400 font-medium tracking-wider">{label}</span>
    <span className={`text-sm font-mono ${highlight ? 'text-red-400 font-bold' : 'text-gray-200'}`}>
    {value} <span className="text-[10px] text-gray-500">{unit}</span>
    </span>
    </div>
  );

  const ProgressBar = ({ label, value, max, unit, color = 'bg-red-500' }: any) => (
    <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
    <span className="text-gray-400 tracking-wider">{label}</span>
    <span className="font-mono text-gray-200">{value}{unit} / {max}{unit}</span>
    </div>
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
    <motion.div
    className={`h-full ${color} shadow-[0_0_10px_rgba(255,0,0,0.5)]`}
    initial={{ width: 0 }}
    animate={{ width: `${(value / max) * 100}%` }}
    transition={{ duration: 0.5 }}
    />
    </div>
    </div>
  );

  const Gauge = ({ value, label, color = '#ef4444' }: any) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex flex-col items-center justify-center">
      <svg className="transform -rotate-90 w-24 h-24">
      <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
      <motion.circle
      cx="48" cy="48" r={radius} stroke={color} strokeWidth="6" fill="transparent"
      strokeDasharray={circumference}
      animate={{ strokeDashoffset }}
      transition={{ duration: 0.5 }}
      className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
      />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
      <span className="text-xl font-bold font-mono text-white">{value}%</span>
      <span className="text-[9px] text-gray-400 tracking-widest">{label}</span>
      </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen p-6 grid grid-cols-12 grid-rows-6 gap-6 relative z-10">

    {/* Top Left: CPU */}
    <Panel title="CPU INFORMATION" icon={Cpu} className="col-span-3 row-span-3">
    <div className="flex justify-center mb-6 mt-2">
    <Gauge value={stats.cpuUsage} label="USAGE" />
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
    <StatRow label="TEMP" value={stats.cpuTemp} unit="°C" highlight={stats.cpuTemp > 80} />
    <StatRow label="FREQ" value={stats.cpuFreq} unit="MHz" />
    <StatRow label="FAN" value={stats.cpuFan} unit="RPM" />
    <StatRow label="POWER" value={stats.cpuPower} unit="W" />
    <StatRow label="CORES" value="16" unit="" />
    <StatRow label="LOAD" value="2.4" unit="" />
    </div>
    </Panel>

    {/* Center: Hub */}
    <div className="col-span-6 row-span-6 flex flex-col items-center justify-center relative">
    <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center mb-12"
    >
    <h1 className="text-5xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
    ARMOURY CRATE
    </h1>
    <p className="text-red-500/80 tracking-[0.5em] text-sm mt-2 font-bold">SYSTEM CONTROL INTERFACE</p>
    </motion.div>

    <div className="flex gap-4 mb-16">
    {['WINDOWS', 'SILENT', 'PERFORMANCE', 'TURBO', 'MANUAL'].map((mode) => (
      <button
      key={mode}
      onClick={() => setActiveMode(mode)}
      className={`px-6 py-3 rounded-sm text-xs font-bold tracking-widest transition-all duration-300 border ${
        activeMode === mode
        ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-105'
        : 'bg-black/40 border-gray-800 text-gray-500 hover:border-red-900 hover:text-gray-300'
      } ${mode === 'TURBO' && activeMode !== mode ? 'hover:border-orange-500 hover:text-orange-400' : ''}`}
      >
      {mode}
      </button>
    ))}
    </div>

    <div className="w-full max-w-2xl space-y-6">
    <div className="bg-black/40 border border-gray-800/50 p-4 rounded-lg">
    <h3 className="text-xs text-gray-500 tracking-widest mb-2">CPU USAGE HISTORY</h3>
    <div className="h-24 w-full">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
    <AreaChart data={cpuData}>
    <defs>
    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
    </linearGradient>
    </defs>
    <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
    </AreaChart>
    </ResponsiveContainer>
    </div>
    </div>
    <div className="bg-black/40 border border-gray-800/50 p-4 rounded-lg">
    <h3 className="text-xs text-gray-500 tracking-widest mb-2">GPU USAGE HISTORY</h3>
    <div className="h-24 w-full">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
    <AreaChart data={gpuData}>
    <defs>
    <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
    </linearGradient>
    </defs>
    <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorGpu)" isAnimationActive={false} />
    </AreaChart>
    </ResponsiveContainer>
    </div>
    </div>
    </div>
    </div>

    {/* Top Right: GPU */}
    <Panel title="GPU INFORMATION" icon={Monitor} className="col-span-3 row-span-3">
    <div className="flex justify-center mb-6 mt-2">
    <Gauge value={stats.gpuUsage} label="USAGE" color="#f97316" />
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
    <StatRow label="TEMP" value={stats.gpuTemp} unit="°C" highlight={stats.gpuTemp > 85} />
    <StatRow label="VRAM" value={stats.gpuVram} unit="GB" />
    <StatRow label="FAN" value={stats.gpuFan} unit="RPM" />
    <StatRow label="POWER" value={stats.gpuPower} unit="W" />
    <StatRow label="CLOCK" value="1850" unit="MHz" />
    <StatRow label="LOAD" value="85" unit="%" />
    </div>
    </Panel>

    {/* Bottom Left: System */}
    <Panel title="SYSTEM STATUS" icon={HardDrive} className="col-span-3 row-span-3">
    <div className="mt-4 space-y-4">
    <ProgressBar label="MEMORY" value={stats.ramUsage} max={stats.ramTotal} unit="GB" color="bg-red-500" />
    <ProgressBar label="STORAGE" value={stats.diskUsage} max={stats.diskTotal} unit="GB" color="bg-orange-500" />
    <ProgressBar label="BATTERY" value={stats.battery} max={100} unit="%" color="bg-green-500" />

    <div className="pt-4 border-t border-white/5">
    <StatRow label="UPTIME" value={stats.uptime} unit="" />
    <StatRow label="OS BUILD" value="22631.3296" unit="" />
    </div>
    </div>
    </Panel>

    {/* Bottom Right: Network & Tools */}
    <Panel title="NETWORK & TOOLS" icon={Wifi} className="col-span-3 row-span-3">
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
    <div className="bg-black/40 p-3 rounded border border-gray-800">
    <div className="flex items-center gap-2 text-gray-500 mb-1"><Download size={14}/> <span className="text-[10px] tracking-wider">DOWNLOAD</span></div>
    <div className="text-lg font-mono text-blue-400">{stats.download} <span className="text-xs text-gray-500">Mbps</span></div>
    </div>
    <div className="bg-black/40 p-3 rounded border border-gray-800">
    <div className="flex items-center gap-2 text-gray-500 mb-1"><Upload size={14}/> <span className="text-[10px] tracking-wider">UPLOAD</span></div>
    <div className="text-lg font-mono text-purple-400">{stats.upload} <span className="text-xs text-gray-500">Mbps</span></div>
    </div>
    <div className="bg-black/40 p-3 rounded border border-gray-800">
    <div className="flex items-center gap-2 text-gray-500 mb-1"><Activity size={14}/> <span className="text-[10px] tracking-wider">PING</span></div>
    <div className="text-lg font-mono text-green-400">{stats.ping} <span className="text-xs text-gray-500">ms</span></div>
    </div>
    <div className="bg-red-900/20 p-3 rounded border border-red-900/50">
    <div className="flex items-center gap-2 text-red-400 mb-1"><Crosshair size={14}/> <span className="text-[10px] tracking-wider">FPS</span></div>
    <div className="text-2xl font-mono text-red-500 font-bold">{stats.fps}</div>
    </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-auto">
    <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-red-900/40 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-400 rounded transition-all text-xs font-bold tracking-wider group">
    <Camera size={16} className="group-hover:scale-110 transition-transform" /> SCREENSHOT
    </button>
    <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-red-900/40 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-400 rounded transition-all text-xs font-bold tracking-wider group">
    <Video size={16} className="group-hover:scale-110 transition-transform" /> RECORD
    </button>
    </div>
    </Panel>

    </div>
  );
}
