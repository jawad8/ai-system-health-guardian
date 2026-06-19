from datetime import datetime, timedelta
import os

import psutil


def current_metrics():
    boot = datetime.fromtimestamp(psutil.boot_time())
    net = psutil.net_io_counters()
    disk_path = os.path.abspath(os.sep)
    try:
        load = list(os.getloadavg())
    except (AttributeError, OSError):
        load = []
    return {
        "cpu": psutil.cpu_percent(interval=.15),
        "ram": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage(disk_path).percent,
        "network_sent_mb": round(net.bytes_sent / 1024 / 1024, 2),
        "network_received_mb": round(net.bytes_recv / 1024 / 1024, 2),
        "process_count": len(psutil.pids()),
        "uptime_seconds": int((datetime.now() - boot).total_seconds()),
        "boot_time": boot.isoformat(),
        "load_average": load,
        "timestamp": datetime.utcnow().isoformat(),
    }


def process_list(limit=20):
    rows = []
    for process in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
        try:
            rows.append(process.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return sorted(rows, key=lambda x: x.get("memory_percent") or 0, reverse=True)[:limit]
