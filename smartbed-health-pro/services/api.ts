export type BedAction = "start-up" | "start-down" | "stop" | "flat";

export type BackendStatus = {
  ble: {
    state: "connected" | "disconnected";
    rssi?: number;
    battery?: number;
    streaming?: boolean;
    lastPacketAt?: string | null;
    lastPpg?: {
      a?: string;
      b?: string;
      count?: number;
    } | null;
    lastWave?: {
      ecg?: string;
      ppg?: string;
      count?: number;
    } | null;
    analysis?: {
      hr?: number | null;
      rr?: number | null;
      spo2?: number | null;
      sys?: number | null;
      dia?: number | null;
    } | null;
    lastError?: string | null;
  };
  stale?: boolean;
  lastUpdate?: string;
  safety?: {
    state?: "normal" | "limited" | "locked";
  };
  bed?: unknown;
};

function getApiBaseUrl() {
  if (!import.meta.env.PROD) return "";

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.hostname}:8000`;
}

function apiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

export async function bedAction(action: BedAction) {
  const res = await fetch(apiUrl(`/api/bed/${action}`), {
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return res.json().catch(() => ({ ok: true }));
}

export async function sensorAction(action: "start" | "stop") {
  const res = await fetch(apiUrl(`/api/sensor/${action}`), {
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Sensor request failed (${res.status})`);
  }

  return await res.json();
}

export async function getStatus() {
  const res = await fetch(apiUrl("/api/status"));
  if (!res.ok) throw new Error(`Status failed (${res.status})`);
  return (await res.json()) as BackendStatus;
}

export type AlertItem = {
  id: string;
  severity: "critical" | "warning" | "normal" | "info";
  metric?: string;
  message?: string;
  ts?: string;
  emailStatus?: "sent" | "failed" | "pending" | "not_set";
  state?: "active" | "resolved";
};

export async function getAlerts() {
  const res = await fetch(apiUrl("/api/alerts"));
  if (!res.ok) throw new Error(`Alerts failed (${res.status})`);
  return (await res.json()) as AlertItem[];
}

export async function resolveAlert(id: string) {
  const res = await fetch(apiUrl(`/api/alerts/${id}/resolve`), { method: "POST" });
  if (!res.ok) throw new Error(`Resolve alert failed (${res.status})`);
  return await res.json();
}

export async function resendAlert(id: string) {
  const res = await fetch(apiUrl(`/api/alerts/${id}/resend`), { method: "POST" });
  if (!res.ok) throw new Error(`Resend alert failed (${res.status})`);
  return await res.json();
}

export async function triggerEmergencyAlert(id: string) {
  const res = await fetch(apiUrl(`/api/alerts/${id}/emergency`), { method: "POST" });
  if (!res.ok) throw new Error(`Emergency action failed (${res.status})`);
  return await res.json();
}

export type Settings = {
  emergencyEmail: string;
};

export type AlertRulePayload = {
  warning: { high: number; low: number };
  critical: { high: number; low: number };
};

export type AlertRulesResponse = {
  hr: AlertRulePayload;
  spo2: AlertRulePayload;
  bp: AlertRulePayload;
  rr?: AlertRulePayload;
  temp?: AlertRulePayload;
};

export async function getSettings() {
  const res = await fetch(apiUrl("/api/settings"));
  if (!res.ok) throw new Error(`Settings failed (${res.status})`);
  return (await res.json()) as Settings;
}

export async function getAlertRules() {
  const res = await fetch(apiUrl("/api/alert-rules"));
  if (!res.ok) throw new Error(`Alert rules failed (${res.status})`);
  return (await res.json()) as AlertRulesResponse;
}

export async function saveAlertRules(payload: AlertRulesResponse) {
  const res = await fetch(apiUrl("/api/alert-rules"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save alert rules failed (${res.status})`);
  return await res.json();
}

export async function saveSettings(payload: Partial<Settings>) {
  const res = await fetch(apiUrl("/api/settings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save settings failed (${res.status})`);
  return await res.json();
}

export type Caregiver = {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
};

export async function getCaregivers() {
  const res = await fetch(apiUrl("/api/caregivers"));
  if (!res.ok) throw new Error(`Caregivers failed (${res.status})`);
  return (await res.json()) as Caregiver[];
}

export async function addCaregiver(payload: { name: string; email: string }) {
  const res = await fetch(apiUrl("/api/caregivers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Add caregiver failed (${res.status})`);
  }

  return await res.json();
}

export async function sendTestEmailToAll() {
  const res = await fetch(apiUrl("/api/caregivers/test-email"), { method: "POST" });
  if (!res.ok) throw new Error(`Test email failed (${res.status})`);
  return await res.json();
}
