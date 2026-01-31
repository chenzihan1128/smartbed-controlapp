
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_RULES } from '../constants';

const AlertRulesEditor: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center bg-white dark:bg-[#1c2632] p-4 pb-3 justify-between sticky top-0 z-10 border-b border-[#dce0e5] dark:border-[#344155]">
        <button onClick={() => navigate(-1)} className="text-primary flex size-10 shrink-0 items-center justify-start transition-opacity active:opacity-50">
          <span className="material-symbols-outlined text-xl font-bold">arrow_back_ios</span>
        </button>
        <h2 className="text-base font-black flex-1 text-center text-[#111418] dark:text-white uppercase tracking-tight">Alert Rules Editor</h2>
        <div className="w-10"></div> {/* Empty spacer to maintain centering without info icon */}
      </div>

      <div className="px-4 py-3 bg-white dark:bg-[#1c2632] border-b border-[#dce0e5] dark:border-[#344155]">
        <p className="text-gray-800 dark:text-gray-300 text-[12px] leading-tight font-medium">
          Configure health thresholds. Yellow signals warnings; red triggers emergency alerts.
        </p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4 pb-48">
        {INITIAL_RULES.map((rule) => (
          <div key={rule.id} className="bg-white dark:bg-[#1c2632] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg fill ${
                  rule.id === 'hr' ? 'text-red-600' : rule.id === 'spo2' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  {rule.id === 'hr' ? 'favorite' : rule.id === 'spo2' ? 'water_drop' : 'monitor_heart'}
                </span>
                <h3 className="font-black text-sm tracking-tight text-[#111418] dark:text-white uppercase">{rule.name} ({rule.unit})</h3>
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active</span>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-warning"></span>
                  <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 uppercase tracking-widest">Warning</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-black text-gray-700 dark:text-gray-400 mb-1 uppercase tracking-tighter">High</p>
                    <input className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-black py-2 focus:ring-primary text-[#111418] dark:text-white" type="number" defaultValue={rule.warning.high}/>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-700 dark:text-gray-400 mb-1 uppercase tracking-tighter">Low</p>
                    <input className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-black py-2 focus:ring-primary text-[#111418] dark:text-white" type="number" defaultValue={rule.warning.low}/>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-critical"></span>
                  <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 uppercase tracking-widest">Critical</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-black text-gray-700 dark:text-gray-400 mb-1 uppercase tracking-tighter">High</p>
                    <input className="w-full rounded-lg border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-xs font-black py-2 focus:ring-critical text-[#111418] dark:text-white" type="number" defaultValue={rule.critical.high}/>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-700 dark:text-gray-400 mb-1 uppercase tracking-tighter">Low</p>
                    <input className="w-full rounded-lg border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-xs font-black py-2 focus:ring-critical text-[#111418] dark:text-white" type="number" defaultValue={rule.critical.low}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-white/95 dark:bg-[#1c2632]/95 border-t border-slate-100 dark:border-slate-800 ios-blur">
        <button className="w-full bg-primary text-white text-sm font-black h-14 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">save</span>
          Save All Changes
        </button>
      </div>
    </div>
  );
};

export default AlertRulesEditor;
