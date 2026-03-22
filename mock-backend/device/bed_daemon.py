#!/usr/bin/env python3
import sys
from gpiozero import OutputDevice

# 继电器低电平触发
RELAY_UP = OutputDevice(17, active_high=False, initial_value=True)
RELAY_DOWN = OutputDevice(27, active_high=False, initial_value=True)

def all_release():
    RELAY_UP.on()
    RELAY_DOWN.on()

def start_up():
    all_release()
    RELAY_UP.off()
    print("OK start-up", flush=True)

def start_down():
    all_release()
    RELAY_DOWN.off()
    print("OK start-down", flush=True)

def stop_bed():
    all_release()
    print("OK stop", flush=True)

def main():
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

    all_release()

if __name__ == "__main__":
    try:
        main()
    finally:
        all_release()