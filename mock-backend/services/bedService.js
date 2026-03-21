import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import state from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON = "python3";
const SCRIPT_PATH = path.join(__dirname, "..", "device", "bed_control.py");

function runBedCommand(args = []) {
  return new Promise((resolve, reject) => {
    execFile(PYTHON, [SCRIPT_PATH, ...args], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve((stdout || "").trim());
    });
  });
}

export async function startUp() {
  const output = await runBedCommand(["start-up"]);

  state.bed.state = "moving";
  state.bed.direction = "up";
  state.bed.moving = true;
  state.bed.lastAction = "start-up";
  state.bed.lastActionAt = new Date().toISOString();

  return output;
}

export async function startDown() {
  const output = await runBedCommand(["start-down"]);

  state.bed.state = "moving";
  state.bed.direction = "down";
  state.bed.moving = true;
  state.bed.lastAction = "start-down";
  state.bed.lastActionAt = new Date().toISOString();

  return output;
}

export async function stopBed() {
  const output = await runBedCommand(["stop"]);

  state.bed.state = "stop";
  state.bed.direction = null;
  state.bed.moving = false;
  state.bed.lastAction = "stop";
  state.bed.lastActionAt = new Date().toISOString();

  return output;
}