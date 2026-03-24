import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackendStatus, getStatus } from '../services/api';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const next = await getStatus();
        if (!cancelled) setBackendStatus(next);
      } catch {}
    }

    loadStatus();
    const timer = window.setInterval(loadStatus, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const ble = backendStatus?.ble;
  const sensorSubtitle =
    ble?.streaming
      ? `Streaming PPG · packets ${ble?.lastPpg?.count ?? "--"}`
      : ble?.state === 'connected'
      ? 'Sensor connected and ready'
      : ble?.lastError
      ? 'Sensor disconnected or BLE error'
      : 'Sensor offline';
  const sensorIndicator =
    ble?.streaming ? 'bg-emerald-500' : ble?.state === 'connected' ? 'bg-primary' : 'bg-gray-400';

  const SettingItem = ({ icon, title, subtitle, path, color, indicator }: any) => (
    <div 
      onClick={() => path && navigate(path)}
      className="flex items-center gap-4 px-4 min-h-[80px] py-3 justify-between bg-white dark:bg-[#1c2631] border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 ${color.bg} ${color.text}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[#111418] dark:text-white text-base font-semibold leading-normal">{title}</p>
          <div className="flex items-center gap-1.5">
            {indicator && <div className={`size-2 rounded-full ${indicator}`}></div>}
            <p className="text-[#637588] dark:text-gray-400 text-sm font-normal leading-normal">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-primary">
        <span className="material-symbols-outlined text-2xl">chevron_right</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center p-4 justify-center h-14">
          <h2 className="text-xl font-black tracking-tight text-[#111418] dark:text-white uppercase">Settings</h2>
        </div>
      </header>

      <div className="px-4 pb-20 space-y-6">
        {/* Devices Section */}
        <section>
          <h3 className="text-gray-800 dark:text-gray-300 text-xs font-black uppercase tracking-widest px-1 pb-2 pt-6">Devices</h3>
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <SettingItem 
              icon="bluetooth" 
              title="BLE Sensor Management" 
              subtitle={sensorSubtitle}
              path="/device-scan"
              indicator={sensorIndicator}
              color={{ bg: 'bg-primary/10', text: 'text-primary' }} 
            />
          </div>
        </section>

        {/* Alerts & Safety Section */}
        <section>
          <h3 className="text-gray-800 dark:text-gray-300 text-xs font-black uppercase tracking-widest px-1 pb-2 pt-2">Alerts & Safety</h3>
          <div className="overflow-hidden rounded-2xl shadow-sm">
            <SettingItem 
              icon="notifications_active" 
              title="Alert Rules" 
              subtitle="Movement & heart rate thresholds" 
              path="/alert-rules"
              color={{ bg: 'bg-orange-500/10', text: 'text-orange-500' }} 
            />

            {/* ✅ 新增：Emergency Email */}
            <SettingItem
              icon="mail"
              title="Emergency Email"
              subtitle="Set a primary email for emergency alerts"
              path="/emergency-email"
              indicator="bg-red-500"
              color={{ bg: 'bg-blue-500/10', text: 'text-blue-500' }}
            />

            <SettingItem 
              icon="person_add" 
              title="Caregiver Management" 
              subtitle="3 caregivers authorized" 
              path="/caregivers"
              color={{ bg: 'bg-red-500/10', text: 'text-red-500' }} 
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
