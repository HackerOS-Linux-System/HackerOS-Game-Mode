'use client';

import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Share2,
  Smartphone,
  Video,
  Edit2,
  Settings,
  Volume2,
  Sun,
  PhoneOff,
  BellOff,
  ChevronDown,
  Cpu,
  Thermometer,
  X
} from 'lucide-react';

export default function HackerOSGameMode() {
  const [time, setTime] = useState('15:39');
  const [battery, setBattery] = useState(67);
  const [activeTab, setActiveTab] = useState('Game Panel');
  const [performanceMode, setPerformanceMode] = useState('Balanced');
  const [blockCalls, setBlockCalls] = useState(false);
  const [blockNotifications, setBlockNotifications] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const closeWindow = async () => {
    try {
      // Dynamic import to prevent SSR issues in Next.js and allow web preview to work
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().close();
    } catch (e) {
      console.log('Tauri API not available in browser preview');
    }
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const dashArray = `${arcLength} ${circumference}`;

  const cpuPercent = 24;
  const gpuPercent = 8;
  const cpuOffset = arcLength - (arcLength * (cpuPercent / 100));
  const gpuOffset = arcLength - (arcLength * (gpuPercent / 100));

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-start p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Main Panel - data-tauri-drag-region allows dragging the frameless window */}
      <div 
        data-tauri-drag-region 
        className="relative w-full max-w-[420px] bg-[#0a0e17] text-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-row border border-slate-800/60 transition-all"
      >
        
        {/* Left Content Area */}
        <div className="flex-1 flex flex-col p-6 pr-4 pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6" data-tauri-drag-region>
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('Game Panel')}
                className={`text-[15px] font-bold pb-2 border-b-2 transition-colors ${
                  activeTab === 'Game Panel' ? 'border-[#a8c7fa] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Game Panel
              </button>
              <button
                onClick={() => setActiveTab('Apps')}
                className={`text-[15px] font-bold pb-2 border-b-2 transition-colors ${
                  activeTab === 'Apps' ? 'border-[#a8c7fa] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Apps
              </button>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 pointer-events-none">
              <span>{time}</span>
              <div className="flex items-center">
                <div className="w-5 h-[10px] border border-slate-400 rounded-[2px] p-[1px] relative mr-1 flex items-center">
                  <div className="bg-slate-200 h-full rounded-[1px]" style={{ width: `${battery}%` }}></div>
                </div>
                <span>{battery}%</span>
              </div>
            </div>
          </div>

          {/* Performance Mode */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-[15px] text-slate-200 pointer-events-none">Performance mode:</span>
            <button className="flex items-center space-x-1 text-[15px] font-medium text-slate-200 hover:text-white transition-colors">
              <span>{performanceMode}</span>
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Gauges */}
          <div className="flex justify-between mb-8 px-2 pointer-events-none">
            {/* CPU Gauge */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[15px] font-semibold mb-2">CPU</span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={dashArray} />
                  <circle cx="50" cy="50" r={radius} stroke="#a8c7fa" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={dashArray} strokeDashoffset={cpuOffset} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center mt-2">
                  <span className="text-2xl font-bold">{cpuPercent}<span className="text-sm text-slate-400 font-normal">%</span></span>
                  <span className="text-[11px] text-slate-400 mt-0.5">2.2 GHz</span>
                </div>
              </div>
            </div>

            {/* GPU Gauge */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[15px] font-semibold mb-2">GPU</span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={dashArray} />
                  <circle cx="50" cy="50" r={radius} stroke="#a8c7fa" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={dashArray} strokeDashoffset={gpuOffset} className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center mt-2">
                  <span className="text-2xl font-bold">{gpuPercent}<span className="text-sm text-slate-400 font-normal">%</span></span>
                  <span className="text-[11px] text-slate-400 mt-0.5">0.65 GHz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-between items-center mb-8 px-4 pointer-events-none">
            <div className="flex items-center space-x-2">
              <span className="text-[13px] text-slate-400">RAM</span>
              <Cpu size={14} className="text-[#a8c7fa]" />
              <span className="text-[15px] font-semibold">71%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[13px] text-slate-400">Core</span>
              <Thermometer size={14} className="text-[#a8c7fa]" />
              <span className="text-[15px] font-semibold">38°C</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex space-x-4 mb-6">
            <div className="w-16 bg-[#a8c7fa] text-[#0a0e17] rounded-full py-2.5 flex justify-center items-center cursor-pointer hover:bg-blue-300 transition-colors">
              <Volume2 size={20} className="fill-current" />
            </div>
            <div className="w-16 bg-[#a8c7fa] text-[#0a0e17] rounded-full py-2.5 flex justify-center items-center cursor-pointer hover:bg-blue-300 transition-colors">
              <Sun size={20} className="fill-current" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setBlockCalls(!blockCalls)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-[1.25rem] transition-colors ${
                blockCalls ? 'bg-[#a8c7fa] text-[#0a0e17]' : 'bg-[#1e2330] text-slate-200 hover:bg-[#2a3040]'
              }`}
            >
              <PhoneOff size={22} className={`mb-2 ${blockCalls ? '' : 'text-slate-400'}`} />
              <span className="text-[13px] font-semibold text-center leading-tight">Block<br/>calls</span>
            </button>
            <button
              onClick={() => setBlockNotifications(!blockNotifications)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-[1.25rem] transition-colors ${
                blockNotifications ? 'bg-[#a8c7fa] text-[#0a0e17]' : 'bg-[#1e2330] text-slate-200 hover:bg-[#2a3040]'
              }`}
            >
              <BellOff size={22} className={`mb-2 ${blockNotifications ? '' : 'text-slate-400'}`} />
              <span className="text-[13px] font-semibold text-center leading-tight">Block<br/>notifications</span>
            </button>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-[60px] bg-[#0a0e17] flex flex-col items-center py-6 space-y-7 border-l border-slate-800/60 z-10 pointer-events-auto" data-tauri-drag-region>
          <button onClick={closeWindow} className="text-red-400 hover:text-red-300 transition-colors mb-2" title="Close Overlay">
            <X size={24} />
          </button>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors">
            <Gamepad2 size={24} />
          </button>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors">
            <Share2 size={24} />
          </button>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors relative flex items-center justify-center">
            <Smartphone size={24} />
            <div className="absolute -left-[14px] w-[3px] h-5 bg-[#1e293b] rounded-full"></div>
          </button>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors">
            <Video size={24} />
          </button>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors">
            <Edit2 size={24} />
          </button>
          <div className="flex-1" data-tauri-drag-region></div>
          <button className="text-[#a8c7fa] hover:text-blue-300 transition-colors">
            <Settings size={24} />
          </button>
        </div>

      </div>
    </div>
  );
}
