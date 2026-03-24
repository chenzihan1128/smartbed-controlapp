#!/usr/bin/env python3
import asyncio
import json
import os
import sys
from bleak import BleakClient

MAC = os.environ.get("BLE_DEVICE_MAC", "CA:55:15:38:F5:F7")
UUID_NOTIFY = os.environ.get("BLE_NOTIFY_UUID", "a6ed0202-d344-460a-8075-b9e8ec90d71b")
UUID_WRITE = os.environ.get("BLE_WRITE_UUID", "a6ed0203-d344-460a-8075-b9e8ec90d71b")
MODE = int(os.environ.get("BLE_MODE", "1"))

CMD_START = bytes([0x14, 0x01, (0x14 + 0x01) & 0xFF, 0x0D])
CMD_STOP = bytes([0x14, 0x00, (0x14 + 0x00) & 0xFF, 0x0D])


def cmd_mode(m: int) -> bytes:
    return bytes([0x15, m & 0xFF, (0x15 + (m & 0xFF)) & 0xFF, 0x0D])


buf = bytearray()
packet_count = 0
stream_enabled = False


def emit(payload):
    print(json.dumps(payload, ensure_ascii=True), flush=True)


def checksum_ok(frame: bytes) -> bool:
    if len(frame) < 3 or frame[-1] != 0x0A:
        return False
    return (sum(frame[:-2]) & 0xFF) == frame[-2]


def parse_ecg_ppg_payload(payload: bytes):
    parts = payload.split(b"\x0D")
    if len(parts) < 2:
        return None

    try:
        ecg = parts[0].decode("ascii", errors="ignore").strip()
        ppg = parts[1].decode("ascii", errors="ignore").strip()
        return {
            "type": "wave",
            "ecg": ecg,
            "ppg": ppg,
        }
    except Exception:
        return None


def parse_ascii_result_payload(payload: bytes):
    try:
        text = payload.decode("ascii", errors="ignore").strip()
    except Exception:
        return None

    if "=" not in text:
        return None

    key, value = text.split("=", 1)
    key = key.strip().upper()
    value = value.strip()
    if not key or not value:
        return None

    try:
        parsed_value = float(value) if "." in value else int(value)
    except ValueError:
        parsed_value = value

    return {
        "type": "analysis",
        "key": key,
        "value": parsed_value,
        "raw": text,
    }


def handle_frame(frame: bytes):
    global packet_count
    head = frame[0]
    payload = frame[1:-2]

    if head == 0x23:
        packet_count += 1
        parsed = parse_ecg_ppg_payload(payload)
        if parsed:
            parsed["count"] = packet_count
            emit(parsed)
        return

    if head == 0x10:
        emit({"type": "log", "message": "device_ack_10"})
        return

    if head == 0x26:
        parsed = parse_ascii_result_payload(payload)
        if parsed:
            emit(parsed)
        else:
            emit({"type": "log", "message": "device_ack_26"})
        return


def handle_notify(_: int, data: bytearray):
    global buf
    buf.extend(data)
    while True:
        try:
            idx = buf.index(0x0A)
        except ValueError:
            break

        frame = bytes(buf[:idx + 1])
        del buf[:idx + 1]

        if checksum_ok(frame):
            handle_frame(frame)


async def run_once():
    global stream_enabled
    client = BleakClient(MAC)
    emit({"type": "status", "state": "connecting", "mac": MAC})

    try:
        await client.connect()
        emit({"type": "status", "state": "connected", "mac": MAC})
        await client.start_notify(UUID_NOTIFY, handle_notify)
        emit({"type": "status", "state": "notify_started"})

        await client.write_gatt_char(UUID_WRITE, CMD_STOP, response=True)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(UUID_WRITE, cmd_mode(MODE), response=True)
        emit({"type": "status", "state": "mode_set", "mode": MODE})
        await asyncio.sleep(2.0)
        await client.write_gatt_char(UUID_WRITE, CMD_START, response=True)
        stream_enabled = True
        emit({"type": "status", "state": "streaming"})

        async def command_loop():
            global stream_enabled
            while client.is_connected:
                line = await asyncio.to_thread(sys.stdin.readline)
                if not line:
                    await asyncio.sleep(0.2)
                    continue

                cmd = line.strip().lower()
                if cmd == "stop":
                    await client.write_gatt_char(UUID_WRITE, CMD_STOP, response=True)
                    stream_enabled = False
                    emit({"type": "status", "state": "idle"})
                elif cmd == "start":
                    await client.write_gatt_char(UUID_WRITE, cmd_mode(MODE), response=True)
                    await asyncio.sleep(1.0)
                    await client.write_gatt_char(UUID_WRITE, CMD_START, response=True)
                    stream_enabled = True
                    emit({"type": "status", "state": "streaming"})
                elif cmd == "exit":
                    break

        command_task = asyncio.create_task(command_loop())

        while client.is_connected and not command_task.done():
            await asyncio.sleep(1.0)

        command_task.cancel()

    finally:
        try:
            if client.is_connected:
                await client.write_gatt_char(UUID_WRITE, CMD_STOP, response=True)
                stream_enabled = False
                await client.stop_notify(UUID_NOTIFY)
                await client.disconnect()
        except Exception:
            pass

        emit({"type": "status", "state": "disconnected"})


async def main():
    while True:
        try:
            await run_once()
        except Exception as e:
            emit({"type": "error", "message": str(e)})

        await asyncio.sleep(3.0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        emit({"type": "status", "state": "stopped"})
