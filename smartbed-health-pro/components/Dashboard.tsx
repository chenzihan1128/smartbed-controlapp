import React, { useEffect, useState } from "react";
import { SystemStatus } from "../types";
import { connectStream, MetricsPayload, SafetyState } from "../services/ws";
import { bedAction, getStatus } from "../services/api";

interface DashboardProps {
  status: SystemStatus;
  onToggleStatus: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ status, onToggleStatus }) => {
  const isDisconnected = status === "disconnected";

  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [safety, setSafety] = useState<SafetyState>("normal");
  const [lastUpdateMs, setLastUpdateMs] = useState<number>(0);
  const [staleBackend, setStaleBackend] = useState(false);

  const isStaleLocal = !lastUpdateMs || Date.now() - lastUpdateMs > 30_000;
  const isStale = staleBackend || isStaleLocal;
  const isCritical = safety === "locked";

  useEffect(() => {
    getStatus()
      .then((s) => {
        setStaleBackend(!!s?.stale);
        if (s?.safety?.state) setSafety(s.safety.state);
      })
      .catch(() => {});

    const cleanup = connectStream((m, safetyState) => {
      setMetrics(m);
      setLastUpdateMs(Date.now());
      setStaleBackend(false);
      if (safetyState) setSafety(safetyState);
    });

    return cleanup;
  }, []);

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

  const VitalItem = ({ icon, label, value, unit, color }: any) => (
    <div
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
        isDisconnected || isStale
          ? "border-gray-100 bg-gray-50 opacity-50"
          : "border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800"
      }`}
    >
      <span className={`material-symbols-outlined text-3xl mb-1 ${color}`}>{icon}</span>
      <p className="text-2xl font-black leading-none text-[#111418] dark:text-white">
        {isDisconnected || isStale ? "--" : value}
      </p>
      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-300 uppercase tracking-widest mt-1 text-center">
        {label}
      </p>
      {unit && <p className="text-[9px] text-gray-600 dark:text-gray-400 font-bold">{unit}</p>}
    </div>
  );

  const hr = metrics?.hr;
  const spo2 = metrics?.spo2;
  const bp = metrics?.bp ? `${metrics.bp.sys}/${metrics.bp.dia}` : undefined;
  const temp = metrics?.temp;
  const motionLabel =
    isCritical
      ? "Safety Locked"
      : isDisconnected || isStale
      ? "Controller Offline"
      : "Ready";

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] md:min-h-[calc(100vh-156px)] overflow-hidden bg-background-light dark:bg-background-dark">
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

      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 py-3 md:px-6 md:py-5">
        <section className="md:w-[56%] flex flex-col gap-4">
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
              <VitalItem icon="favorite" label="Heart Rate" value={hr ?? "--"} unit="BPM" color="text-red-600" />
              <VitalItem icon="water_drop" label="SpO2" value={spo2 ?? "--"} unit="%" color="text-primary" />
              <VitalItem icon="speed" label="Blood Pressure" value={bp ?? "--"} unit="SYS/DIA" color="text-orange-600" />
              <VitalItem icon="thermostat" label="Temp" value={temp ?? "--"} unit="°C" color="text-yellow-600" />
            </div>
          </div>

          {(isCritical || isDisconnected || isStale) && (
            <button className="w-full min-h-20 bg-red-600 text-white rounded-[28px] flex items-center justify-center gap-4 shadow-xl active:scale-95 animate-pulse">
              <span className="material-symbols-outlined text-4xl fill">emergency</span>
              <span className="text-xl font-black uppercase tracking-tight">Call Help</span>
            </button>
          )}
        </section>

        <section className="md:w-[44%]">
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
              className="min-h-28 md:min-h-36 rounded-[24px] bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
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
              className="min-h-28 md:min-h-36 rounded-[24px] bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
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
              className="col-span-2 min-h-20 md:min-h-24 bg-primary text-white rounded-[24px] font-black text-base md:text-lg active:scale-[0.98] disabled:opacity-20 border border-primary/30 tracking-[0.2em] uppercase"
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
    </div>
  );
};

export default Dashboard;
