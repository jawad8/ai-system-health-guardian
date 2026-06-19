# Recruiter Demo Script

## The problem

AI and mining facilities depend on compute hardware, power, cooling, networks, telemetry, data quality, security controls, and vendors. Fragmented monitoring slows diagnosis. Guardian consolidates those operational layers and recommends the next action.

## Five-minute flow

**0:00–1:00 — Overview.** Show real host metrics and the four UAE sites. Explain that the weighted health score combines infrastructure, site, incident, and data-quality signals.

**1:00–2:00 — Incident response.** Click **Trigger demo incident**. Open Alerts and Incidents, point out severity, owner, root cause, timestamp, and resolution workflow.

**2:00–3:00 — Site operations.** Open Legacy Site. Show historical thermals, latency, failed rigs, power, and hashrate. Explain the ten-second simulator and database history.

**3:00–4:00 — Data and security.** Run the ETL pipeline, show quality dimensions and rejected records, then show role/access, audit logs, and vulnerability tracking.

**4:00–5:00 — AI operations.** Ask “Which site is currently unhealthy?” and “What should I check first?” Explain Gemini is optional and the fallback remains grounded in current database data. Export an incident report.

## Technical decisions

FastAPI and SQLAlchemy give a typed, documented API and portable persistence. Next.js provides a responsive operational UI. Recharts makes telemetry legible. `psutil` proves real system integration. The fallback copilot avoids paid-service dependency. Docker Compose makes the project reproducible.

## Run

Use `docker compose up --build`, then open `http://localhost:3000`. API documentation is at `http://localhost:8000/docs`.
