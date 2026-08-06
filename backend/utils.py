"""Shared API response and input-validation helpers."""

from __future__ import annotations

from flask import jsonify, request


def json_body() -> dict[str, object]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    return payload


def bounded_limit(value: object, default: int = 20, maximum: int = 50) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        raise ValueError("limit must be an integer.")
    try:
        limit = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("limit must be an integer.") from exc
    if not 1 <= limit <= maximum:
        raise ValueError(f"limit must be between 1 and {maximum}.")
    return limit


def success(payload: dict[str, object], status: int = 200):
    return jsonify(payload), status
