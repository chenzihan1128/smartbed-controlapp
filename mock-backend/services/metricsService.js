import state from "./state.js";
import { evaluateMetrics } from "./alarmService.js";

function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}

function buildBaselineMetrics() {
  return {
    ts: new Date().toISOString(),
    hr: 78,
    rr: 16,
    spo2: 97,
    temp: null,
    bp: {
      sys: 122,
      dia: 78,
    },
  };
}

function buildEmptyMetrics() {
  return {
    ts: new Date().toISOString(),
    hr: null,
    rr: null,
    spo2: null,
    temp: null,
    bp: {
      sys: null,
      dia: null,
    },
  };
}

export function metrics() {
  state.lastUpdate = Date.now();
  const analysis = state.sensor.analysis || {};

  if (!state.sensor.connected) {
    const data = buildEmptyMetrics();
    state.metrics = data;
    evaluateMetrics(data);
    return data;
  }

  if (!state.sensor.streaming) {
    const frozen = state.metrics?.ts ? { ...state.metrics } : buildBaselineMetrics();
    if (!state.metrics?.ts) {
      state.metrics = frozen;
    }
    return frozen;
  }

  const data = {
    ts: new Date().toISOString(),
    hr: Number.isFinite(analysis.hr) ? Number(analysis.hr) : Math.round(rand(78, 7)),
    rr: Number.isFinite(analysis.rr) ? Number(analysis.rr) : Math.round(rand(16, 2)),
    spo2: Number.isFinite(analysis.spo2) ? Number(analysis.spo2) : Math.round(rand(97, 1)),
    temp: rand(36.7, 0.25),
    bp: {
      sys: Number.isFinite(analysis.sys) ? Number(analysis.sys) : Math.round(rand(125, 10)),
      dia: Number.isFinite(analysis.dia) ? Number(analysis.dia) : Math.round(rand(78, 6)),
    },
  };

  const usingRealAnalysis =
    Number.isFinite(analysis.hr) ||
    Number.isFinite(analysis.rr) ||
    Number.isFinite(analysis.spo2) ||
    Number.isFinite(analysis.sys) ||
    Number.isFinite(analysis.dia);

  if (!usingRealAnalysis) {
    const roll = Math.random();
    if (roll < 0.04) {
      data.spo2 = Math.round(rand(88, 1.5));
    } else if (roll < 0.07) {
      data.bp.sys = Math.round(rand(168, 6));
      data.bp.dia = Math.round(rand(102, 5));
    } else if (roll < 0.1) {
      data.hr = Math.round(rand(126, 4));
    } else if (roll < 0.13) {
      data.temp = rand(38.8, 0.2);
    }
  }

  state.metrics = data;
  evaluateMetrics(data);
  return data;
}
