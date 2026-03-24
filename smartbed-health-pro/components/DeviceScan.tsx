import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackendStatus, getStatus, sensorAction } from '../services/api';

const DeviceScan: React.FC = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const next = await getStatus();
        if (!cancelled) setBackendStatus(next);
      } catch {}
    }

    loadStatus();
    const timer = window.setInterval(loadStatus, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function handleSensorToggle() {
    try {
      setBusy(true);
      await sensorAction(backendStatus?.ble?.streaming ? 'stop' : 'start');
      const next = await getStatus();
      setBackendStatus(next);
    } catch {} finally {
      setBusy(false);
    }
  }

  const ble = backendStatus?.ble;
  const deviceStateLabel = ble?.streaming ? 'Streaming Live' : ble?.state === 'connected' ? 'Connected' : 'Disconnected';
  const lastSeen = ble?.lastPacketAt ? new Date(ble.lastPacketAt).toLocaleTimeString() : '--';
  const ppgA = ble?.lastPpg?.a ?? '--';
  const ppgB = ble?.lastPpg?.b ?? '--';
  const packets = ble?.lastPpg?.count ?? '--';

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
            <div className={`absolute w-20 h-20 border-4 border-transparent rounded-full ${ble?.streaming ? 'border-t-emerald-500 animate-spin' : 'border-t-primary animate-spin'}`}></div>
            <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">bluetooth_searching</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">{deviceStateLabel}</p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Connected Device</p>
          
          <div className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">monitor_heart</span>
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg">ECP01 BLE Sensor</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-widest">{deviceStateLabel}</p>
              </div>
            </div>
            <span className={`material-symbols-outlined text-3xl fill ${ble?.streaming ? 'text-emerald-500' : ble?.state === 'connected' ? 'text-primary' : 'text-gray-400'}`}>check_circle</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">PPG A</p>
              <p className="mt-2 text-sm font-black text-[#111418] dark:text-white break-all">{ppgA}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">PPG B</p>
              <p className="mt-2 text-sm font-black text-[#111418] dark:text-white break-all">{ppgB}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Packets</p>
              <p className="mt-2 text-sm font-black text-[#111418] dark:text-white">{packets}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Last Seen</p>
              <p className="mt-2 text-sm font-black text-[#111418] dark:text-white">{lastSeen}</p>
            </div>
          </div>

          {ble?.lastError && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">BLE Error</p>
              <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-200 break-words">{ble.lastError}</p>
            </div>
          )}
        </div>

        <div className="pt-8">
          <button
            onClick={handleSensorToggle}
            disabled={busy || ble?.state !== 'connected'}
            className={`flex w-full cursor-pointer items-center justify-center rounded-2xl h-16 text-white text-lg font-black leading-normal transition-transform active:scale-[0.98] shadow-xl disabled:opacity-40 ${
              ble?.streaming ? 'bg-amber-500 shadow-amber-500/20' : 'bg-primary shadow-primary/30'
            }`}
          >
            {busy ? 'Working...' : ble?.streaming ? 'Stop Sensor' : 'Start Sensor'}
          </button>
          <button onClick={() => navigate('/')} className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-2xl h-14 bg-white dark:bg-slate-800 text-[#111418] dark:text-white text-sm font-black leading-normal transition-transform active:scale-[0.98] border border-gray-200 dark:border-slate-700">
            Back To Dashboard
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-6 px-10 leading-relaxed uppercase tracking-[0.2em] font-bold">
            Keep the sensor on skin contact and use stop if the green light should turn off
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeviceScan;
