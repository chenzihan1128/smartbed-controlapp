import React, { useEffect, useState } from "react";
import { SystemStatus } from "../types";
import { connectStream, MetricsPayload, SafetyState } from "../services/ws";
import { bedAction, getStatus } from "../services/api";

interface DashboardProps {
  status: SystemStatus;
  onToggleStatus: () => void;
}

type BedAction = "head_up" | "head_down" | "flat" | "memory";

const Dashboard: React.FC<DashboardProps> = ({ status, onToggleStatus }) => {
  const isDisconnected = status === "disconnected";

  // realtime + safety
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [safety, setSafety] = useState<SafetyState>("normal");
  const [lastUpdateMs, setLastUpdateMs] = useState<number>(0);

  // optional status info (battery/rssi/stale)
  const [staleBackend, setStaleBackend] = useState(false);

  const isStaleLocal = !lastUpdateMs || Date.now() - lastUpdateMs > 30_000;
  const isStale = staleBackend || isStaleLocal;

  // backend-enforced lock
  const isCritical = safety === "locked";

  useEffect(() => {
    // initial status pull (optional)
    getStatus()
      .then((s) => {
        setStaleBackend(!!s?.stale);
        if (s?.safety?.state) setSafety(s.safety.state);
      })
      .catch(() => {});

    // realtime stream
    const cleanup = connectStream((m, safetyState) => {
      setMetrics(m);
      setLastUpdateMs(Date.now());
      setStaleBackend(false);
      if (safetyState) setSafety(safetyState);
    });

    return cleanup;
  }, []);

  async function handleBed(action: BedAction) {
    try {
      await bedAction(action);
    } catch {
      // keep silent for now; you can show toast later
    }
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-background-light dark:bg-background-dark">
      <header
        onClick={onToggleStatus}
        className={`flex items-center justify-center px-6 py-4 cursor-pointer shadow-sm z-20 ${
          isCritical
            ? "bg-critical text-white"
            : isDisconnected || isStale
            ? "bg-gray-700 text-white"
            : "bg-white dark:bg-gray-900 text-[#111418] dark:text-white"
        }`}
      >
        <h1 className="text-lg font-black tracking-tight uppercase">Dashboard</h1>
      </header>

      <div className="flex-1 flex flex-col justify-evenly px-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <VitalItem icon="favorite" label="Heart Rate" value={hr ?? "--"} unit="BPM" color="text-red-600" />
          <VitalItem icon="water_drop" label="SpO2" value={spo2 ?? "--"} unit="%" color="text-primary" />
          <VitalItem icon="speed" label="Blood Pressure" value={bp ?? "--"} unit="SYS/DIA" color="text-orange-600" />
          <VitalItem icon="thermostat" label="Temp" value={temp ?? "--"} unit="°C" color="text-yellow-600" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-md border border-gray-100 dark:border-gray-800 relative">
          {isCritical && (
            <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] rounded-3xl flex items-center justify-center z-10 border-2 border-red-500">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm">lock</span>
                <span className="text-red-500 text-xs font-bold uppercase">Locked for Safety</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-[0.2em]">Bed Control</p>
            <div className="bg-success text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
              {isCritical ? "LOCKED" : isDisconnected || isStale ? "OFFLINE" : "STABLE"}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <button
              disabled={isCritical || isDisconnected || isStale}
              onClick={() => handleBed("head_up")}
              className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-3xl text-gray-900 dark:text-white">keyboard_arrow_up</span>
            </button>
            <button
              disabled={isCritical || isDisconnected || isStale}
              onClick={() => handleBed("head_down")}
              className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center active:scale-90 disabled:opacity-20 border border-gray-300 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-3xl text-gray-900 dark:text-white">keyboard_arrow_down</span>
            </button>
            <button
              disabled={isCritical || isDisconnected || isStale}
              onClick={() => handleBed("flat")}
              className="col-span-2 h-full bg-primary text-white rounded-2xl font-black text-sm active:scale-95 disabled:opacity-20 shadow-md"
            >
              FLAT
            </button>
          </div>
        </div>

        {(isCritical || isDisconnected || isStale) && (
          <button className="w-full h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center gap-4 shadow-xl active:scale-95 animate-pulse">
            <span className="material-symbols-outlined text-4xl fill">emergency</span>
            <span className="text-xl font-black uppercase tracking-tight">Call Help</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
