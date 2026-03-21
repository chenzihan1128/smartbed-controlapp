import state from "./state.js";

function rand(base, range) {
  return Math.round((base + (Math.random() * 2 - 1) * range) * 10) / 10;
}

export function metrics() {
  state.lastUpdate = Date.now();

  return {
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
}