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
      lastAction: "stop",     // start-up | start-down | stop
      lastActionAt: null,     // ISO string
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
  };
  
  export default state;