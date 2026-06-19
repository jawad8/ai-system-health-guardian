from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Site(Base):
    __tablename__ = "sites"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    location: Mapped[str]
    status: Mapped[str] = mapped_column(default="Healthy")
    uptime: Mapped[float] = mapped_column(default=99.9)
    power_kw: Mapped[float] = mapped_column(default=0)
    temperature: Mapped[float] = mapped_column(default=35)
    hashrate: Mapped[float] = mapped_column(default=0)
    active_rigs: Mapped[int] = mapped_column(default=0)
    failed_rigs: Mapped[int] = mapped_column(default=0)
    latency_ms: Mapped[float] = mapped_column(default=20)
    last_heartbeat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Rig(Base):
    __tablename__ = "rigs"
    id: Mapped[int] = mapped_column(primary_key=True)
    rig_id: Mapped[str] = mapped_column(unique=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"))
    status: Mapped[str] = mapped_column(default="Online")
    temperature: Mapped[float]
    hashrate: Mapped[float]
    power_draw: Mapped[float]
    fan_speed: Mapped[int]
    error_rate: Mapped[float] = mapped_column(default=0)
    accepted_shares: Mapped[int] = mapped_column(default=0)
    rejected_shares: Mapped[int] = mapped_column(default=0)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Telemetry(Base):
    __tablename__ = "telemetry"
    id: Mapped[int] = mapped_column(primary_key=True)
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    cpu: Mapped[float] = mapped_column(default=0)
    ram: Mapped[float] = mapped_column(default=0)
    disk: Mapped[float] = mapped_column(default=0)
    temperature: Mapped[float] = mapped_column(default=0)
    hashrate: Mapped[float] = mapped_column(default=0)
    power_kw: Mapped[float] = mapped_column(default=0)
    latency_ms: Mapped[float] = mapped_column(default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    title: Mapped[str]
    severity: Mapped[str]
    status: Mapped[str] = mapped_column(default="Active")
    source: Mapped[str] = mapped_column(default="Telemetry")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    severity: Mapped[str]
    status: Mapped[str] = mapped_column(default="Open")
    root_cause: Mapped[str] = mapped_column(default="Under investigation")
    recommended_action: Mapped[str] = mapped_column(default="Review telemetry and run the site playbook")
    assigned_team: Mapped[str] = mapped_column(default="NOC")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(default="Succeeded")
    records_in: Mapped[int] = mapped_column(default=0)
    records_out: Mapped[int] = mapped_column(default=0)
    rejected: Mapped[int] = mapped_column(default=0)
    duration_ms: Mapped[int] = mapped_column(default=0)
    logs: Mapped[str] = mapped_column(Text, default="")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"
    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[str] = mapped_column(unique=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"))
    type: Mapped[str]
    vendor: Mapped[str]
    serial_number: Mapped[str]
    warranty_status: Mapped[str]
    firmware_version: Mapped[str]
    last_maintenance: Mapped[datetime]
    risk_status: Mapped[str]


class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    service_category: Mapped[str]
    sla_hours: Mapped[int]
    open_tickets: Mapped[int] = mapped_column(default=0)
    last_response_minutes: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(default="Active")
    contact: Mapped[str]


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    recipient: Mapped[str]
    channel: Mapped[str]
    alert: Mapped[str]
    status: Mapped[str] = mapped_column(default="Delivered")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor: Mapped[str]
    action: Mapped[str]
    resource: Mapped[str]
    ip_address: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    role: Mapped[str]
    active: Mapped[bool] = mapped_column(Boolean, default=True)
