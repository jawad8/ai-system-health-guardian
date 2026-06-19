from app.services.health import calculate_data_quality, calculate_health_score, threshold_alerts


def test_health_score_degrades_under_pressure():
    healthy = calculate_health_score(cpu=30, ram=40, temperature=50)
    critical = calculate_health_score(cpu=96, ram=95, disk=94, temperature=88, failed_rigs=4, active_incidents=3)
    assert healthy["score"] > critical["score"]
    assert critical["status"] == "Critical"


def test_threshold_alerts():
    alerts = threshold_alerts(cpu=90, ram=92, temperature=83)
    titles = {a["title"] for a in alerts}
    assert "CPU above 85%" in titles
    assert "Temperature above 80°C" in titles


def test_data_quality_validation():
    assert calculate_data_quality() == 100
    assert calculate_data_quality(completeness=80, error_rate=20) < 100
