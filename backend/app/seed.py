from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from . import models
from .services.auth import hash_password

SITE_DATA = [
    ("Abu Dhabi HPC Site", "Abu Dhabi", "Healthy", 99.98, 1840, 62, 1280, 12),
    ("Dubai Mining Site", "Dubai", "Warning", 99.72, 2210, 76, 1540, 18),
    ("Al Ain Backup Facility", "Al Ain", "Healthy", 99.94, 820, 51, 620, 8),
    ("Legacy Site", "Jebel Ali", "Critical", 97.61, 690, 83, 390, 2),
]


def seed_database(db: Session, force=False):
    if db.query(models.Site).count() and not force:
        return {"seeded": False, "message": "Database already contains seed data"}
    if force:
        for model in [models.Notification, models.AuditLog, models.Asset, models.Vendor, models.PipelineRun,
                      models.Incident, models.Alert, models.Telemetry, models.Rig, models.Site, models.User]:
            db.query(model).delete()
        db.commit()

    now = datetime.utcnow()
    sites = []
    for name, location, status, uptime, power, temp, hashrate, latency in SITE_DATA:
        site = models.Site(name=name, location=location, status=status, uptime=uptime, power_kw=power,
                           temperature=temp, hashrate=hashrate, latency_ms=latency, last_heartbeat=now)
        db.add(site)
        sites.append(site)
    db.flush()

    for site_index, site in enumerate(sites):
        failed = 0
        for i in range(10):
            offline = (site_index == 3 and i < 3) or (site_index == 1 and i == 0)
            failed += int(offline)
            db.add(models.Rig(
                rig_id=f"{['ADH','DXB','AAN','LEG'][site_index]}-RIG-{i+1:03}", site_id=site.id,
                status="Offline" if offline else "Online", temperature=0 if offline else round(random.uniform(54, 79), 1),
                hashrate=0 if offline else round(random.uniform(88, 122), 1),
                power_draw=0 if offline else round(random.uniform(2.8, 3.7), 2),
                fan_speed=0 if offline else random.randint(3900, 6100),
                error_rate=round(random.uniform(.1, 2.4), 2),
                accepted_shares=random.randint(12000, 98000), rejected_shares=random.randint(5, 240),
                last_seen=now - timedelta(minutes=25 if offline else random.randint(0, 2)),
            ))
        site.active_rigs = 10 - failed
        site.failed_rigs = failed

    for i in range(50):
        site = sites[i % 4]
        db.add(models.Telemetry(
            site_id=site.id, cpu=round(random.uniform(28, 87), 1), ram=round(random.uniform(40, 89), 1),
            disk=round(random.uniform(52, 84), 1), temperature=round(site.temperature + random.uniform(-5, 4), 1),
            hashrate=round(site.hashrate * random.uniform(.86, 1.04), 1),
            power_kw=round(site.power_kw * random.uniform(.92, 1.06), 1),
            latency_ms=round(site.latency_ms * random.uniform(.8, 1.8), 1),
            recorded_at=now - timedelta(minutes=(49 - i) * 10),
        ))

    alert_specs = [
        (3, "Cooling threshold exceeded at Legacy Site", "Critical", "Environmental"),
        (3, "Three mining rigs are offline", "Critical", "Rig Controller"),
        (2, "Hashrate dropped by 21%", "Warning", "Telemetry"),
        (2, "Network latency degradation", "Warning", "Network"),
        (1, "Firmware update available", "Info", "Asset"),
        (4, "Site heartbeat intermittent", "Critical", "Heartbeat"),
        (4, "UPS battery health below target", "Warning", "Power"),
        (1, "Data pipeline completed", "Info", "Pipeline"),
        (2, "Power draw approaching capacity", "Warning", "Power"),
        (None, "Host disk utilization trend detected", "Info", "System"),
    ]
    for site_idx, title, severity, source in alert_specs:
        db.add(models.Alert(site_id=sites[site_idx - 1].id if site_idx else None, title=title,
                            severity=severity, source=source, created_at=now - timedelta(minutes=random.randint(3, 240))))

    incident_specs = [
        ("Legacy Site thermal excursion", 4, "Critical", "Cooling loop efficiency degraded", "Facilities"),
        ("Dubai pool connectivity degradation", 2, "Warning", "Upstream route instability", "Network"),
        ("Legacy rig cluster offline", 4, "Critical", "PDU branch circuit tripped", "Mining Operations"),
        ("Telemetry freshness SLA breach", 1, "Warning", "Collector queue backlog", "Data Platform"),
        ("Al Ain planned maintenance", 3, "Info", "Scheduled UPS inspection", "Facilities"),
    ]
    for i, (title, site_idx, severity, root, team) in enumerate(incident_specs):
        resolved = i >= 3
        created = now - timedelta(hours=(i + 1) * 4)
        db.add(models.Incident(title=title, site_id=sites[site_idx - 1].id, severity=severity,
                               status="Resolved" if resolved else ("Investigating" if i == 1 else "Open"),
                               root_cause=root, recommended_action="Execute the relevant site runbook and validate recovery telemetry",
                               assigned_team=team, created_at=created,
                               resolved_at=created + timedelta(minutes=47 + i * 10) if resolved else None))

    for i in range(5):
        rejected = 0 if i < 4 else 3
        db.add(models.PipelineRun(status="Succeeded" if rejected == 0 else "Completed with warnings",
                                  records_in=1000 + i * 137, records_out=1000 + i * 137 - rejected,
                                  rejected=rejected, duration_ms=920 + i * 113,
                                  logs="ingest → schema validation → quality checks → aggregates",
                                  started_at=now - timedelta(hours=i * 6)))

    vendors = [
        ("Bitmain Gulf", "ASIC hardware", 4, 2, 38, "support@bitmain.example"),
        ("Emirates Cooling Systems", "Cooling", 2, 1, 19, "noc@cooling.example"),
        ("Orbit Networks", "Connectivity", 1, 1, 12, "escalation@orbit.example"),
        ("PowerSafe UAE", "UPS and power", 4, 0, 44, "service@powersafe.example"),
        ("Nexa Compute", "GPU systems", 8, 0, 71, "support@nexa.example"),
    ]
    for name, category, sla, tickets, response, contact in vendors:
        db.add(models.Vendor(name=name, service_category=category, sla_hours=sla, open_tickets=tickets,
                             last_response_minutes=response, contact=contact, status="Active"))

    types = ["Server", "ASIC Miner", "GPU Rig", "Router", "UPS", "Cooling Unit"]
    vendor_names = [v[0] for v in vendors]
    for i in range(20):
        db.add(models.Asset(asset_id=f"AST-{1001+i}", site_id=sites[i % 4].id, type=types[i % len(types)],
                            vendor=vendor_names[i % 5], serial_number=f"UAE-{2024+i:04}-X{i:03}",
                            warranty_status="Active" if i % 5 else "Expiring",
                            firmware_version=f"{2 + i % 3}.{i % 10}.{i % 4}",
                            last_maintenance=now - timedelta(days=15 + i * 7),
                            risk_status="High" if i in (4, 13) else "Medium" if i % 4 == 0 else "Low"))

    for i in range(10):
        db.add(models.AuditLog(actor=["admin@example.com", "engineer@example.com"][i % 2],
                               action=["LOGIN", "VIEW_INCIDENT", "EXPORT_REPORT", "UPDATE_ASSET"][i % 4],
                               resource=f"resource/{100+i}", ip_address=f"10.20.1.{20+i}",
                               created_at=now - timedelta(minutes=i * 33)))
    for i in range(8):
        db.add(models.Notification(recipient=["noc@example.com", "#ops-alerts", "+971-XX-XXX-0000"][i % 3],
                                   channel=["Email", "Teams webhook", "SMS placeholder"][i % 3],
                                   alert=alert_specs[i][1], status="Delivered" if i != 5 else "Retrying",
                                   sent_at=now - timedelta(minutes=i * 24)))
    for email, password, role in [
        ("admin@example.com", "admin123", "Admin"),
        ("engineer@example.com", "engineer123", "Tech Specialist"),
        ("viewer@example.com", "viewer123", "Viewer"),
    ]:
        db.add(models.User(email=email, password_hash=hash_password(password), role=role))
    db.commit()
    return {"seeded": True, "sites": 4, "rigs": 40, "assets": 20}
