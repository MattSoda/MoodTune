"""Firebase ID-token verification and request authentication helpers."""

from __future__ import annotations

from functools import wraps

from flask import current_app, g, request


def _error(message: str, status: int):
    return {"error": {"message": message, "status": status}}, status


def _token_from_request() -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header.removeprefix("Bearer ").strip() or None


def optional_user_id() -> str | None:
    token = _token_from_request()
    if token is None:
        return None
    try:
        decoded = current_app.extensions["token_verifier"](token)
    except Exception as exc:
        raise PermissionError("Invalid or expired Firebase ID token.") from exc
    g.auth_claims = decoded
    return str(decoded["uid"])


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        try:
            user_id = optional_user_id()
        except PermissionError as exc:
            return _error(str(exc), 401)
        if user_id is None:
            return _error("A Firebase Bearer token is required.", 401)
        g.user_id = user_id
        return view(*args, **kwargs)
    return wrapped
