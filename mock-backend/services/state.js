const state = {
    caregivers: [
      {
        id: "c1",
        name: "Alice Tan",
        email: "alice@example.com",
        avatarColor: "bg-blue-100 text-blue-600",
      },
      {
        id: "c2",
        name: "Ben Lim",
        email: "ben@example.com",
        avatarColor: "bg-green-100 text-green-600",
      },
    ],
  
    settings: {
      emergencyEmail: "",
    },
  
    lastUpdate: Date.now(),
  
    safetyState: "normal", // normal | limited | locked
  
    bed: {
      state: "stop",          // stop | moving
      direction: null,        // "up" | "down" | null
      moving: false,          // true | false
      lastAction: "stop",     // start-up | start-down | stop | flat
      lastActionAt: null,     // ISO string
      autoStopAt: null,       // ISO string | null
    },
  
    sensor: {
      connected: true,
      rssi: -55,
      battery: 78,
      stale: false,
    },
  
    metrics: {
      hr: null,
      rr: null,
      spo2: null,
      temp: null,
      bp: {
        sys: null,
        dia: null,
      },
      ts: null,
    },
  
    alarm: {
      active: false,
      message: null,
      severity: null, // normal | warning | critical
    },

    alerts: [
      {
        id: "a1",
        severity: "warning",
        metric: "SpO2",
        message: "SpO2 below threshold",
        ts: new Date(Date.now() - 2 * 60_000).toISOString(),
        emailStatus: "sent",
        state: "active",
      },
      {
        id: "a2",
        severity: "critical",
        metric: "BP",
        message: "Blood pressure critically high",
        ts: new Date(Date.now() - 8 * 60_000).toISOString(),
        emailStatus: "failed",
        state: "active",
      },
      {
        id: "a3",
        severity: "warning",
        metric: "HR",
        message: "Heart rate above warning threshold",
        ts: new Date(Date.now() - 30 * 60_000).toISOString(),
        emailStatus: "pending",
        state: "active",
      },
      {
        id: "a4",
        severity: "normal",
        metric: "Temp",
        message: "Temperature back to normal",
        ts: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
        emailStatus: "sent",
        state: "resolved",
      },
      {
        id: "a5",
        severity: "warning",
        metric: "RR",
        message: "Respiratory rate low",
        ts: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
        emailStatus: "not_set",
        state: "active",
      },
    ],
  };
  
  export default state;
