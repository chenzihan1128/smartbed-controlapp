import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import state from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON = "python3";
const SCRIPT_PATH = path.join(__dirname, "..", "device", "bed_daemon.py");

let bedProc = null;
let ready = false;
let startingPromise = null;

function attachProcessListeners(proc) {
  proc.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(`[bed-daemon] ${text}`);

    if (text.includes("BED_DAEMON_READY")) {
      ready = true;
    }
  });

  proc.stderr.on("data", (data) => {
    process.stderr.write(`[bed-daemon:err] ${data.toString()}`);
  });

  proc.on("exit", (code, signal) => {
    console.log(`[bed-daemon] exited code=${code} signal=${signal}`);
    bedProc = null;
    ready = false;
    startingPromise = null;

    state.bed.state = "stop";
    state.bed.direction = null;
    state.bed.moving = false;
    state.bed.lastAction = "stop";
    state.bed.lastActionAt = new Date().toISOString();
  });
}

async function ensureDaemon() {
  if (bedProc && ready) return;
  if (startingPromise) return startingPromise;

  startingPromise = new Promise((resolve, reject) => {
    try {
      const proc = spawn(PYTHON, [SCRIPT_PATH], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      bedProc = proc;
      ready = false;
      attachProcessListeners(proc);

      const timeout = setTimeout(() => {
        if (!ready) {
          reject(new Error("bed daemon start timeout"));
        }
      }, 3000);

      const checkReady = setInterval(() => {
        if (ready) {
          clearTimeout(timeout);
          clearInterval(checkReady);
          resolve();
        }
      }, 50);

      proc.on("error", (err) => {
        clearTimeout(timeout);
        clearInterval(checkReady);
        reject(err);
      });

      proc.on("exit", () => {
        clearTimeout(timeout);
        clearInterval(checkReady);
      });
    } catch (err) {
      reject(err);
    }
  });

  try {
    await startingPromise;
  } finally {
    startingPromise = null;
  }
}

function sendCommand(cmd) {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureDaemon();

      if (!bedProc || !bedProc.stdin.writable) {
        return reject(new Error("bed daemon not available"));
      }

      bedProc.stdin.write(`${cmd}\n`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function initBedController() {
  await ensureDaemon();
}

export async function startUp() {
  await sendCommand("start-up");

  state.bed.state = "moving";
  state.bed.direction = "up";
  state.bed.moving = true;
  state.bed.lastAction = "start-up";
  state.bed.lastActionAt = new Date().toISOString();

  return "start-up sent";
}

export async function startDown() {
  await sendCommand("start-down");

  state.bed.state = "moving";
  state.bed.direction = "down";
  state.bed.moving = true;
  state.bed.lastAction = "start-down";
  state.bed.lastActionAt = new Date().toISOString();

  return "start-down sent";
}

export async function stopBed() {
  await sendCommand("stop");

  state.bed.state = "stop";
  state.bed.direction = null;
  state.bed.moving = false;
  state.bed.lastAction = "stop";
  state.bed.lastActionAt = new Date().toISOString();

  return "stop sent";
}

export async function shutdownBedController() {
  try {
    if (bedProc && bedProc.stdin.writable) {
      bedProc.stdin.write("exit\n");
    }
  } catch {}
}