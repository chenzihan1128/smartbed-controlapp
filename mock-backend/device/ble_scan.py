#!/usr/bin/env python3
import asyncio
import json
from bleak import BleakScanner


async def main():
    devices = await BleakScanner.discover(timeout=6.0)
    results = []

    for item in devices:
        results.append(
            {
                "address": item.address,
                "name": item.name or "Unknown Device",
                "rssi": getattr(item, "rssi", None),
            }
        )

    print(json.dumps({"ok": True, "devices": results}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
