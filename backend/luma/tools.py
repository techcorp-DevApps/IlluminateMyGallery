"""OpenAI chat-completions function-tool definitions for Luma."""
from luma.schemas import (
    CHECK_AVAILABILITY_PARAMS,
    CREATE_BOOKING_PARAMS,
    GET_ACTIVE_SERVICES_PARAMS,
    HANDOFF_TO_HUMAN_PARAMS,
)

LUMA_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_active_services",
            "description": (
                "Returns active Illuminate Studios service categories, packages, add-ons, and "
                "pricing. Call before quoting any package or price."
            ),
            "parameters": GET_ACTIVE_SERVICES_PARAMS,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": (
                "Checks photographer/session availability for the requested date, time, duration, "
                "service category, and location suburb."
            ),
            "parameters": CHECK_AVAILABILITY_PARAMS,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": (
                "Finalises the Illuminate Studios booking after the client has explicitly confirmed "
                "the reviewed summary. Provide all the collected booking fields as arguments."
            ),
            "parameters": CREATE_BOOKING_PARAMS,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "handoff_to_human",
            "description": "Flags the current conversation for photographer/admin follow-up.",
            "parameters": HANDOFF_TO_HUMAN_PARAMS,
        },
    },
]

LUMA_TOOL_NAMES = {"get_active_services", "check_availability", "create_booking", "handoff_to_human"}
