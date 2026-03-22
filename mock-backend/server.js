import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import bedRoutes from "./routes/bedRoutes.js";
import state from "./services/state.js";
import { initBedController, shutdownBedController } from "./services/bedService.js";

const app = express();
app.use(express.json());

function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}

function metrics() {
  state.lastUpdate = Date.now();

  const data = {
    ts: new Date().toISOString(),
    hr: Math.round(rand(78, 10)),
    rr: Math.round(rand(16, 4)),
    spo2: Math.round(rand(97, 2)),
    temp: rand(36.7, 0.4),
    bp: {
      sys: Math.round(rand(125, 15)),
      dia: Math.round(rand(78, 10)),
    },
  };

  state.metrics = data;
  return data;
}

app.get("/api/settings", (req, res) => {
  res.json(state.settings);
});

app.post("/api/settings", (req, res) => {
  const { emergencyEmail } = req.body || {};
  if (typeof emergencyEmail === "string") {
    state.settings.emergencyEmail = emergencyEmail.trim();
  }
  res.json({ ok: true, settings: state.settings });
});

app.get("/api/status", (_, res) => {
  res.json({
    ble: {
      state: state.sensor.connected ? "connected" : "disconnected",
      rssi: state.sensor.rssi,
      battery: state.sensor.battery,
    },
    stale: Date.now() - state.lastUpdate > 30000,
    lastUpdate: new Date(state.lastUpdate).toISOString(),
    safety: { state: state.safetyState },
    bed: state.bed,
  });
});

app.get("/api/metrics/latest", (_, res) => {
  res.json(metrics());
});

app.get("/api/alerts", (req, res) => {
  const list = [...state.alerts].sort((a, b) => {
    const ta = a.ts ? new Date(a.ts).getTime() : 0;
    const tb = b.ts ? new Date(b.ts).getTime() : 0;
    return tb - ta;
  });

  res.json(list);
});

app.post("/api/alerts/:id/resolve", (req, res) => {
  const item = state.alerts.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Alert not found" });
  }

  item.state = "resolved";
  item.lastActionAt = new Date().toISOString();

  res.json({ ok: true, alert: item });
});

app.post("/api/alerts/:id/resend", (req, res) => {
  const item = state.alerts.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Alert not found" });
  }

  item.emailStatus = "sent";
  item.lastEmailAt = new Date().toISOString();

  console.log("RESEND ALERT EMAIL:", {
    alertId: item.id,
    emails: state.caregivers.map((c) => c.email),
  });

  res.json({ ok: true, alert: item, count: state.caregivers.length });
});

app.post("/api/alerts/:id/emergency", (req, res) => {
  const item = state.alerts.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Alert not found" });
  }

  console.log("EMERGENCY BROADCAST:", {
    alertId: item.id,
    message: item.message,
    caregivers: state.caregivers.map((c) => c.email),
    emergencyEmail: state.settings.emergencyEmail || null,
  });

  item.emailStatus = "sent";
  item.lastEmergencyAt = new Date().toISOString();

  res.json({
    ok: true,
    alert: item,
    caregivers: state.caregivers.length,
    emergencyEmail: state.settings.emergencyEmail || null,
  });
});

app.get("/api/caregivers", (req, res) => {
  res.json(state.caregivers);
});

app.post("/api/caregivers", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "name and email required" });
  }

  const id = `c${Date.now()}`;
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-purple-100 text-purple-600",
    "bg-red-100 text-red-600",
  ];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const item = {
    id,
    name: String(name).trim(),
    email: String(email).trim(),
    avatarColor,
  };

  state.caregivers.unshift(item);
  res.json({ ok: true, caregiver: item });
});

app.post("/api/caregivers/test-email", (req, res) => {
  console.log("TEST EMAIL to caregivers:", state.caregivers.map((c) => c.email));
  res.json({
    ok: true,
    count: state.caregivers.length,
    ts: new Date().toISOString(),
  });
});

app.use("/api/bed", bedRoutes);

app.post("/api/dev/safety/:state", (req, res) => {
  state.safetyState = req.params.state;
  res.json({ ok: true, safetyState: state.safetyState });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/stream" });

wss.on("connection", (ws) => {
  const t = setInterval(() => {
    ws.send(
      JSON.stringify({
        type: "metrics",
        data: metrics(),
        safety: { state: state.safetyState },
        bed: state.bed,
      })
    );
  }, 1000);

  ws.on("close", () => clearInterval(t));
});

let shuttingDown = false;

async function cleanupAndExit(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    console.log("Shutting down bed controller...");
    await shutdownBedController();
  } catch (err) {
    console.error("Error during shutdownBedController():", err);
  }

  try {
    server.close(() => {
      process.exit(code);
    });

    setTimeout(() => {
      process.exit(code);
    }, 2000);
  } catch (err) {
    console.error("Error during server close:", err);
    process.exit(code);
  }
}

function listenAsync(port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

async function start() {
  try {
    await initBedController();
    await listenAsync(8000);
    console.log("Backend on http://localhost:8000");
  } catch (err) {
    console.error("Failed to start server:", err);
    await cleanupAndExit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("Received SIGINT");
  await cleanupAndExit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM");
  await cleanupAndExit(0);
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await cleanupAndExit(1);
});

process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  await cleanupAndExit(1);
});

start();
