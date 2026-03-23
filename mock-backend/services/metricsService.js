import state from "./state.js";
import { evaluateMetrics } from "./alarmService.js";

function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}

export function metrics() {
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

  const roll = Math.random();
  if (roll < 0.08) {
    data.spo2 = Math.round(rand(88, 1.5));
  } else if (roll < 0.14) {
    data.bp.sys = Math.round(rand(168, 6));
    data.bp.dia = Math.round(rand(102, 5));
  } else if (roll < 0.2) {
    data.hr = Math.round(rand(126, 4));
  } else if (roll < 0.26) {
    data.temp = rand(38.8, 0.2);
  }

  state.metrics = data;
  evaluateMetrics(data);
  return data;
}
