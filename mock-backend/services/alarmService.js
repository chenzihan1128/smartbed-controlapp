import state from "./state.js";
import { sendAlertEmail } from "./emailService.js";

let nextAlertId = 1;

function toIsoNow() {
  return new Date().toISOString();
}

function buildThresholdSeverity(value, rule) {
  if (value == null || !rule) return "normal";

  if (value >= rule.critical.high || value <= rule.critical.low) return "critical";
  if (value >= rule.warning.high || value <= rule.warning.low) return "warning";
  return "normal";
}

function buildMessage(metric, severity, value) {
  const v = typeof value === "number" ? Number(value.toFixed?.(1) ?? value) : value;
  const sev = severity === "critical" ? "critical" : "warning";

  switch (metric) {
    case "HR":
      return `Heart rate is ${sev} at ${v} BPM`;
    case "SpO2":
      return `SpO2 is ${sev} at ${v}%`;
    case "BP":
      return `Systolic blood pressure is ${sev} at ${v}`;
    case "RR":
      return `Respiratory rate is ${sev} at ${v} rpm`;
    case "Temp":
      return `Temperature is ${sev} at ${v}°C`;
    default:
      return `${metric} is ${sev}`;
  }
}

function findActiveAlert(metric) {
  return state.alerts.find((a) => a.metric === metric && a.state !== "resolved" && a.source === "engine");
}

async function queueCriticalEmail(alert) {
  alert.emailStatus = "pending";

  try {
    const result = await sendAlertEmail(alert);
    alert.emailStatus = result.ok ? "sent" : result.reason === "no_recipients" ? "not_set" : "failed";
    alert.lastEmailAt = toIsoNow();
  } catch (err) {
    console.error("Failed to send alert email:", err);
    alert.emailStatus = "failed";
    alert.lastEmailAt = toIsoNow();
  }
}

function createAlert(metric, severity, value) {
  const alert = {
    id: `auto-${nextAlertId++}`,
    metric,
    severity,
    message: buildMessage(metric, severity, value),
    ts: toIsoNow(),
    emailStatus: severity === "critical" ? "pending" : "not_set",
    state: "active",
    source: "engine",
  };

  state.alerts.unshift(alert);

  if (severity === "critical") {
    void queueCriticalEmail(alert);
  }

  return alert;
}

function resolveAlert(alert, metric) {
  alert.state = "resolved";
  alert.resolvedAt = toIsoNow();
  alert.message = `${metric} returned to normal`;
}

function upsertAlert(metric, severity, value) {
  const current = findActiveAlert(metric);

  if (severity === "normal") {
    if (current) resolveAlert(current, metric);
    return;
  }

  if (!current) {
    createAlert(metric, severity, value);
    return;
  }

  const wasCritical = current.severity === "critical";
  current.severity = severity;
  current.message = buildMessage(metric, severity, value);
  current.ts = toIsoNow();
  current.state = "active";

  if (severity === "critical" && !wasCritical) {
    void queueCriticalEmail(current);
  }
}

function recomputeSafety() {
  const activeAlerts = state.alerts.filter((a) => a.state !== "resolved");
  const critical = activeAlerts.find((a) => a.severity === "critical");
  const warning = activeAlerts.find((a) => a.severity === "warning");

  if (critical) {
    state.safetyState = "locked";
    state.alarm.active = true;
    state.alarm.severity = "critical";
    state.alarm.message = critical.message;
    return;
  }

  if (warning) {
    state.safetyState = "limited";
    state.alarm.active = true;
    state.alarm.severity = "warning";
    state.alarm.message = warning.message;
    return;
  }

  state.safetyState = "normal";
  state.alarm.active = false;
  state.alarm.severity = "normal";
  state.alarm.message = null;
}

export function evaluateMetrics(metrics) {
  const checks = [
    { metric: "HR", value: metrics.hr, rule: state.alertRules.hr },
    { metric: "SpO2", value: metrics.spo2, rule: state.alertRules.spo2 },
    { metric: "BP", value: metrics.bp?.sys, rule: state.alertRules.bpSys },
    { metric: "RR", value: metrics.rr, rule: state.alertRules.rr },
    { metric: "Temp", value: metrics.temp, rule: state.alertRules.temp },
  ];

  for (const item of checks) {
    const severity = buildThresholdSeverity(item.value, item.rule);
    upsertAlert(item.metric, severity, item.value);
  }

  recomputeSafety();
}
