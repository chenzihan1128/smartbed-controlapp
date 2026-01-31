import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, saveSettings } from "../services/api";

const EmergencyEmail: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSettings();
        if (cancelled) return;
        setEmail(s?.emergencyEmail || "");
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSave() {
    setMsg(null);
    const v = email.trim();

    if (!v) return setMsg("Please enter an email address.");
    if (!isValidEmail(v)) return setMsg("Invalid email format.");

    setSaving(true);
    try {
      await saveSettings({ emergencyEmail: v });
      setMsg("Saved successfully.");
      setTimeout(() => navigate(-1), 400);
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center p-4 sticky top-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl font-bold">arrow_back_ios</span>
        </button>
        <h2 className="flex-1 text-center font-bold text-lg">Emergency Email</h2>
        <div className="w-12"></div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-[#1c2631] rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-sm font-bold text-[#111418] dark:text-white">
            Where to send emergency alerts
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            When a critical alert happens, the system will email this address.
          </p>

          <div className="mt-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Email address
            </label>
            <input
              disabled={loading || saving}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@example.com"
              className="mt-2 w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {msg && (
            <div className="mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
              {msg}
            </div>
          )}

          <button
            disabled={loading || saving}
            onClick={onSave}
            className="mt-4 w-full h-12 rounded-xl bg-primary text-white font-black text-sm active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyEmail;
