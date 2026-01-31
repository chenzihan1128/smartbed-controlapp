
import React, { useState } from 'react';
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


const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>('normal');
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


  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white dark:bg-background-dark shadow-2xl flex flex-col relative overflow-hidden">
      
      {/* Route Content */}
      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-8 pt-2 z-50">
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
    </div>
  );
};

export default App;
