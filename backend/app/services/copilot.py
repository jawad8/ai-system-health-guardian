import os
import requests


def fallback_answer(question: str, context: dict):
    q = question.lower()
    sites = context["sites"]
    incidents = context["incidents"]
    alerts = context["alerts"]
    unhealthy = [s for s in sites if s["status"] != "Healthy"]
    if "unhealthy" in q:
        return "Sites requiring attention: " + (", ".join(f'{s["name"]} ({s["status"]})' for s in unhealthy) or "none.")
    if "offline" in q and "rig" in q:
        return f'{context["offline_rigs"]} rigs are offline. Start with power, network reachability, and controller logs.'
    if "highest temperature" in q:
        site = max(sites, key=lambda s: s["temperature"])
        return f'{site["name"]} is hottest at {site["temperature"]:.1f}°C. Verify cooling airflow and inlet temperature.'
    if "latest incident" in q or "caused" in q:
        return f'Latest incident: {incidents[0]["title"]}. Root cause: {incidents[0]["root_cause"]}.' if incidents else "No incidents are recorded."
    if "critical" in q:
        critical = [a["title"] for a in alerts if a["severity"] == "Critical" and a["status"] == "Active"]
        return "Active critical alerts: " + (", ".join(critical) or "none.")
    if "vendor" in q or "contact" in q:
        return "Contact the NOC first, then the vendor attached to the affected asset. Current escalation contacts: " + ", ".join(context["vendors"])
    if "report" in q:
        return f'Incident report: {len(incidents)} incidents recorded, {len([i for i in incidents if i["status"] != "Resolved"])} active. {context["offline_rigs"]} rigs offline and {len(alerts)} alerts in the current view.'
    return f'Operational summary: health score {context["health"]["score"]}/100 ({context["health"]["status"]}); {len(unhealthy)} sites need attention, {context["offline_rigs"]} rigs are offline, and {len([a for a in alerts if a["status"] == "Active"])} alerts are active. Recommended first step: {context["health"]["recommended_action"]}'


def answer(question: str, context: dict):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"answer": fallback_answer(question, context), "engine": "rule-based"}
    prompt = f"You are an AI operations copilot. Answer professionally and concisely using only this platform context.\nContext: {context}\nQuestion: {question}"
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=15,
    )
    response.raise_for_status()
    return {"answer": response.json()["candidates"][0]["content"]["parts"][0]["text"], "engine": "gemini"}
