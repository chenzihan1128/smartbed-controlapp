import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlerts, AlertItem } from "../services/api";

type Filter = "active" | "all" | "resolved";

function formatTime(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(ts?: string) {
  if (!ts) return "";
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const AlertsList: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("active");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // 拉取后端 alerts（并定时刷新）
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const data = await getAlerts();
        if (cancelled) return;
        setAlerts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load alerts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = window.setInterval(load, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  // 兼容后端暂时没有 state/resolved 字段的情况：
  // - 如果没有 state，就默认都当 active（因为你说只存异常，且目前 mock 只给一条）
  const normalized = useMemo(() => {
    return alerts.map((a) => ({
      ...a,
      state: a.state ?? "active",
    }));
  }, [alerts]);

  const filtered = useMemo(() => {
    if (filter === "all") return normalized;
    if (filter === "resolved") return normalized.filter((a) => a.state === "resolved");
    return normalized.filter((a) => a.state !== "resolved"); // active
  }, [normalized, filter]);

  const liveCritical = useMemo(() => {
    // 优先找 critical 且 active 的作为置顶
    const crit = normalized.find((a) => a.severity === "critical" && a.state !== "resolved");
    if (crit) return crit;

    // 没有 critical：就取第一条 active 做置顶
    const firstActive = normalized.find((a) => a.state !== "resolved");
    return firstActive ?? null;
  }, [normalized]);

  const liveCount = useMemo(() => {
    return normalized.filter((a) => a.state !== "resolved").length;
  }, [normalized]);

  // history：把置顶那条排除掉，剩下的按时间倒序
  const history = useMemo(() => {
    const rest = normalized.filter((a) => a.id !== liveCritical?.id);
    return rest.sort((a, b) => {
      const ta = a.ts ? new Date(a.ts).getTime() : 0;
      const tb = b.ts ? new Date(b.ts).getTime() : 0;
      return tb - ta;
    });
  }, [normalized, liveCritical]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-4 justify-center h-14">
          <h2 className="text-lg font-bold leading-tight tracking-tight">Alerts</h2>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
        {(["active", "all", "resolved"] as Filter[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`h-9 shrink-0 px-5 rounded-full text-sm font-bold capitalize transition-all border ${
              filter === t
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-100 dark:border-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active Alerts Section */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold tracking-tight">Active Alerts</h3>
          <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {liveCount} Live
          </span>
        </div>

        {/* 状态提示 */}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Loading alerts...</div>
        )}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Live Card（使用后端数据） */}
        {liveCritical && (
          <div
            onClick={() => navigate(`/alert/${liveCritical.id}`)}
            className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border-l-4 p-4 mb-6 cursor-pointer active:scale-[0.98] transition-all ${
              liveCritical.severity === "critical" ? "border-red-500" : "border-orange-500"
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[20px] fill ${
                      liveCritical.severity === "critical" ? "text-red-500" : "text-orange-500"
                    }`}
                  >
                    error
                  </span>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      liveCritical.severity === "critical" ? "text-red-500" : "text-orange-500"
                    }`}
                  >
                    {liveCritical.severity === "critical" ? "Critical Alert" : "Warning Alert"}
                  </p>
                </div>

                <h4 className="text-xl font-bold mt-1">
                  {liveCritical.metric ? `${liveCritical.metric}: ` : ""}
                  {liveCritical.message ? "" : ""}
                </h4>

                <p className="text-gray-500 dark:text-gray-400 text-sm leading-snug">
                  {liveCritical.message || "Abnormal event detected. Please review details."}
                </p>

                <div className="mt-2 text-[11px] font-semibold text-gray-400">
                  {liveCritical.ts ? `Time: ${formatTime(liveCritical.ts)} • ${timeAgo(liveCritical.ts)}` : ""}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 这里先不做真实拨号逻辑，你后面可以接电话/通知
                      alert("Emergency action placeholder");
                    }}
                    className={`flex-1 h-10 text-white rounded-lg font-bold text-xs shadow-md flex items-center justify-center gap-2 ${
                      liveCritical.severity === "critical" ? "bg-red-500" : "bg-orange-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">emergency</span>
                    Emergency Call
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Dismiss/Resolve 以后接后端：POST /api/alerts/:id/resolve
                      alert("Dismiss placeholder (connect to /api/alerts/:id/resolve later)");
                    }}
                    className="h-10 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center border shrink-0 ${
                  liveCritical.severity === "critical"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-500/20"
                    : "bg-orange-50 dark:bg-orange-900/20 border-orange-500/20"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-3xl ${
                    liveCritical.severity === "critical" ? "text-red-500" : "text-orange-500"
                  }`}
                >
                  medical_services
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !liveCritical && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            No active alerts.
          </div>
        )}
      </div>

      {/* History List（使用后端数据替代 MOCK_ALERTS） */}
      <div>
        <div className="bg-gray-100 dark:bg-gray-900/50 px-4 py-2 border-y border-gray-200 dark:border-gray-800">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            History
          </h3>
        </div>

        {filtered
          .filter((a) => a.id !== liveCritical?.id) // 避免重复
          .map((alert) => {
            const isWarning = alert.severity === "warning";
            const isOk = alert.severity === "normal" || alert.severity === "info";
            const icon = isWarning ? "warning" : isOk ? "check_circle" : "error";

            const badgeBg =
              alert.severity === "critical"
                ? "bg-red-100 text-red-600"
                : alert.severity === "warning"
                ? "bg-orange-100 text-orange-600"
                : "bg-green-100 text-green-600";

            return (
              <div
                key={alert.id}
                onClick={() => navigate(`/alert/${alert.id}`)}
                className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark flex gap-4 active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badgeBg}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                  </div>
                  <div className="w-px h-full bg-gray-100 dark:bg-gray-800 mt-2"></div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-bold">
                        {alert.metric ? `${alert.metric}` : "Alert"}{" "}
                        <span className="text-gray-400 font-semibold">
                          {alert.message ? `• ${alert.message}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bed Sensor A1 • {formatTime(alert.ts)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {timeAgo(alert.ts)}
                    </span>
                  </div>

                  {/* Email status banner（来自后端） */}
                  {alert.emailStatus === "failed" && (
                    <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-[18px]">
                          mail_lock
                        </span>
                        <span className="text-xs font-semibold text-red-500">
                          Email Notification Failed
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 以后接：POST /api/alerts/:id/resend
                          alert("Retry placeholder (connect to resend endpoint later)");
                        }}
                        className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        RETRY
                      </button>
                    </div>
                  )}

                  {alert.emailStatus === "pending" && (
                    <div className="mt-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-600 text-[18px]">
                          schedule
                        </span>
                        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                          Email Sending...
                        </span>
                      </div>
                    </div>
                  )}

                  {alert.emailStatus === "not_set" && (
                    <div className="mt-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-600 text-[18px]">
                          mail
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Emergency email not set
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/settings"); // 你可以调整到具体设置页路径
                        }}
                        className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">settings</span>
                        SET NOW
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {!loading && !error && filtered.length <= (liveCritical ? 1 : 0) && (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No alerts for this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
