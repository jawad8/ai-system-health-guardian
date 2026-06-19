def calculate_health_score(
    cpu: float = 0,
    ram: float = 0,
    disk: float = 0,
    temperature: float = 35,
    failed_rigs: int = 0,
    latency_ms: float = 20,
    active_incidents: int = 0,
    data_quality: float = 100,
):
    penalties = {
        "CPU pressure": max(0, cpu - 65) * 0.18,
        "memory pressure": max(0, ram - 70) * 0.18,
        "disk capacity": max(0, disk - 75) * 0.25,
        "temperature": max(0, temperature - 65) * 0.45,
        "failed rigs": failed_rigs * 2.5,
        "network latency": max(0, latency_ms - 100) * 0.025,
        "active incidents": active_incidents * 2.2,
        "data quality": max(0, 95 - data_quality) * 0.3,
    }
    score = max(0, round(100 - sum(penalties.values()), 1))
    status = "Healthy" if score >= 85 else "Warning" if score >= 65 else "Critical"
    drivers = [name for name, value in sorted(penalties.items(), key=lambda x: x[1], reverse=True) if value > 0][:3]
    explanation = f"Health is {status.lower()}" + (f"; primary pressure: {', '.join(drivers)}." if drivers else ".")
    action = "Continue monitoring." if status == "Healthy" else "Inspect " + (drivers[0] if drivers else "active alerts") + " and follow the incident runbook."
    return {"score": score, "status": status, "explanation": explanation, "recommended_action": action}


def threshold_alerts(cpu=0, ram=0, disk=0, temperature=0, latency_ms=0):
    alerts = []
    checks = [
        (cpu > 85, "CPU above 85%", "Critical"),
        (ram > 90, "RAM above 90%", "Critical"),
        (disk > 90, "Disk above 90%", "Critical"),
        (temperature > 80, "Temperature above 80°C", "Critical"),
        (latency_ms > 200, "Network latency above 200ms", "Warning"),
    ]
    return [{"title": title, "severity": severity} for condition, title, severity in checks if condition]


def calculate_data_quality(completeness=100, freshness=100, validity=100, duplicate_rate=0, error_rate=0):
    score = completeness * .3 + freshness * .25 + validity * .25 + (100 - duplicate_rate) * .1 + (100 - error_rate) * .1
    return round(max(0, min(100, score)), 1)
