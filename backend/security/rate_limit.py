"""In-process sliding-window rate limiting.

Mitigates audit findings H2 (unauthenticated Luma writes / unbounded LLM spend)
and M2 (no throttling on auth endpoints). Keys are scoped strings — typically
``"{scope}:{client_ip}"`` — tracked as a sliding window of hit timestamps.

Scope note: this limiter is per-process. On a single Railway dyno that is the
whole service; if the backend is later scaled horizontally, move the counters to
Redis (the public surface — :func:`enforce` and :class:`RateLimit` — stays the
same). The brief lists Redis as an optional dependency for exactly this.

NB: this module deliberately does *not* use ``from __future__ import annotations``.
``RateLimit`` is consumed as a FastAPI class dependency (``Depends(RateLimit(...))``)
and FastAPI does not resolve stringized annotations on a callable instance's
``__call__`` — with the future import the ``request: Request`` parameter is
mis-read as a required query field and every rate-limited route returns 422.
Keeping live annotations here is required for the dependency to work.
"""
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request, status


class SlidingWindowLimiter:
    """Sliding-window counter. ``allow`` returns False once a key exceeds ``limit``
    hits within the trailing ``window`` seconds."""

    def __init__(self) -> None:
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int, window: float) -> bool:
        now = time.monotonic()
        cutoff = now - window
        bucket = self._hits[key]
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True

    def retry_after(self, key: str, window: float) -> int:
        """Seconds until the oldest in-window hit for ``key`` ages out (>=1)."""
        bucket = self._hits.get(key)
        if not bucket:
            return 1
        remaining = window - (time.monotonic() - bucket[0])
        return max(1, int(remaining) + 1)

    def reset(self) -> None:
        self._hits.clear()


_limiter = SlidingWindowLimiter()


def get_limiter() -> SlidingWindowLimiter:
    return _limiter


def client_identifier(request: Request) -> str:
    """Best-effort client IP. Honours the first ``X-Forwarded-For`` hop (Railway /
    Cloudflare sit in front of the app) and falls back to the socket peer."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "unknown"


def enforce_key(key: str, *, limit: int, window: float) -> None:
    """Raise 429 (with ``Retry-After``) if ``key`` has exceeded ``limit`` hits in
    the trailing ``window`` seconds.

    Unlike :func:`enforce`, the caller supplies the full key. Use this to throttle
    on a dimension other than client IP — e.g. a per-conversation cap keyed on a
    Luma ``session_id`` (the "session gate" guarding audit finding H2)."""
    if not _limiter.allow(key, limit, window):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly.",
            headers={"Retry-After": str(_limiter.retry_after(key, window))},
        )


def enforce(request: Request, *, scope: str, limit: int, window: float) -> None:
    """Raise 429 (with ``Retry-After``) if the client has exceeded ``limit`` hits
    in the trailing ``window`` seconds for ``scope``."""
    enforce_key(f"{scope}:{client_identifier(request)}", limit=limit, window=window)


class RateLimit:
    """FastAPI dependency enforcing a per-IP rate limit on a route.

    Usage::

        @router.post("/login", dependencies=[Depends(RateLimit("login", 10, 60))])
    """

    def __init__(self, scope: str, limit: int, window: float) -> None:
        self.scope = scope
        self.limit = limit
        self.window = window

    async def __call__(self, request: Request) -> None:
        enforce(request, scope=self.scope, limit=self.limit, window=self.window)
