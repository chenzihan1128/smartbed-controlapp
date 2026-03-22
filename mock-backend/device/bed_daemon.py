#!/usr/bin/env python3
import sys
import signal
from gpiozero import OutputDevice

# 继电器高电平触发
RELAY_UP = OutputDevice(17, active_high=True, initial_value=False)
RELAY_DOWN = OutputDevice(27, active_high=True, initial_value=False)

def all_release():
    # 高电平触发时，off() 才是释放
    RELAY_UP.off()
    RELAY_DOWN.off()

def start_up():
    all_release()
    RELAY_UP.on()
    print("OK start-up", flush=True)

def start_down():
    all_release()
    RELAY_DOWN.on()
    print("OK start-down", flush=True)

def stop_bed():
    all_release()
    print("OK stop", flush=True)

def cleanup():
    try:
        all_release()
    except Exception:
        pass

    try:
        RELAY_UP.close()
    except Exception:
        pass

    try:
        RELAY_DOWN.close()
    except Exception:
        pass

def handle_exit(signum, frame):
    stop_bed()
    print("OK exit", flush=True)
    cleanup()
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

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