import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAlerts, AlertItem } from "../services/api";

function formatTime(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
}

const AlertDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setLoading(true);
      try {
        const list = await getAlerts();
        if (cancelled) return;

        const found = list.find((a) => a.id === id) ?? null;
        setAlert(found);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load alert");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = window.setInterval(load, 5000); // keep it fresh
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [id]);

  const ui = useMemo(() => {
    const sev = alert?.severity ?? "warning";

    const sevLabel =
      sev === "critical" ? "Critical Alert" : sev === "warning" ? "Warning Alert" : "Alert";

    const pillCls =
      sev === "critical"
        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        : sev === "warning"
        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";

    const borderCls =
      sev === "critical"
        ? "border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10"
        : sev === "warning"
        ? "border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10"
        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40";

    const iconCls =
      sev === "critical" ? "text-red-600 dark:text-red-400" : sev === "warning" ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-300";

    return { sevLabel, pillCls, borderCls, iconCls };
  }, [alert]);

  const titleLine = useMemo(() => {
    if (!alert) return "";
    // 你 mock 数据只有 metric + message，没有具体数值，所以用 metric + message 展示
    const metric = alert.metric ? alert.metric : "Alert";
    const msg = alert.message ? alert.message : "";
    return msg ? `${metric}: ${msg}` : metric;
  }, [alert]);

  const emailUI = useMemo(() => {
    const s = alert?.emailStatus ?? "sent";
    if (s === "failed") {
      return {
        title: "Emergency Email Failed",
        desc: "System couldn't deliver the alert to primary caregiver. Please check your connection.",
        showRetry: true,
        showConfig: true,
        icon: "mail_lock",
        tone: "danger",
      };
    }
    if (s === "pending") {
      return {
        title: "Emergency Email Sending",
        desc: "The system is attempting to send the alert email.",
        showRetry: false,
        showConfig: true,
        icon: "schedule",
        tone: "warning",
      };
    }
    if (s === "not_set") {
      return {
        title: "Emergency Email Not Set",
        desc: "Set an emergency email to notify a caregiver during critical events.",
        showRetry: false,
        showConfig: true,
        icon: "mail",
        tone: "neutral",
      };
    }
    // sent
    return {
      title: "Emergency Email Sent",
      desc: "The caregiver has been notified successfully.",
      showRetry: false,
      showConfig: true,
      icon: "mark_email_read",
      tone: "success",
    };
  }, [alert]);

  const emailCardClass = useMemo(() => {
    if (emailUI.tone === "danger") {
      return "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30";
    }
    if (emailUI.tone === "warning") {
      return "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30";
    }
    if (emailUI.tone === "success") {
      return "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30";
    }
    return "bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700";
  }, [emailUI.tone]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center p-4 sticky top-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl font-bold">arrow_back_ios</span>
        </button>
        <h2 className="flex-1 text-center font-bold text-lg">Alert Details</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Loading / Error */}
        {loading && (
          <div className="px-4 pt-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        )}
        {error && (
          <div className="mx-4 mt-6 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4">
            {error}
          </div>
        )}
        {!loading && !error && !alert && (
          <div className="mx-4 mt-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            Alert not found: <span className="font-bold">{id}</span>
          </div>
        )}

        {/* Severity Banner */}
        {alert && (
          <div className="px-4 pt-8 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 ${ui.pillCls}`}>
              <span className={`material-symbols-outlined text-lg fill ${ui.iconCls}`}>error</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{ui.sevLabel}</span>
            </div>

            {/* Title */}
            <h1 className="text-[32px] font-black tracking-tight leading-tight mb-2">
              {titleLine}
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Detected {formatDate(alert.ts)} at {formatTime(alert.ts)}
              {alert.severity ? ` • ${alert.severity.toUpperCase()}` : ""}
            </p>
          </div>
        )}

        {/* Graph Card（保留你原来的视觉，未来可接真实趋势数据） */}
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {alert?.metric ? `${alert.metric} (Last 1h)` : "Trend (Last 1h)"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
                  <p className="text-green-600 font-bold text-sm tracking-tight">Live view</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live View</span>
            </div>

            <div className="h-40 w-full relative">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 100 Q 50 80, 80 40 T 150 60 T 220 20 T 300 90 T 400 10" fill="none" stroke="#197fe6" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M0 100 Q 50 80, 80 40 T 150 60 T 220 20 T 300 90 T 400 10 V 120 H 0 Z" fill="url(#blueGrad)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="blueGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#197fe6"></stop>
                    <stop offset="100%" stopColor="#197fe6" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex justify-between mt-4">
              <span className="text-[10px] font-bold text-gray-400">60m</span>
              <span className="text-[10px] font-bold text-gray-400">30m</span>
              <span className="text-[10px] font-bold text-gray-400">Now</span>
            </div>
          </div>
        </div>

        {/* Email Status Messages（动态） */}
        {alert && (
          <div className="px-4 py-2">
            <div className={`${emailCardClass} rounded-2xl p-5`}>
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-full bg-white/70 dark:bg-black/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-gray-800 dark:text-gray-200">
                    {emailUI.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{emailUI.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 leading-relaxed">
                    {emailUI.desc}
                  </p>

                  {emailUI.showRetry || emailUI.showConfig ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        disabled={!emailUI.showRetry}
                        onClick={() => {
                          // 以后接：POST /api/alerts/:id/resend
                          alert("Retry placeholder (connect to resend endpoint later)");
                        }}
                        className={`font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md ${
                          emailUI.showRetry
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">sync</span>
                        Retry Send
                      </button>

                      <button
                        onClick={() => navigate("/emergency-email")}
                        className="bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">settings</span>
                        Config
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations（先用你原来的假建议，后面再按 metric 生成） */}
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-bold">Recommendations</h3>
          <div className="space-y-3">
            {[
              { icon: "person_check", text: "Check patient positioning immediately" },
              { icon: "bed", text: "Raise head of bed to 30 degrees" },
            ].map((rec, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">{rec.icon}</span>
                </div>
                <p className="text-sm font-semibold">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes（保留） */}
        <div className="p-4 mb-20">
          <h3 className="text-lg font-bold mb-3">Caregiver Notes</h3>
          <textarea
            className="w-full h-32 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary dark:placeholder-gray-600"
            placeholder="Add observation notes or actions taken..."
          ></textarea>
        </div>
      </div>

      {/* Sticky Bottom Actions（先做 placeholder） */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-gradient-to-t from-white dark:from-background-dark via-white dark:via-background-dark to-transparent z-50">
        <button
          onClick={() => {
            // 以后接：POST /api/alerts/:id/ack 或 /resolve
            alert("Acknowledge placeholder (connect to backend later)");
            navigate(-1);
          }}
          className="w-full bg-[#111418] dark:bg-white text-white dark:text-[#111418] font-bold py-4 rounded-2xl shadow-xl text-base active:scale-[0.98] transition-all"
        >
          Acknowledge & Close Alert
        </button>
      </div>
    </div>
  );
};

export default AlertDetails;
