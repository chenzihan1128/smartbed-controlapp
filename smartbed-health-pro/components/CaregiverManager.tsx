import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCaregiver, Caregiver, getCaregivers, sendTestEmailToAll } from "../services/api";

const CaregiverManager: React.FC = () => {
  const navigate = useNavigate();

  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add modal
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // test email
  const [testInfo, setTestInfo] = useState<{ ts?: string; count?: number } | null>(null);
  const lastTestText = useMemo(() => {
    if (!testInfo?.ts) return "Last test broadcast: —";
    const d = new Date(testInfo.ts);
    return `Last test broadcast: ${d.toLocaleString()}`;
  }, [testInfo]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const list = await getCaregivers();
        if (cancelled) return;
        setCaregivers(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load caregivers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onAdd() {
    setError(null);
    const n = name.trim();
    const e = email.trim();

    if (!n) return setError("Name is required");
    if (!e) return setError("Email is required");
    if (!isValidEmail(e)) return setError("Invalid email format");

    setSaving(true);
    try {
      await addCaregiver({ name: n, email: e });
      // refresh list
      const list = await getCaregivers();
      setCaregivers(list);
      setShowAdd(false);
      setName("");
      setEmail("");
    } catch (err: any) {
      setError(err?.message || "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function onTestAll() {
    setError(null);
    try {
      const r = await sendTestEmailToAll();
      setTestInfo({ ts: r?.ts, count: r?.count });
      alert(`Test email triggered for ${r?.count ?? caregivers.length} caregivers.`);
    } catch (e: any) {
      setError(e?.message || "Test email failed");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark">
      <header className="flex items-center p-4 justify-between sticky top-0 z-10 bg-white dark:bg-background-dark">
        <button
          onClick={() => navigate(-1)}
          className="text-[#111418] dark:text-white flex size-12 items-center justify-start"
        >
          <span className="material-symbols-outlined font-bold">arrow_back_ios</span>
        </button>
        <div className="text-sm font-bold text-[#111418] dark:text-white">Caregivers</div>
        <div className="w-12" />
      </header>

      <div className="flex-1 px-4 pt-4">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-white bg-primary px-5 py-2 rounded-lg transition-all active:scale-95 shadow-md"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span className="text-xs font-bold uppercase tracking-wider">ADD NEW</span>
          </button>
        </div>

        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {caregivers.map((caregiver) => (
            <div
              key={caregiver.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 transition-all active:scale-[0.99]"
            >
              <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${caregiver.avatarColor || "bg-gray-100 text-gray-700"}`}>
                <span className="material-symbols-outlined text-[20px] fill">person</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-[#111418] dark:text-white truncate">{caregiver.name}</span>
                <span className="text-xs text-[#637588] dark:text-gray-400 truncate tracking-tight">{caregiver.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Send single email placeholder")}
                  className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors"
                  title="Send test to this caregiver"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
                <button
                  onClick={() => alert("More menu placeholder")}
                  className="text-[#637588] dark:text-gray-400 p-2"
                  title="More actions"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && caregivers.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No caregivers yet.</div>
          )}
        </div>

        <div className="py-12 flex flex-col items-center">
          <button
            onClick={onTestAll}
            className="flex w-full items-center justify-center gap-2 bg-white dark:bg-gray-800 border-2 border-primary text-primary font-bold py-3.5 px-4 rounded-xl transition-all active:bg-primary/5"
          >
            <span className="material-symbols-outlined">mail</span>
            <span className="text-sm">Send Test Email to All</span>
          </button>
          <p className="text-center text-[10px] text-[#637588] dark:text-gray-500 mt-4 font-medium uppercase tracking-widest">
            {lastTestText}
          </p>
        </div>
      </div>

      {/* Add Modal (minimal) */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => !saving && setShowAdd(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white dark:bg-background-dark rounded-t-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-[#111418] dark:text-white">Add Caregiver</p>
              <button
                onClick={() => !saving && setShowAdd(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Name</label>
                <input
                  disabled={saving}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John Tan"
                  className="mt-2 w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
                <input
                  disabled={saving}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., caregiver@example.com"
                  className="mt-2 w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                disabled={saving}
                onClick={onAdd}
                className="w-full h-12 rounded-xl bg-primary text-white font-black text-sm active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? "ADDING..." : "ADD"}
              </button>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Tip: In the real backend, we will validate email and send a verification email if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverManager;
