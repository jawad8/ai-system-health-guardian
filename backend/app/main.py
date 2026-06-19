from contextlib import asynccontextmanager
from datetime import datetime
import csv
import io
import os
import random

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, SessionLocal, engine, get_db
from .seed import seed_database
from .services.auth import hash_password, token_for
from .services.copilot import answer
from .services.health import calculate_data_quality, calculate_health_score, threshold_alerts
from .services.system_metrics import current_metrics, process_list


def row(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def simulate_telemetry():
    db = SessionLocal()
    try:
        sites = db.query(models.Site).all()
        for site in sites:
            spike = random.random() < .035
            site.temperature = round(max(30, site.temperature + random.uniform(-1.8, 1.8) + (10 if spike else 0)), 1)
            site.hashrate = round(max(0, site.hashrate * random.uniform(.975, 1.025)), 1)
            site.power_kw = round(site.power_kw * random.uniform(.985, 1.015), 1)
            site.latency_ms = round(max(3, site.latency_ms + random.uniform(-3, 3)), 1)
            site.last_heartbeat = datetime.utcnow()
            site.status = "Critical" if site.temperature > 80 or site.failed_rigs >= 3 else "Warning" if site.temperature > 72 or site.failed_rigs else "Healthy"
            metric = current_metrics()
            db.add(models.Telemetry(site_id=site.id, cpu=metric["cpu"], ram=metric["ram"], disk=metric["disk"],
                                    temperature=site.temperature, hashrate=site.hashrate,
                                    power_kw=site.power_kw, latency_ms=site.latency_ms))
            existing = {a.title for a in db.query(models.Alert).filter(models.Alert.status == "Active").all()}
            for alert in threshold_alerts(metric["cpu"], metric["ram"], metric["disk"], site.temperature, site.latency_ms):
                if alert["title"] not in existing:
                    db.add(models.Alert(site_id=site.id, source="Simulator", **alert))
        db.commit()
    finally:
        db.close()


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_database(db)
    if not os.getenv("VERCEL") and not scheduler.running:
        scheduler.add_job(simulate_telemetry, "interval", seconds=10, id="telemetry", replace_existing=True)
        scheduler.start()
    yield
    if not os.getenv("VERCEL") and scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(title="AI System Health Guardian API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {"name": "AI System Health Guardian", "status": "operational", "docs": "/docs"}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "timestamp": datetime.utcnow()}


@app.post("/api/auth/login")
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": token_for(user.email, user.role), "token_type": "bearer",
            "user": {"email": user.email, "role": user.role}}


@app.get("/api/system/current")
def system_current():
    return current_metrics()


@app.get("/api/system/history")
def system_history(limit: int = 60, db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Telemetry).order_by(models.Telemetry.recorded_at.desc()).limit(min(limit, 500)).all()][::-1]


@app.get("/api/system/processes")
def system_processes(limit: int = 20):
    return process_list(min(limit, 100))


@app.get("/api/sites")
def sites(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Site).all()]


@app.get("/api/sites/{site_id}")
def site(site_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Site, site_id)
    if not item:
        raise HTTPException(404, "Site not found")
    return row(item)


@app.get("/api/sites/{site_id}/metrics")
def site_metrics(site_id: int, limit: int = 40, db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Telemetry).filter(models.Telemetry.site_id == site_id)
            .order_by(models.Telemetry.recorded_at.desc()).limit(limit).all()][::-1]


@app.get("/api/sites/{site_id}/rigs")
def site_rigs(site_id: int, db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Rig).filter(models.Rig.site_id == site_id).all()]


@app.get("/api/rigs")
def rigs(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Rig).all()]


@app.get("/api/alerts")
def alerts(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()]


@app.get("/api/incidents")
def incidents(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Incident).order_by(models.Incident.created_at.desc()).all()]


