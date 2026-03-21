#!/usr/bin/env python3
from gpiozero import OutputDevice
import sys

# 继电器低电平触发
RELAY_UP = OutputDevice(17, active_high=False, initial_value=True)
RELAY_DOWN = OutputDevice(27, active_high=False, initial_value=True)

def all_release():
    RELAY_UP.on()
    RELAY_DOWN.on()

def start_up():
    all_release()      # 防止两个方向同时吸合
    RELAY_UP.off()     # 吸合上升继电器
    print("BED: start up")

def start_down():
    all_release()
    RELAY_DOWN.off()   # 吸合下降继电器
    print("BED: start down")

def stop_bed():
    all_release()
    print("BED: stop")

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("Usage: python3 bed_control.py start-up | start-down | stop")
            sys.exit(1)

        action = sys.argv[1].lower()

        if action == "start-up":
            start_up()
        elif action == "start-down":
            start_down()
        elif action == "stop":
            stop_bed()
        else:
            print(f"Unknown action: {action}")
            sys.exit(1)

    except Exception as e:
        all_release()
        print(f"ERROR: {e}")
        sys.exit(1)