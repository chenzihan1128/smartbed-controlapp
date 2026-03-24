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
}

function applyMessage(msg) {
  if (msg.type === "status") {
    if (msg.state === "connected") state.sensor.connected = true;
    if (msg.state === "streaming") state.sensor.streaming = true;
    if (msg.state === "disconnected" || msg.state === "stopped") {
      resetSensorState();
    }
    return;
  }

  if (msg.type === "ppg") {
    state.sensor.connected = true;
    state.sensor.streaming = true;
    state.sensor.lastPacketAt = new Date().toISOString();
    state.sensor.lastPpg = {
      a: msg.a,
      b: msg.b,
      count: msg.count,
    };
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
    stdio: ["ignore", "pipe", "pipe"],
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
    sensorProc.kill("SIGTERM");
  } catch {}
}
