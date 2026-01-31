export type MetricsPayload = {
  ts: string;
  hr: number;
  rr: number;
  spo2: number;
  temp: number;
  bp: { sys: number; dia: number };
};

export type SafetyState = "normal" | "limited" | "locked";

export type StreamMessage =
  | { type: "metrics"; data: MetricsPayload; safety?: { state: SafetyState } }
  | { type: string; [k: string]: any };

export function connectStream(
  onMetrics: (m: MetricsPayload, safety?: SafetyState) => void,
  onStatus?: (state: "open" | "closed" | "error") => void
) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws/stream`;

  let ws: WebSocket | null = null;
  let retryTimer: number | null = null;

  const connect = () => {
    onStatus?.("closed"); // initial

    ws = new WebSocket(url);

    ws.onopen = () => onStatus?.("open");

    ws.onmessage = (evt) => {
      try {
        const msg: StreamMessage = JSON.parse(evt.data);
        if (msg.type === "metrics" && msg.data) {
          onMetrics(msg.data, msg.safety?.state);
        }
      } catch {
        // ignore invalid messages
      }
    };

    ws.onerror = () => onStatus?.("error");

    ws.onclose = () => {
      onStatus?.("closed");
      // auto reconnect
      if (retryTimer) window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(connect, 1000);
    };
  };

  connect();

  // return cleanup function
  return () => {
    if (retryTimer) window.clearTimeout(retryTimer);
    ws?.close();
    ws = null;
  };
}
