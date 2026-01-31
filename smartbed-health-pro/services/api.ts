export async function bedAction(action: "head_up" | "head_down" | "flat" | "memory") {
  const res = await fetch(`/api/bed/${action}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return res.json().catch(() => ({ ok: true }));
}

export async function getStatus() {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(`Status failed (${res.status})`);
  return res.json();
}

export type AlertItem = {
  id: string;
  severity: "critical" | "warning" | "normal" | "info";
  metric?: string;
  message?: string;
  ts?: string;
  emailStatus?: "sent" | "failed" | "pending" | "not_set";
  state?: "active" | "resolved"; // optional (backend may not have yet)
};

export async function getAlerts() {
  const res = await fetch("/api/alerts");
  if (!res.ok) throw new Error(`Alerts failed (${res.status})`);
  return (await res.json()) as AlertItem[];
}

export type Settings = {
  emergencyEmail: string;
};

export async function getSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error(`Settings failed (${res.status})`);
  return (await res.json()) as Settings;
}

export async function saveSettings(payload: Partial<Settings>) {
  const res = await fetch("/api/settings", {
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
  const res = await fetch("/api/caregivers");
  if (!res.ok) throw new Error(`Caregivers failed (${res.status})`);
  return (await res.json()) as Caregiver[];
}

export async function addCaregiver(payload: { name: string; email: string }) {
  const res = await fetch("/api/caregivers", {
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
  const res = await fetch("/api/caregivers/test-email", { method: "POST" });
  if (!res.ok) throw new Error(`Test email failed (${res.status})`);
  return await res.json();
}
