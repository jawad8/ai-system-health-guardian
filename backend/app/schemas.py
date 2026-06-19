from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class IncidentCreate(BaseModel):
    title: str
    site_id: int | None = None
    severity: str = "Warning"
    root_cause: str = "Under investigation"
    recommended_action: str = "Review site telemetry"
    assigned_team: str = "NOC"


class CopilotRequest(BaseModel):
    question: str
