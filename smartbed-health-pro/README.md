<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartBed Health Pro (Frontend)

A real-time **health monitoring + adjustable bed control** UI designed for **elderly care**.

This repository currently contains the **frontend (Vite + React + TypeScript)**.
The backend (BLE sensor connection, GPIO bed control, alert engine, email notifications) will be built separately and runs on a **Raspberry Pi gateway**.

---

## Features (UI)
- **Dashboard**: Live HR / RR / SpO2 / Temp / BP + bed control buttons (Head Up / Head Down / Flat / Memory)
- **Alerts**: Active alerts + abnormal history (only abnormal events are stored)
- **Settings**:
  - Profile
  - Devices (BLE management via backend)
  - Alert rules editor (thresholds)
  - Emergency email (send alert notifications)

---

## Architecture (Recommended)
**Raspberry Pi = single source of truth**
- Raspberry Pi connects to the BLE sensor and controls the bed hardware via GPIO.
- Frontend communicates with the Pi over **REST API** + **WebSocket**.
- Avoids BLE conflicts when multiple devices try to connect to the same sensor.

---

## Prerequisites
- Node.js (recommended LTS)

---

## Run Frontend Locally (Development)
1. Install dependencies:
   ```bash
   npm install

