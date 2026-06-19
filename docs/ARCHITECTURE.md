# Architecture

Guardian uses a three-tier design: a Next.js operations console, a FastAPI domain/API layer, and a SQLAlchemy persistence layer. SQLite provides zero-setup local persistence; `DATABASE_URL` can target PostgreSQL without application changes.

The backend lifecycle creates the schema, seeds realistic operational data, and starts an APScheduler job. Every ten seconds the simulator varies site thermals, hashrate, power, and latency, stores a telemetry sample, evaluates thresholds, and updates site posture. Real host metrics are sampled through `psutil`.

The API groups concerns by operational domain: system, sites/rigs, alerts/incidents, data operations, governance, reports, and copilot. FastAPI's OpenAPI document is the canonical API reference at `/docs`.

The copilot builds a structured context from current database records. With `GEMINI_API_KEY`, it sends that bounded context to Gemini. Without a key, deterministic intent rules generate useful answers from the same data.

## Production evolution

Replace the in-process scheduler with a worker queue; store time-series data in TimescaleDB; add Redis caching; use OIDC and policy-backed RBAC; ingest OpenTelemetry/Prometheus; deliver notifications through managed adapters; and deploy stateless API/frontend containers behind a gateway.