@app.post("/api/incidents")
def create_incident(payload: schemas.IncidentCreate, db: Session = Depends(get_db)):
    item = models.Incident(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return row(item)


@app.patch("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Incident, incident_id)
    if not item:
        raise HTTPException(404, "Incident not found")
    item.status, item.resolved_at = "Resolved", datetime.utcnow()
    db.commit()
    return row(item)


@app.post("/api/incidents/demo")
def demo_incident(db: Session = Depends(get_db)):
    site = db.query(models.Site).filter(models.Site.name == "Dubai Mining Site").first()
    site.temperature, site.status = 86.4, "Critical"
    item = models.Incident(title="Demo cooling anomaly", site_id=site.id, severity="Critical",
                           root_cause="Simulated cooling airflow restriction", assigned_team="Facilities",
                           recommended_action="Inspect CRAC airflow, reduce load, and validate thermal recovery")
    db.add(item)
    db.add(models.Alert(site_id=site.id, title="Demo: temperature above 80°C", severity="Critical", source="Demo"))
    db.add(models.Notification(recipient="#ops-alerts", channel="Teams webhook", alert=item.title))
    db.commit(); db.refresh(item)
    return row(item)


@app.post("/api/system/health-check")
def health_check():
    simulate_telemetry()
    return {"status": "completed", "metrics": current_metrics()}


@app.get("/api/overview")
def overview(db: Session = Depends(get_db)):
    metric = current_metrics()
    sites_data = db.query(models.Site).all()
    active_incidents = db.query(models.Incident).filter(models.Incident.status != "Resolved").count()
    critical_alerts = db.query(models.Alert).filter(models.Alert.severity == "Critical", models.Alert.status == "Active").count()
    failed = sum(s.failed_rigs for s in sites_data)
    quality = calculate_data_quality(99.2, 97.8, 99.6, .3, .5)
    health = calculate_health_score(metric["cpu"], metric["ram"], metric["disk"],
                                    max(s.temperature for s in sites_data), failed,
                                    max(s.latency_ms for s in sites_data), active_incidents, quality)
    return {
        "total_sites": len(sites_data), "platform_health": health, "current_uptime": round(sum(s.uptime for s in sites_data) / len(sites_data), 2),
        "active_incidents": active_incidents, "critical_alerts": critical_alerts,
        "total_hashrate": round(sum(s.hashrate for s in sites_data), 1),
        "total_power_kw": round(sum(s.power_kw for s in sites_data), 1),
        "average_temperature": round(sum(s.temperature for s in sites_data) / len(sites_data), 1),
        "data_quality_score": quality, "system": metric,
    }


@app.get("/api/data-pipelines")
def pipelines(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.PipelineRun).order_by(models.PipelineRun.started_at.desc()).all()]


@app.post("/api/data-pipelines/run")
def run_pipeline(db: Session = Depends(get_db)):
    item = models.PipelineRun(status="Succeeded", records_in=1248, records_out=1248, rejected=0,
                              duration_ms=random.randint(800, 1600),
                              logs="ingest → validate schema → completeness → freshness → deduplicate → aggregate")
    db.add(item); db.commit(); db.refresh(item)
    return row(item)


@app.get("/api/data-quality")
def data_quality():
    dimensions = {"completeness": 99.2, "freshness": 97.8, "validity": 99.6, "duplicate_rate": .3, "error_rate": .5}
    return {"score": calculate_data_quality(**dimensions), **dimensions,
            "failed_records": [{"record": "LEG-RIG-003", "rule": "timestamp freshness", "value": "25 minutes old"}]}


@app.get("/api/assets")
def assets(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Asset).all()]


@app.get("/api/vendors")
def vendors(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Vendor).all()]


@app.get("/api/notifications")
def notifications(db: Session = Depends(get_db)):
    return [row(x) for x in db.query(models.Notification).order_by(models.Notification.sent_at.desc()).all()]


@app.get("/api/security")
def security(db: Session = Depends(get_db)):
    return {
        "users": [{"email": u.email, "role": u.role, "active": u.active} for u in db.query(models.User).all()],
        "audit_logs": [row(x) for x in db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()],
        "vulnerabilities": [
            {"asset": "AST-1005", "severity": "High", "finding": "Firmware behind approved baseline", "status": "Open"},
            {"asset": "AST-1014", "severity": "Medium", "finding": "TLS certificate expires in 21 days", "status": "Assigned"},
        ],
        "failed_logins_24h": 7, "critical_assets": 6, "api_keys": 3,
    }


@app.post("/api/copilot/ask")
def copilot(payload: schemas.CopilotRequest, db: Session = Depends(get_db)):
    sites_rows = [row(x) for x in db.query(models.Site).all()]
    incident_rows = [row(x) for x in db.query(models.Incident).order_by(models.Incident.created_at.desc()).all()]
    alert_rows = [row(x) for x in db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()]
    overview_data = overview(db)
    context = {"sites": sites_rows, "incidents": incident_rows, "alerts": alert_rows,
               "offline_rigs": db.query(models.Rig).filter(models.Rig.status == "Offline").count(),
               "health": overview_data["platform_health"],
               "vendors": [f"{v.name} ({v.contact})" for v in db.query(models.Vendor).all()]}
    return answer(payload.question, context)


@app.get("/api/reports/{report_type}.csv")
def export_report(report_type: str, db: Session = Depends(get_db)):
    allowed = {"sites": models.Site, "incidents": models.Incident, "alerts": models.Alert,
               "assets": models.Asset, "pipelines": models.PipelineRun}
    if report_type not in allowed:
        raise HTTPException(404, "Report type not found")
    records = [row(x) for x in db.query(allowed[report_type]).all()]
    output = io.StringIO()
    if records:
        writer = csv.DictWriter(output, fieldnames=records[0].keys())
        writer.writeheader(); writer.writerows(records)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={report_type}-report.csv"})


@app.post("/api/seed")
def reseed(force: bool = False, db: Session = Depends(get_db)):
    return seed_database(db, force)
