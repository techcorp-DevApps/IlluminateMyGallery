"""Security primitives for Task 2 auth foundation.

* ``tokens``     — opaque token generation + hashing (peppered SHA-256 and bcrypt).
* ``rate_limit`` — in-process IP / session rate limiting.

All persisted auth tokens are hashed at rest; raw values are returned to the
caller exactly once (in a URL, email, or cookie) and never stored.
"""
