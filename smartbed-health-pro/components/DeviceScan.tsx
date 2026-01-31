
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DeviceScan: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-[#1c2631] px-4 py-4 justify-between border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined text-2xl font-bold">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center">Devices</h2>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-4 space-y-8 pb-32">
        <div className="flex flex-col items-center justify-center pt-10 pb-4">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-20 h-20 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute w-20 h-20 border-4 border-t-primary border-transparent rounded-full animate-spin"></div>
            <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">bluetooth_searching</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Scanning for devices...</p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Discovered Devices</p>
          
          <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl shadow-lg transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">bed</span>
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg">Smart Bed BLE</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-widest">Ready to pair</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl fill">check_circle</span>
          </button>

          <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary/30 transition-all opacity-90">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-gray-500 text-2xl">monitor_heart</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-700 dark:text-white">Health Sensor 01</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Signal: Good</p>
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all opacity-50">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-gray-500 text-2xl">devices</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-400">Unknown Device</h3>
                <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">AA:BB:CC:11:22:33</p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-8">
          <button onClick={() => navigate('/')} className="flex w-full cursor-pointer items-center justify-center rounded-2xl h-16 bg-primary text-white text-lg font-black leading-normal transition-transform active:scale-[0.98] shadow-xl shadow-primary/30">
            Connect
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-6 px-10 leading-relaxed uppercase tracking-[0.2em] font-bold">
            Ensure your device is turned on and within range
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeviceScan;
