"""Role taxonomy for Illuminate Studios (Task 2, handoff brief §6).

The platform recognises four roles:

| Role     | Created by                | Capabilities                                              |
|----------|---------------------------|-----------------------------------------------------------|
| ``owner``| System bootstrap (setup)  | Everything — settings, billing, staff invites, all data   |
| ``admin``| Owner invite only         | Everything except settings/billing/inviting staff         |
| ``editor``| Owner invite only        | Galleries and bookings only                               |
| ``client``| System on token claim    | Gallery view, image selections, authorized downloads      |

Backward compatibility
-----------------------
The pre-Task-2 schema used the role string ``"user"`` for client accounts. That
value is treated everywhere as an alias of :data:`CLIENT` so existing accounts,
sessions, and tests keep working unchanged. New client accounts are created with
the canonical :data:`CLIENT` value.

This module is intentionally dependency-free (no imports from ``auth``/``db``) so
it can be imported anywhere without creating an import cycle. The FastAPI role
dependencies (``require_roles`` etc.) live in ``auth.py`` next to
``get_current_user``.
"""
from __future__ import annotations

OWNER = "owner"
ADMIN = "admin"
EDITOR = "editor"
CLIENT = "client"

#: Legacy client role string used before the four-role model was introduced.
LEGACY_CLIENT = "user"

#: Internal staff — anyone who works for the studio.
STAFF_ROLES: frozenset[str] = frozenset({OWNER, ADMIN, EDITOR})

#: Full administrative capability (everything except owner-only settings/billing/invites).
ADMIN_CAPABLE_ROLES: frozenset[str] = frozenset({OWNER, ADMIN})

#: Owner-only capability (settings, billing, staff invites, role changes).
OWNER_ROLES: frozenset[str] = frozenset({OWNER})

#: Client tier, including the legacy ``"user"`` alias.
CLIENT_ROLES: frozenset[str] = frozenset({CLIENT, LEGACY_CLIENT})

#: Roles a client account may be auto-provisioned / self-served into.
ALL_ROLES: frozenset[str] = frozenset({OWNER, ADMIN, EDITOR, CLIENT, LEGACY_CLIENT})

#: Roles an owner is permitted to assign when inviting staff.
INVITABLE_STAFF_ROLES: frozenset[str] = frozenset({ADMIN, EDITOR})


def normalize_role(role: str | None) -> str:
    """Map a stored role string to its canonical form.

    The only normalisation today is the legacy ``"user"`` → :data:`CLIENT` alias.
    Unknown values are returned unchanged (callers decide how to treat them).
    """
    if role == LEGACY_CLIENT:
        return CLIENT
    return role or ""


def is_staff(role: str | None) -> bool:
    return role in STAFF_ROLES


def is_admin_capable(role: str | None) -> bool:
    return role in ADMIN_CAPABLE_ROLES


def is_owner(role: str | None) -> bool:
    return role in OWNER_ROLES


def is_client(role: str | None) -> bool:
    return role in CLIENT_ROLES
