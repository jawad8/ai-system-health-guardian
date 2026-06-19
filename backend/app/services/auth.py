from datetime import datetime, timedelta, timezone
import hashlib
import os

import jwt

SECRET = os.getenv("JWT_SECRET", "development-secret-change-me")


def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


def token_for(email: str, role: str):
    payload = {"sub": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, SECRET, algorithm="HS256")
