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

    alertRules: {
      hr: {
        warning: { high: 100, low: 55 },
        critical: { high: 120, low: 40 },
      },
      spo2: {
        warning: { high: 99, low: 94 },
        critical: { high: 100, low: 90 },
      },
      bpSys: {
        warning: { high: 140, low: 90 },
        critical: { high: 160, low: 80 },
      },
      rr: {
        warning: { high: 22, low: 12 },
        critical: { high: 28, low: 10 },
      },
      temp: {
        warning: { high: 37.8, low: 35.8 },
        critical: { high: 38.6, low: 35.2 },
      },
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

    alerts: [],
  };
  
  export default state;
