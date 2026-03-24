import React, { useEffect, useState } from "react";
import { SystemStatus } from "../types";
import { connectStream, MetricsPayload, SafetyState } from "../services/ws";
import { bedAction, BackendStatus, getStatus, sensorAction } from "../services/api";

interface DashboardProps {
  status: SystemStatus;
  onToggleStatus: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ status, onToggleStatus }) => {
  const isDisconnected = status === "disconnected";

  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [sensorBusy, setSensorBusy] = useState(false);
  const [safety, setSafety] = useState<SafetyState>("normal");
  const [lastUpdateMs, setLastUpdateMs] = useState<number>(0);
  const [staleBackend, setStaleBackend] = useState(false);
  const [showPpgModal, setShowPpgModal] = useState(false);
  const [ppgSamples, setPpgSamples] = useState<number[]>([]);
  const [ecgSamples, setEcgSamples] = useState<number[]>([]);

  const isStaleLocal = !lastUpdateMs || Date.now() - lastUpdateMs > 30_000;
  const isStale = staleBackend || isStaleLocal;
  const isCritical = safety === "locked";

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const s = await getStatus();
        if (cancelled) return;
        setBackendStatus(s);
        setStaleBackend(!!s?.stale);
        if (s?.safety?.state) setSafety(s.safety.state);
      } catch {}
    }

    loadStatus();
    const statusTimer = window.setInterval(loadStatus, 3000);

    const cleanup = connectStream((m, safetyState) => {
      setMetrics(m);
      setLastUpdateMs(Date.now());
      setStaleBackend(false);
      if (safetyState) setSafety(safetyState);
    });

    return () => {
      cancelled = true;
      window.clearInterval(statusTimer);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!showPpgModal) return;
    let cancelled = false;

    async function pollPpg() {
      try {
        const s = await getStatus();
        if (cancelled) return;
        setBackendStatus(s);
        const nextEcg = Number(s?.ble?.lastWave?.ecg ?? s?.ble?.lastPpg?.a);
        const nextPpg = Number(s?.ble?.lastWave?.ppg ?? s?.ble?.lastPpg?.b);
        if (Number.isFinite(nextEcg)) {
          setEcgSamples((prev) => [...prev.slice(-71), nextEcg]);
        }
        if (Number.isFinite(nextPpg)) {
          setPpgSamples((prev) => [...prev.slice(-71), nextPpg]);
        }
      } catch {}
    }

    pollPpg();
    const timer = window.setInterval(pollPpg, 700);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [showPpgModal]);

  async function handleBedStartUp() {
    try {
      await bedAction("start-up");
    } catch {}
  }

  async function handleBedStartDown() {
    try {
      await bedAction("start-down");
    } catch {}
  }

  async function handleBedStop() {
    try {
      await bedAction("stop");
    } catch {}
  }

  async function handleBedFlat() {
    try {
      await bedAction("flat");
    } catch {}
  }

  async function handleSensorToggle() {
    try {
      setSensorBusy(true);
      await sensorAction(ble?.streaming ? "stop" : "start");
      const s = await getStatus();
      setBackendStatus(s);
    } catch {} finally {
      setSensorBusy(false);
    }
  }

  const VitalItem = ({ icon, label, value, unit, color, onClick, hint }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
        isDisconnected || isStale
          ? "border-gray-100 bg-gray-50 opacity-50"
          : "border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800"
      } ${onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
    >
      <span className={`material-symbols-outlined text-3xl mb-1 ${color}`}>{icon}</span>
      <p className="text-2xl font-black leading-none text-[#111418] dark:text-white">
        {isDisconnected || isStale ? "--" : value}
      </p>
      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-300 uppercase tracking-widest mt-1 text-center">
        {label}
      </p>
      {unit && <p className="text-[9px] text-gray-600 dark:text-gray-400 font-bold">{unit}</p>}
      {hint && <p className="mt-1 text-[9px] text-primary font-black uppercase tracking-[0.16em]">{hint}</p>}
    </button>
  );

  const hr = backendStatus?.ble?.analysis?.hr ?? metrics?.hr;
  const spo2 = metrics?.spo2;
  const bp = metrics?.bp ? `${metrics.bp.sys}/${metrics.bp.dia}` : undefined;
  const motionLabel =
    isCritical
      ? "Safety Locked"
      : isDisconnected || isStale
      ? "Controller Offline"
      : "Ready";
  const ble = backendStatus?.ble;
  const sensorLabel = ble?.streaming ? "Live Sensor" : ble?.state === "connected" ? "Connected" : "Disconnected";
  const ecgValue = ble?.lastWave?.ecg ?? ble?.lastPpg?.a ?? "--";
  const ppgValue = ble?.lastWave?.ppg ?? ble?.lastPpg?.b ?? "--";
  const ppgCount = ble?.lastWave?.count ?? ble?.lastPpg?.count ?? "--";
  const lastPacketText = ble?.lastPacketAt ? new Date(ble.lastPacketAt).toLocaleTimeString() : "--";
  const buildPath = (samples: number[]) => {
    const min = samples.length ? Math.min(...samples) : 0;
    const max = samples.length ? Math.max(...samples) : 0;
    const range = Math.max(max - min, 1);
    return samples.length < 2
      ? ""
      : samples
          .map((value, index) => {
            const x = (index / Math.max(samples.length - 1, 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
  };
  const ecgPath = buildPath(ecgSamples);
  const ppgPath = buildPath(ppgSamples);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] overflow-hidden bg-background-light dark:bg-background-dark">
      <header
        onClick={onToggleStatus}
        className={`flex items-center justify-between px-5 py-4 md:px-6 md:py-5 cursor-pointer shadow-sm z-20 ${
          isCritical
            ? "bg-critical text-white"
            : isDisconnected || isStale
            ? "bg-gray-700 text-white"
            : "bg-white dark:bg-gray-900 text-[#111418] dark:text-white"
        }`}
      >
        <div>
          <h1 className="text-lg md:text-2xl font-black tracking-tight uppercase">Dashboard</h1>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.28em] opacity-70">Smart Bed Control</p>
        </div>
        <div className="rounded-full border border-current/15 px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-[0.18em]">
          {motionLabel}
        </div>
      </header>

      <div className="flex-1 flex flex-col min-[700px]:flex-row gap-4 px-4 py-3 md:px-6 md:py-5">
        <section className="min-[700px]:flex-[1.15] flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-md p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-[0.2em]">
                  Live Metrics
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                  Touchscreen landscape view
                </p>
              </div>
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-[0.16em] text-gray-700 dark:text-gray-200">
                {isDisconnected || isStale ? "Waiting" : "Streaming"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <VitalItem
                icon="favorite"
                label="Heart Rate"
                value={hr ?? "--"}
                unit="BPM"
                color="text-red-600"
                onClick={() => setShowPpgModal(true)}
                hint="Tap For ECG/PPG"
              />
              <VitalItem icon="water_drop" label="SpO2" value={spo2 ?? "--"} unit="%" color="text-primary" />
              <VitalItem icon="speed" label="Blood Pressure" value={bp ?? "--"} unit="SYS/DIA" color="text-orange-600" />
              <div className={`rounded-2xl border-2 p-4 transition-all ${
                isDisconnected || isStale
                  ? "border-gray-100 bg-gray-50 opacity-50"
                  : "border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-gray-800 dark:text-gray-300 uppercase tracking-widest">
                      Sensor Live
                    </p>
                    <p className="mt-1 text-lg font-black text-[#111418] dark:text-white">
                      {sensorLabel}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-3xl ${
                    ble?.streaming ? "text-emerald-600" : ble?.state === "connected" ? "text-primary" : "text-gray-400"
                  }`}>
                    sensors
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <div className="rounded-xl bg-slate-50 dark:bg-gray-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wider">PPG A</p>
                    <p className="mt-1 text-xs text-[#111418] dark:text-white break-all">{ecgValue}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-gray-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wider">PPG</p>
                    <p className="mt-1 text-xs text-[#111418] dark:text-white break-all">{ppgValue}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-gray-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wider">Packets</p>
                    <p className="mt-1 text-xs text-[#111418] dark:text-white">{ppgCount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-gray-800 px-3 py-2">
                    <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Seen</p>
                    <p className="mt-1 text-xs text-[#111418] dark:text-white">{lastPacketText}</p>
                  </div>
                </div>

                <button
                  onClick={handleSensorToggle}
                  disabled={sensorBusy || ble?.state !== "connected"}
                  className={`mt-3 w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:opacity-40 ${
                    ble?.streaming ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {sensorBusy ? "Working..." : ble?.streaming ? "Stop Sensor" : "Start Sensor"}
                </button>
              </div>
            </div>
          </div>

          {(isCritical || isDisconnected || isStale) && (
            <button className="w-full min-h-20 bg-red-600 text-white rounded-[28px] flex items-center justify-center gap-4 shadow-xl active:scale-95 animate-pulse">
              <span className="material-symbols-outlined text-4xl fill">emergency</span>
              <span className="text-xl font-black uppercase tracking-tight">Call Help</span>
            </button>
          )}
        </section>

        <section className="min-[700px]:flex-1">
          <div className="h-full bg-white dark:bg-gray-900 rounded-[28px] p-5 md:p-6 shadow-md border border-gray-100 dark:border-gray-800 relative flex flex-col">
          {isCritical && (
            <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] rounded-[28px] flex items-center justify-center z-10 border-2 border-red-500">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm">lock</span>
                <span className="text-red-500 text-xs font-bold uppercase">Locked for Safety</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-[0.2em]">
                Bed Control
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                Direct motor control panel
              </p>
            </div>
            <div className="bg-success text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
              {isCritical ? "LOCKED" : isDisconnected || isStale ? "OFFLINE" : "STABLE"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 auto-rows-fr">
            <button
              disabled={isCritical || isDisconnected || isStale}
              onMouseDown={handleBedStartUp}
              onMouseUp={handleBedStop}
              onMouseLeave={handleBedStop}
              onTouchStart={handleBedStartUp}
              onTouchEnd={handleBedStop}
              className="min-h-28 min-[700px]:min-h-40 rounded-[24px] bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-3xl text-gray-900 dark:text-white">
                keyboard_arrow_up
              </span>
              <span className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-gray-700 dark:text-gray-200">
                Raise
              </span>
            </button>

            <button
              disabled={isCritical || isDisconnected || isStale}
              onMouseDown={handleBedStartDown}
              onMouseUp={handleBedStop}
              onMouseLeave={handleBedStop}
              onTouchStart={handleBedStartDown}
              onTouchEnd={handleBedStop}
              className="min-h-28 min-[700px]:min-h-40 rounded-[24px] bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-3xl text-gray-900 dark:text-white">
                keyboard_arrow_down
              </span>
              <span className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-gray-700 dark:text-gray-200">
                Lower
              </span>
            </button>

            <button
              disabled={isCritical || isDisconnected || isStale}
              onClick={handleBedFlat}
              className="col-span-2 min-h-20 min-[700px]:min-h-24 bg-primary text-white rounded-[24px] font-black text-base md:text-lg active:scale-[0.98] disabled:opacity-20 border border-primary/30 tracking-[0.2em] uppercase"
            >
              FLAT
            </button>

            <div className="col-span-2 rounded-[24px] bg-slate-50 dark:bg-gray-800/70 border border-slate-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Motion State
                </p>
                <p className="mt-1 text-sm md:text-base font-black text-[#111418] dark:text-white">
                  {isCritical ? "Controls Locked" : isDisconnected || isStale ? "No Live Link" : "Touch And Hold To Move"}
                </p>
              </div>
              <button
                disabled={isDisconnected}
                onClick={handleBedStop}
                className="shrink-0 rounded-full bg-red-600 text-white px-4 py-2 text-xs md:text-sm font-black uppercase tracking-[0.18em] active:scale-95 disabled:opacity-30"
              >
                Stop
              </button>
            </div>
          </div>
          </div>
        </section>
      </div>

      {showPpgModal && (
        <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Real-Time Sensor
                </p>
                <h3 className="mt-1 text-xl font-black text-[#111418] dark:text-white">
                  ECG And PPG Signal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPpgModal(false)}
                className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-bold">
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">Sensor</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{sensorLabel}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">Packets</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{ppgCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">ECG</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white break-all">{ecgValue}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">PPG</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white break-all">{ppgValue}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[28px] bg-[#08111d] p-4 md:p-5 border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ECG Waveform</p>
                    <p className="mt-1 text-xs text-slate-300">Real waveform from 0x23 frame</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    ble?.streaming ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {ble?.streaming ? "Live" : "Stopped"}
                  </div>
                </div>

                <div className="mt-4 h-56 rounded-[24px] bg-slate-950/80 border border-slate-800 p-3">
                  {ecgPath ? (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                      <path d={ecgPath} fill="none" stroke="#f43f5e" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Waiting for ECG samples
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-[28px] bg-[#08111d] p-4 md:p-5 border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PPG Waveform</p>
                    <p className="mt-1 text-xs text-slate-300">Real waveform from 0x23 frame</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    ble?.streaming ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {ble?.streaming ? "Live" : "Stopped"}
                  </div>
                </div>

                <div className="mt-4 h-56 rounded-[24px] bg-slate-950/80 border border-slate-800 p-3">
                  {ppgPath ? (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                      <path d={ppgPath} fill="none" stroke="#22c55e" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Waiting for PPG samples
                    </div>
                  )}
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px] font-bold">
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">HR</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{ble?.analysis?.hr ?? "--"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">SpO2</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{ble?.analysis?.spo2 ?? "--"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">SYS</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{ble?.analysis?.sys ?? "--"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">DIA</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{ble?.analysis?.dia ?? "--"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
                  <p className="uppercase tracking-widest text-gray-500 dark:text-gray-400">Last Seen</p>
                  <p className="mt-1 text-sm text-[#111418] dark:text-white">{lastPacketText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
