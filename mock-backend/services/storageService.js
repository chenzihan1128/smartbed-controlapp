import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import state from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "app-state.json");

export async function loadPersistentState() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed.caregivers)) {
      state.caregivers = parsed.caregivers;
    }

    if (parsed.settings && typeof parsed.settings === "object") {
      state.settings = {
        ...state.settings,
        ...parsed.settings,
      };
    }
  } catch (err) {
    if (err?.code !== "ENOENT") {
      console.error("Failed to load persisted app state:", err);
    }
  }
}

export async function persistAppState() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(
      {
        caregivers: state.caregivers,
        settings: state.settings,
      },
      null,
      2
    ),
    "utf8"
  );
}
