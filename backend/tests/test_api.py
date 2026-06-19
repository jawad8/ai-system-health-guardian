from fastapi.testclient import TestClient

from app.main import app


def test_api_smoke():
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
        assert client.get("/api/sites").status_code == 200
        assert client.get("/api/overview").json()["total_sites"] == 4
