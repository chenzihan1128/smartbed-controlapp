import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import state from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON = process.env.PYTHON_BIN || "python3";
const SCRIPT_PATH = path.join(__dirname, "..", "device", "ble_reader.py");

let sensorProc = null;

function resetSensorState() {
  state.sensor.connected = false;
  state.sensor.streaming = false;
  state.sensor.lastPacketAt = null;
  state.sensor.lastPpg = null;
  state.sensor.lastWave = null;
  state.sensor.analysis = {
    hr: null,
    rr: null,
    spo2: null,
    sys: null,
    dia: null,
  };
  state.sensor.lastError = null;
}

function applyMessage(msg) {
  if (msg.type === "status") {
    if (msg.state === "connected") state.sensor.connected = true;
    if (msg.state === "streaming") state.sensor.streaming = true;
    if (msg.state === "idle") state.sensor.streaming = false;
    if (msg.state === "disconnected" || msg.state === "stopped") {
      resetSensorState();
    }
    return;
  }

  if (msg.type === "wave") {
    state.sensor.connected = true;
    state.sensor.streaming = true;
    state.sensor.lastPacketAt = new Date().toISOString();
    state.sensor.lastWave = {
      ecg: msg.ecg,
      ppg: msg.ppg,
      count: msg.count,
    };
    state.sensor.lastPpg = {
      a: msg.ecg,
      b: msg.ppg,
      count: msg.count,
    };
    return;
  }

  if (msg.type === "analysis") {
    const key = String(msg.key || "").toUpperCase();
    const value = msg.value;

    if (key === "HR") state.sensor.analysis.hr = value;
    if (key === "RR") state.sensor.analysis.rr = value;
    if (key === "SPO2") state.sensor.analysis.spo2 = value;
    if (key === "SYS") state.sensor.analysis.sys = value;
    if (key === "DIA") state.sensor.analysis.dia = value;
    return;
  }

  if (msg.type === "error") {
    state.sensor.lastError = msg.message || "Unknown sensor error";
  }
}

export async function initSensorReader() {
  if (String(process.env.SENSOR_MODE || "mock").toLowerCase() !== "ble") {
    return;
  }

  if (sensorProc) return;

  const env = {
    ...process.env,
  };

  const proc = spawn(PYTHON, [SCRIPT_PATH], {
    stdio: ["pipe", "pipe", "pipe"],
    env,
  });

  sensorProc = proc;
  resetSensorState();

  const rl = readline.createInterface({ input: proc.stdout });
  rl.on("line", (line) => {
    try {
      const msg = JSON.parse(line);
      applyMessage(msg);
    } catch {
      // ignore invalid lines
    }
  });

  proc.stderr.on("data", (data) => {
    state.sensor.lastError = data.toString();
    process.stderr.write(`[ble-reader:err] ${data.toString()}`);
  });

  proc.on("exit", (code, signal) => {
    console.log(`[ble-reader] exited code=${code} signal=${signal}`);
    sensorProc = null;
    resetSensorState();
  });
}

export async function shutdownSensorReader() {
  if (!sensorProc) return;
  try {
    if (sensorProc.stdin?.writable) {
      sensorProc.stdin.write("exit\n");
    }
    sensorProc.kill("SIGTERM");
  } catch {}
}

export async function startSensorStream() {
  await initSensorReader();
  if (!sensorProc?.stdin?.writable) {
    throw new Error("Sensor reader not available");
  }
  sensorProc.stdin.write("start\n");
  state.sensor.lastError = null;
}

export async function stopSensorStream() {
  if (!sensorProc?.stdin?.writable) {
    throw new Error("Sensor reader not available");
  }
  sensorProc.stdin.write("stop\n");
  state.sensor.streaming = false;
}
