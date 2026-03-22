import nodemailer from "nodemailer";
import state from "./state.js";

function parsePort(value, fallback) {
  const port = Number(value);
  return Number.isFinite(port) ? port : fallback;
}

function getMailerConfig() {
  const host = process.env.SMTP_HOST || "";
  const port = parsePort(process.env.SMTP_PORT, 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || user || "smartbed@localhost";
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

  return { host, port, user, pass, from, secure };
}

function getTransporter() {
  const cfg = getMailerConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });
}

function buildRecipients(includeCaregivers = true) {
  const recipients = new Set();

  if (state.settings.emergencyEmail) {
    recipients.add(state.settings.emergencyEmail.trim());
  }

  if (includeCaregivers) {
    for (const caregiver of state.caregivers) {
      if (caregiver?.email) recipients.add(String(caregiver.email).trim());
    }
  }

  return [...recipients].filter(Boolean);
}

function buildAlertMessage(alert) {
  const title = `${alert.metric || "SmartBed Alert"} - ${alert.severity?.toUpperCase?.() || "ALERT"}`;
  const lines = [
    "SmartBed emergency alert",
    "",
    `Metric: ${alert.metric || "Unknown"}`,
    `Severity: ${alert.severity || "unknown"}`,
    `Message: ${alert.message || "No details provided"}`,
    `Time: ${alert.ts || new Date().toISOString()}`,
  ];

  return {
    subject: title,
    text: lines.join("\n"),
    html: `
      <h2>SmartBed emergency alert</h2>
      <p><strong>Metric:</strong> ${alert.metric || "Unknown"}</p>
      <p><strong>Severity:</strong> ${alert.severity || "unknown"}</p>
      <p><strong>Message:</strong> ${alert.message || "No details provided"}</p>
      <p><strong>Time:</strong> ${alert.ts || new Date().toISOString()}</p>
    `,
  };
}

export async function sendAlertEmail(alert, options = {}) {
  const recipients = buildRecipients(options.includeCaregivers !== false);
  if (!recipients.length) {
    return { ok: false, reason: "no_recipients", recipients: [] };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured. Email not sent.", { recipients });
    return { ok: false, reason: "smtp_not_configured", recipients };
  }

  const cfg = getMailerConfig();
  const content = buildAlertMessage(alert);

  const info = await transporter.sendMail({
    from: cfg.from,
    to: recipients.join(", "),
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return {
    ok: true,
    recipients,
    messageId: info.messageId,
  };
}

export async function sendTestEmail() {
  const recipients = buildRecipients(true);
  if (!recipients.length) {
    return { ok: false, reason: "no_recipients", recipients: [] };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured. Test email not sent.", { recipients });
    return { ok: false, reason: "smtp_not_configured", recipients };
  }

  const cfg = getMailerConfig();
  const info = await transporter.sendMail({
    from: cfg.from,
    to: recipients.join(", "),
    subject: "SmartBed test email",
    text: "This is a SmartBed caregiver notification test email.",
    html: "<p>This is a <strong>SmartBed</strong> caregiver notification test email.</p>",
  });

  return {
    ok: true,
    recipients,
    messageId: info.messageId,
  };
}
