import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());

let caregivers = [
  { id: "c1", name: "Alice Tan", email: "alice@example.com", avatarColor: "bg-blue-100 text-blue-600" },
  { id: "c2", name: "Ben Lim", email: "ben@example.com", avatarColor: "bg-green-100 text-green-600" },
];


let settings = {
  emergencyEmail: "",
};
let lastUpdate = Date.now();
let safetyState = "normal"; // normal | limited | locked


function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}
function metrics() {
  lastUpdate = Date.now();
  return {
    ts: new Date().toISOString(),
    hr: Math.round(rand(78, 10)),
    rr: Math.round(rand(16, 4)),
    spo2: Math.round(rand(97, 2)),
    temp: rand(36.7, 0.4),
    bp: { sys: Math.round(rand(125, 15)), dia: Math.round(rand(78, 10)) }
  };
}

app.get("/api/settings", (req, res) => {
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  const { emergencyEmail } = req.body || {};
  if (typeof emergencyEmail === "string") {
    settings.emergencyEmail = emergencyEmail.trim();
  }
  res.json({ ok: true, settings });
});


app.get("/api/status", (_, res) => {
  res.json({
    ble: { state: "connected", rssi: -55, battery: 78 },
    stale: Date.now() - lastUpdate > 30000,
    lastUpdate: new Date(lastUpdate).toISOString(),
    safety: { state: safetyState }
  });
});

app.get("/api/metrics/latest", (_, res) => res.json(metrics()));

app.get("/api/alerts", (req, res) => {
  res.json([
    {
      id: "a1",
      severity: "warning",
      metric: "SpO2",
      message: "SpO2 below threshold",
      ts: new Date(Date.now() - 2 * 60_000).toISOString(),
      emailStatus: "sent",
      state: "active"
    },
    {
      id: "a2",
      severity: "critical",
      metric: "BP",
      message: "Blood pressure critically high",
      ts: new Date(Date.now() - 8 * 60_000).toISOString(),
      emailStatus: "failed",
      state: "active"
    },
    {
      id: "a3",
      severity: "warning",
      metric: "HR",
      message: "Heart rate above warning threshold",
      ts: new Date(Date.now() - 30 * 60_000).toISOString(),
      emailStatus: "pending",
      state: "active"
    },
    {
      id: "a4",
      severity: "normal",
      metric: "Temp",
      message: "Temperature back to normal",
      ts: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
      emailStatus: "sent",
      state: "resolved"
    },
    {
      id: "a5",
      severity: "warning",
      metric: "RR",
      message: "Respiratory rate low",
      ts: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
      emailStatus: "not_set",
      state: "active"
    }
  ]);
});

app.get("/api/caregivers", (req, res) => {
  res.json(caregivers);
});

app.post("/api/caregivers", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ ok: false, error: "name and email required" });

  const id = `c${Date.now()}`;
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-purple-100 text-purple-600",
    "bg-red-100 text-red-600",
  ];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const item = { id, name: String(name).trim(), email: String(email).trim(), avatarColor };
  caregivers.unshift(item);
  res.json({ ok: true, caregiver: item });
});

app.post("/api/caregivers/test-email", (req, res) => {
  // 先 mock：真实后端再接 SMTP
  console.log("TEST EMAIL to caregivers:", caregivers.map(c => c.email));
  res.json({ ok: true, count: caregivers.length, ts: new Date().toISOString() });
});


app.post("/api/bed/:action", (req, res) => {
  if (safetyState === "locked") return res.status(403).json({ ok:false, error:"Controls locked due to a critical alert." });
  console.log("BED ACTION:", req.params.action);
  res.json({ ok:true });
});

// for quick testing: POST /api/dev/safety/locked
app.post("/api/dev/safety/:state", (req,res)=>{ safetyState=req.params.state; res.json({ok:true, safetyState}); });

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/stream" });

wss.on("connection", (ws) => {
  const t = setInterval(() => ws.send(JSON.stringify({ type:"metrics", data: metrics(), safety:{state:safetyState} })), 1000);
  ws.on("close", () => clearInterval(t));
});

server.listen(8000, () => console.log("Mock backend on http://localhost:8000"));
