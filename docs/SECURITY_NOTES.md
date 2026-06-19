# Security Notes

Guardian demonstrates JWT login, three seeded roles, audit events, vulnerability findings, failed-login counts, critical-asset visibility, and API-key inventory. Passwords are hashed for the demo database and secrets are environment-driven.

Before production: use an identity provider with MFA, Argon2id password hashing where local credentials remain, short-lived access tokens with rotation, route-level RBAC, rate limiting, strict CORS, TLS, encrypted storage, secret management, dependency and container scanning, signed images, immutable audit logs, and network segmentation.

Demo credentials are intentionally public and must never be reused. Change `JWT_SECRET` outside local development.
