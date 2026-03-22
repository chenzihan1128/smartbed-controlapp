#!/usr/bin/env python3
import os
import signal
import sys
import time
from pathlib import Path
from gpiozero import OutputDevice

PID_FILE = Path("/tmp/controlapp_bed_daemon.pid")
RELAY_UP = None
RELAY_DOWN = None

def all_release():
    if RELAY_UP is not None:
        RELAY_UP.on()
    if RELAY_DOWN is not None:
        RELAY_DOWN.on()

def start_up():
    all_release()
    RELAY_UP.off()   # 低电平触发 -> 吸合
    print("OK start-up", flush=True)

def start_down():
    all_release()
    RELAY_DOWN.off()  # 低电平触发 -> 吸合
    print("OK start-down", flush=True)

def stop_bed():
    all_release()
    print("OK stop", flush=True)

def cleanup():
    try:
        all_release()
    except Exception:
        pass

    global RELAY_UP, RELAY_DOWN

    if RELAY_UP is not None:
        try:
            RELAY_UP.close()
        except Exception:
            pass
        RELAY_UP = None

    if RELAY_DOWN is not None:
        try:
            RELAY_DOWN.close()
        except Exception:
            pass
        RELAY_DOWN = None

    try:
        if PID_FILE.exists() and PID_FILE.read_text().strip() == str(os.getpid()):
            PID_FILE.unlink()
    except Exception:
        pass

def ensure_single_instance():
    if not PID_FILE.exists():
        PID_FILE.write_text(str(os.getpid()))
        return

    try:
        existing_pid = int(PID_FILE.read_text().strip())
    except Exception:
        PID_FILE.unlink(missing_ok=True)
        PID_FILE.write_text(str(os.getpid()))
        return

    if existing_pid == os.getpid():
        PID_FILE.write_text(str(os.getpid()))
        return

    try:
        os.kill(existing_pid, 0)
    except ProcessLookupError:
        PID_FILE.unlink(missing_ok=True)
        PID_FILE.write_text(str(os.getpid()))
        return

    try:
        os.kill(existing_pid, signal.SIGTERM)
    except ProcessLookupError:
        pass

    for _ in range(20):
        try:
            os.kill(existing_pid, 0)
            time.sleep(0.1)
        except ProcessLookupError:
            PID_FILE.unlink(missing_ok=True)
            PID_FILE.write_text(str(os.getpid()))
            return

    raise RuntimeError(f"Existing bed daemon still running with PID {existing_pid}")

def init_gpio():
    global RELAY_UP, RELAY_DOWN

    RELAY_UP = OutputDevice(17, active_high=False, initial_value=True)
    RELAY_DOWN = OutputDevice(27, active_high=False, initial_value=True)

def handle_exit(signum, frame):
    try:
        stop_bed()
        print("OK exit", flush=True)
    finally:
        cleanup()
        sys.exit(0)

def main():
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    ensure_single_instance()
    init_gpio()

    print("BED_DAEMON_READY", flush=True)
    all_release()

    for raw in sys.stdin:
        cmd = raw.strip().lower()

        try:
            if cmd == "start-up":
                start_up()
            elif cmd == "start-down":
                start_down()
            elif cmd == "stop":
                stop_bed()
            elif cmd == "exit":
                stop_bed()
                print("OK exit", flush=True)
                break
            elif not cmd:
                continue
            else:
                print(f"ERR unknown command: {cmd}", flush=True)
        except Exception as e:
            all_release()
            print(f"ERR {e}", flush=True)

    cleanup()

if __name__ == "__main__":
    try:
        main()
    finally:
        cleanup()
