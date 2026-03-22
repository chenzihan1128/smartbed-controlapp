
import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AlertsList from './components/AlertsList';
import Settings from './components/Settings';
import AlertRulesEditor from './components/AlertRulesEditor';
import CaregiverManager from './components/CaregiverManager';
import AlertDetails from './components/AlertDetails';
import DeviceScan from './components/DeviceScan';
import { SystemStatus } from './types';
import EmergencyEmail from "./components/EmergencyEmail";
import { AlertItem, getAlerts, resolveAlert, triggerEmergencyAlert } from './services/api';


const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>('normal');
  const [criticalAlert, setCriticalAlert] = useState<AlertItem | null>(null);
  const [popupDismissedId, setPopupDismissedId] = useState<string | null>(null);
  const [popupBusy, setPopupBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items configuration
  const navItems = [
    { label: 'Alerts', icon: 'notifications', path: '/alerts', hasBadge: true },
    { label: 'Dashboard', icon: 'grid_view', path: '/', isCenter: true },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const hideNav =
  ['/alert-rules', '/caregivers', '/device-scan', '/emergency-email'].some(p => location.pathname === p) ||
  location.pathname.startsWith('/alert/');

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const list = await getAlerts();
        if (cancelled) return;

        const nextCritical =
          list.find((a) => a.severity === 'critical' && (a.state ?? 'active') !== 'resolved') ?? null;

        setCriticalAlert(nextCritical);

        if (nextCritical && nextCritical.id !== popupDismissedId) {
          setStatus('critical');
        } else if (!nextCritical && status === 'critical') {
          setStatus('normal');
        }
      } catch {
        // ignore popup fetch errors
      }
    }

    loadAlerts();
    const t = window.setInterval(loadAlerts, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [popupDismissedId, status]);

  const showCriticalPopup = useMemo(() => {
    return !!criticalAlert && criticalAlert.id !== popupDismissedId;
  }, [criticalAlert, popupDismissedId]);

  async function handleResolveCritical() {
    if (!criticalAlert) return;
    setPopupBusy(true);
    try {
      await resolveAlert(criticalAlert.id);
      setPopupDismissedId(criticalAlert.id);
      setCriticalAlert(null);
      setStatus('normal');
    } finally {
      setPopupBusy(false);
    }
  }

  async function handleEmergencyAction() {
    if (!criticalAlert) return;
    setPopupBusy(true);
    try {
      await triggerEmergencyAlert(criticalAlert.id);
      setPopupDismissedId(criticalAlert.id);
      navigate('/caregivers');
    } finally {
      setPopupBusy(false);
    }
  }


  return (
    <div className="w-full min-h-screen bg-white dark:bg-background-dark flex flex-col relative overflow-hidden">
      
      {/* Route Content */}
      <main className="flex-1 pb-24 md:pb-28 overflow-y-auto no-scrollbar">
        <Routes>
          <Route path="/" element={<Dashboard status={status} onToggleStatus={() => setStatus(s => s === 'normal' ? 'critical' : (s === 'critical' ? 'disconnected' : 'normal'))} />} />
          <Route path="/alerts" element={<AlertsList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/alert-rules" element={<AlertRulesEditor />} />
          <Route path="/caregivers" element={<CaregiverManager />} />
          <Route path="/alert/:id" element={<AlertDetails />} />
          <Route path="/device-scan" element={<DeviceScan />} />
          <Route path="/emergency-email" element={<EmergencyEmail />} />
        </Routes>
      </main>

      {/* Persistent Bottom Nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-8 pt-2 z-50">
          <div className="flex justify-around items-end h-16 px-4">
            {navItems.map((item) => (
              item.isCenter ? (
                <div key={item.path} className="w-1/3 flex justify-center pb-2">
                  <button 
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center relative -top-6 group"
                  >
                    <div className={`size-16 rounded-full flex items-center justify-center shadow-lg border-[6px] transition-transform active:scale-90 ${
                      location.pathname === item.path 
                        ? 'bg-primary text-white border-white dark:border-background-dark' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 border-white dark:border-background-dark'
                    }`}>
                      <span className="material-symbols-outlined text-[32px] fill">
                        {item.icon}
                      </span>
                    </div>
                    <span className={`text-[11px] mt-1.5 font-bold ${
                      location.pathname === item.path ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                </div>
              ) : (
                <button 
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 w-1/3 group transition-opacity active:opacity-70 ${
                    location.pathname === item.path ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <div className="relative">
                    <span className={`material-symbols-outlined text-[28px] ${location.pathname === item.path ? 'fill' : ''}`}>
                      {item.icon}
                    </span>
                    {item.hasBadge && (
                      <div className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></div>
                    )}
                  </div>
                  <span className={`text-[11px] font-medium uppercase tracking-wider`}>{item.label}</span>
                </button>
              )
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </nav>
      )}

      {showCriticalPopup && criticalAlert && (
        <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[28px] border border-red-300/60 bg-white dark:bg-background-dark shadow-2xl overflow-hidden">
            <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Critical Alert</p>
                <h3 className="text-xl font-black mt-1">{criticalAlert.metric || 'Emergency Event'}</h3>
              </div>
              <span className="material-symbols-outlined text-3xl fill">warning</span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-base font-semibold text-[#111418] dark:text-white">
                {criticalAlert.message || 'Immediate review required.'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A critical event is active. You can open details, notify caregivers, or dismiss the alert after review.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => navigate(`/alert/${criticalAlert.id}`)}
                  disabled={popupBusy}
                  className="h-12 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  View Alert
                </button>
                <button
                  onClick={handleEmergencyAction}
                  disabled={popupBusy}
                  className="h-12 rounded-xl bg-red-600 text-white font-black text-sm uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  Notify Now
                </button>
                <button
                  onClick={handleResolveCritical}
                  disabled={popupBusy}
                  className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-black text-sm uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
