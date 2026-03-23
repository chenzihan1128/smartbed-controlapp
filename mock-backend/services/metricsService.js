import state from "./state.js";
import { evaluateMetrics } from "./alarmService.js";

function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}

export function metrics() {
  state.lastUpdate = Date.now();

  const data = {
    ts: new Date().toISOString(),
    hr: Math.round(rand(78, 7)),
    rr: Math.round(rand(16, 2)),
    spo2: Math.round(rand(97, 1)),
    temp: rand(36.7, 0.25),
    bp: {
      sys: Math.round(rand(125, 10)),
      dia: Math.round(rand(78, 6)),
    },
  };

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

  state.metrics = data;
  evaluateMetrics(data);
  return data;
}
