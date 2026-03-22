import express from "express";
import state from "../services/state.js";
import { flatBed, startUp, startDown, stopBed } from "../services/bedService.js";

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({
    ok: true,
    bed: state.bed,
    safety: { state: state.safetyState },
  });
});

router.post("/start-up", async (req, res) => {
  try {
    if (state.safetyState === "locked") {
      return res.status(403).json({
        ok: false,
        error: "Controls locked due to a critical alert.",
      });
    }

    const output = await startUp();

    res.json({
      ok: true,
      action: "start-up",
      bed: state.bed,
      output,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

router.post("/start-down", async (req, res) => {
  try {
    if (state.safetyState === "locked") {
      return res.status(403).json({
        ok: false,
        error: "Controls locked due to a critical alert.",
      });
    }

    const output = await startDown();

    res.json({
      ok: true,
      action: "start-down",
      bed: state.bed,
      output,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

router.post("/stop", async (req, res) => {
  try {
    const output = await stopBed();

    res.json({
      ok: true,
      action: "stop",
      bed: state.bed,
      output,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

router.post("/flat", async (req, res) => {
  try {
    if (state.safetyState === "locked") {
      return res.status(403).json({
        ok: false,
        error: "Controls locked due to a critical alert.",
      });
    }

    const output = await flatBed();

    res.json({
      ok: true,
      action: "flat",
      bed: state.bed,
      output,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

export default router;
