"""Contract template pack — verbatim text from the uploaded Illuminate Studios docx files.

Each template is a markdown body with `[Placeholder]` fields. The seeder loads
these into `contract_templates` collection. When admin creates a document from
a template + booking, the `fill_placeholders` helper substitutes values.

Boilerplate Terms & Conditions are intentionally identical across all five
photography agreements (per the source documents). Only the title, service type,
package table, client obligations, and section 19 differ per template.
"""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

_CONTRACTS_DIR = Path(__file__).parent


def _shared_terms() -> str:
    return (_CONTRACTS_DIR / "_shared_terms.md").read_text(encoding="utf-8")


# Shared statement-of-work block (identical across the 5 agreements)
_SOW_BLOCK = """## Statement of Work

Complete this section for the specific client booking. Placeholder fields are intended to be completed before signature.

### Client information

- Client legal name(s): [Client name(s)]
- Address: [Client address]
- Email: [Client email]
- Phone: [Client phone]

### Session / event information

- Service type: {service_type}
- Date: [Session / event date]
- Location(s): [Location / venue / address]
- Start time: [Start time]
- End time: [End time]
- Primary contact on day: [Name and mobile]

### Package selection

{package_table}

### Fees and payment schedule

- Selected package fee: [AUD $]
- Approved add-ons / travel / expenses: [AUD $ or N/A]
- Total fee: [AUD $]
- Booking retainer: 10% of total fee unless otherwise agreed in writing — [AUD $]
- Balance / payment terms: {payment_terms}
- Payment method: PayID `accounts@illuminatestudios.com.au` (BSB/Account fallback on invoice)

### Deliverables

- Final images: [Number or package inclusion] edited high-resolution JPEG files
- Delivery method: Private online gallery / digital download unless otherwise agreed
- Delivery timeframe: Final edited gallery generally delivered within 14 calendar days after the session, subject to final payment and any agreed exclusions.
- Special requests: [Shot list / restrictions / notes / privacy instructions]

### Client obligations specific to this service

{client_obligations}

### Optional portfolio and marketing release

- ☐ Release granted — Client permits Illuminate Studios to use selected delivered images for portfolio, website, social media, advertising, competitions, publications, and studio promotion.
- ☐ Release not granted — No promotional release is granted. Illuminate Studios may retain images internally for business records, quality control, archiving, and legal purposes.
- ☐ Minor/child release granted by guardian — Guardian confirms authority to grant promotional use for the named minor(s): [names].
- ☐ Restricted release — Permitted use is limited to: [insert limits].

If no option is selected, the default position is that no promotional release is granted.
"""


def _signature_block() -> str:
    return """## Acceptance and Signatures

By signing below, the parties confirm they have read, understood, and agree to be bound by this Agreement, including the Statement of Work, selected package details, and Terms and Conditions.

Client signature: ____________________________________________
Client full name: [Client name(s)]
Date: ____________________________________________

Additional client signature: ____________________________________________
Additional client full name: ____________________________________________
Date: ____________________________________________

Illuminate Studios signature: ____________________________________________
Representative full name: ____________________________________________
Position: ____________________________________________
Business / ABN: Illuminate Studios
Date: ____________________________________________
Email / phone: ____________________________________________
"""


def _compose(title: str, service_type: str, package_table: str, client_obligations: str, section_19: str, payment_terms: str) -> str:
    sow = _SOW_BLOCK.format(
        service_type=service_type,
        package_table=package_table.strip(),
        client_obligations=client_obligations.strip(),
        payment_terms=payment_terms,
    )
    return (
        f"# PHOTOGRAPHY SERVICES AGREEMENT — ILLUMINATE STUDIOS\n\n"
        f"## {title}\n\n"
        f"**ILLUMINATE STUDIOS | Melbourne, Victoria | https://illuminatestudios.com.au**\n\n"
        f"Document purpose: This agreement template is designed for client completion and signature for the selected Illuminate Studios package. It should be reviewed and completed before delivery to a client.\n\n"
        f"{sow}\n\n"
        f"{_shared_terms()}\n\n"
        f"19. **Category-specific requirements**\n{section_19.strip()}\n\n"
        f"{_signature_block()}"
    )


# ---------------------------------------------------------------------------
# Per-template data
# ---------------------------------------------------------------------------

FAMILY_PORTRAIT = {
    "key": "family_portrait",
    "title": "Family Portrait Photography Agreement",
    "service_category": "Portrait",
    "service_type": "Family Portrait Session",
    "payment_terms": "Balance due three (3) calendar days before the session date.",
    "package_table": """| Select | Package | Price | Coverage | Included Deliverables |
|---|---|---|---|---|
| ☐ | Family Mini | $395 | 30 minute session | 15 edited digital images; Private online gallery |
| ☐ | Family Classic | $595 | 60 minute session | 40 edited digital images; Location and outfit guidance |
| ☐ | Family Story | $795 | 90 minute session | Full edited gallery; Extended family welcome |
| ☐ | Generational Family Session | $995 | Up to 2 hours | Grandparents/extended family; Full edited gallery |""",
    "client_obligations": """- Arrive at the agreed location on time and ready to be photographed.
- Ensure all participating family members are aware of the session time, location, and general style.
- Obtain any location permission or entry approval required for private venues, gardens, parks, clubs, or residences.""",
    "section_19": """    - Session time starts at the agreed start time. Late arrival by Client may reduce available shooting time without price reduction.
    - Basic editing includes colour correction, exposure adjustment, image selection, and standard style consistency. Extensive retouching, object removal, body reshaping, compositing, or restoration is not included unless agreed in writing.""",
}

ANNIVERSARY_COUPLES = {
    "key": "anniversary_couples",
    "title": "Anniversary and Couples Photography Agreement",
    "service_category": "Couples",
    "service_type": "Anniversary / Couples Session",
    "payment_terms": "Balance due three (3) calendar days before the session date.",
    "package_table": """| Select | Package | Price | Coverage | Included Deliverables |
|---|---|---|---|---|
| ☐ | Anniversary Mini | $375 | 30 minute session | 12 edited images; Private online gallery |
| ☐ | Anniversary Classic | $575 | 60 minute golden-hour session | 40 edited images; One location |
| ☐ | Anniversary Story | $750 | 90 minute session | Full edited gallery; Optional second nearby location |
| ☐ | Proposal / Surprise Session | $695 | Planning call; 60 minute post-proposal portraits | Discreet capture; 60 minute post-proposal portraits |""",
    "client_obligations": """- Arrive at the agreed location on time and ready to be photographed.
- Notify Illuminate Studios in advance of any planned surprise proposal, permit requirements, timing constraints, or location access limitations.
- Obtain any location permission or entry approval required for private venues, rooftops, gardens, parks, clubs, or residences.""",
    "section_19": """    - For proposal sessions, Client is responsible for providing accurate timing, location, and contingency information. Illuminate Studios is not responsible for missed moments caused by inaccurate instructions, inaccessible locations, changes in timing without notice, or third-party interference.
    - Basic editing includes colour correction, exposure adjustment, image selection, and standard style consistency. Extensive retouching, object removal, body reshaping, compositing, or restoration is not included unless agreed in writing.""",
}

KIDS_BIRTHDAY = {
    "key": "kids_birthday",
    "title": "Kids Birthday Photography Agreement",
    "service_category": "Birthday",
    "service_type": "Kids Birthday / Family Event",
    "payment_terms": "Balance due seven (7) calendar days before the event date.",
    "package_table": """| Select | Package | Price | Coverage | Included Deliverables |
|---|---|---|---|---|
| ☐ | Birthday Essential | $495 | 2 hours | 80+ edited images; Cake, family, guests and candids |
| ☐ | Birthday Classic | $695 | 3 hours | 150+ edited images; Party details and family portraits |
| ☐ | Birthday Deluxe | $895 | 4 hours | 250+ edited images; Full party coverage |
| ☐ | First Birthday Premium | $1,095 | 5 hours | Pre-party details; Family portraits and cake coverage |""",
    "client_obligations": """- Ensure a responsible adult is present at all times when children are photographed.
- Ensure the venue permits photography and that any venue rules are provided to Illuminate Studios before the event.
- Notify attendees, parents, guardians, or guests that a photographer will be present where appropriate.
- Identify any child or guest who must not be photographed before the event begins.""",
    "section_19": """    - Illuminate Studios will use reasonable efforts to avoid photographing any person identified in writing before the event as not to be photographed, but Client remains responsible for guest communication and any consent obligations.
    - Coverage is documentary in nature and depends on available light, venue access, crowd movement, child cooperation, and event flow.
    - A safe working environment must be maintained around children, guests, equipment, food service areas, and entertainment zones.""",
}

EVENT = {
    "key": "event",
    "title": "Event Photography Agreement",
    "service_category": "Event",
    "service_type": "Event Photography",
    "payment_terms": "Balance due seven (7) calendar days before the event date.",
    "package_table": """| Select | Package | Price | Coverage | Included Deliverables |
|---|---|---|---|---|
| ☐ | Event Hourly | $350/hr | Minimum 2 hours | Edited digital gallery; Suitable for short events |
| ☐ | Small Event | $650 | 2 hours | 100+ edited images; 72-hour preview gallery |
| ☐ | Standard Event | $1,195 | 4 hours | 250+ edited images; Private online gallery |
| ☐ | Large Event | $1,695 | 6 hours | 400+ edited images; Full event story coverage |
| ☐ | Full Day Event | $2,295 | Up to 8 hours | 600+ edited images; Large functions/corporate events |""",
    "client_obligations": """- Provide a run sheet, key moments list, VIP list, venue contact, and access instructions at least seven (7) days before the event where available.
- Ensure the venue permits photography and provide venue rules, security procedures, lighting restrictions, or contractor induction requirements before the event.
- Notify guests or attendees that photography may occur, and manage any guest privacy restrictions or internal consent requirements.
- Provide a clear contact person who has authority to make reasonable decisions on the event day.""",
    "section_19": """    - Event coverage is documentary in nature and depends on available light, venue access, crowd movement, running order, and cooperation of guests or venue staff.
    - Illuminate Studios is not responsible for missed photographs caused by restricted access, late schedule changes, venue rules, poor lighting, third-party obstruction, or Client failing to identify key people or moments.
    - For events longer than five (5) hours, Client must allow reasonable breaks and access to water. Where a meal break is required during formal meal service, a vendor meal is requested where practical.""",
}

WEDDING = {
    "key": "wedding",
    "title": "Wedding Photography Agreement",
    "service_category": "Wedding",
    "service_type": "Wedding Photography",
    "payment_terms": "50% payment due 60 days before the wedding; final balance due 14 days before the wedding.",
    "package_table": """| Select | Package | Price | Coverage | Included Deliverables |
|---|---|---|---|---|
| ☐ | Registry / Elopement | $995 | 2 hours | Ceremony and portraits; 150+ edited images |
| ☐ | Wedding Essential | $1,895 | 4 hours | Ceremony, family and couple portraits; Reception opening coverage |
| ☐ | Wedding Classic | $2,695 | 6 hours | Ceremony, portraits and reception highlights; Best-value wedding collection |
| ☐ | Wedding Signature | $3,495 | 8 hours | Preparation, ceremony and reception; Comprehensive day coverage |
| ☐ | Wedding Complete | $4,295 | 10 hours | Full-day wedding story; 700+ edited images |
| ☐ | Complete + Second Photographer | $4,995 | 10 hours | Two photographers; Broader ceremony and reception coverage |""",
    "client_obligations": """- Provide a final run sheet, ceremony details, reception details, key family combinations, VIP list, venue contacts, and access/parking instructions at least fourteen (14) days before the wedding.
- Ensure all venues permit photography and provide any church, registry, celebrant, venue, security, or cultural restrictions before the wedding day.
- Allocate reasonable time for family portraits, couple portraits, travel between locations, and reception formalities.
- Provide a responsible contact person who can gather family members and make reasonable timing decisions on the wedding day.""",
    "section_19": """    - For weddings exceeding five (5) continuous hours of coverage, Client must provide a vendor meal and reasonable break time during formal guest meal service, unless otherwise agreed in writing.
    - Illuminate Studios is not responsible for missed photographs caused by restricted access, clergy/celebrant/venue rules, late schedule changes, weather, traffic, insufficient portrait time, or Client failing to identify key people or moments.
    - If the selected collection includes a second photographer, Illuminate Studios may assign a suitably qualified associate photographer. Associate photographer selection remains at Illuminate Studios' discretion.
    - Destination or regional weddings may require travel, accommodation, parking, meals, and other reasonable expenses to be quoted and approved in writing before booking.""",
}

PORTFOLIO_RELEASE = {
    "key": "portfolio_release",
    "title": "Optional Portfolio and Marketing Release",
    "service_category": "Release",
    "service_type": "Promotional Release",
    "payment_terms": "Not applicable — this is an optional release form.",
    "package_table": "_(This document is an optional release form, separate from a photography services agreement.)_",
    "client_obligations": "- Client / guardian confirms authority to grant the selected release.",
    "section_19": "    - This release does not transfer copyright. Copyright remains owned by Illuminate Studios or the relevant photographer unless expressly assigned in writing.",
}


def _portfolio_release_body() -> str:
    return """# OPTIONAL RELEASE FORM — ILLUMINATE STUDIOS

## Optional Portfolio and Marketing Release

**ILLUMINATE STUDIOS | https://illuminatestudios.com.au**

This optional release is separate from the photography services agreement. Use it where Illuminate Studios seeks permission to use selected images for portfolio, website, social media, advertising, competitions, publications, or studio promotion. If this form is not signed, the photography agreement should be treated as not granting promotional use unless another signed written release exists.

### Client and Session Details

- Client / guardian name(s): [Client name(s)]
- Email / phone: [Client email] / [Client phone]
- Session / event date: [Session / event date]
- Session / event type: [Family / anniversary / birthday / event / wedding]
- Minor child name(s), if applicable: [Names or N/A]

### Release Selection

- ☐ **Full release granted** — Portfolio, website, social media, advertising, competitions, publications, studio promotion, and related business use.
- ☐ **Limited release granted** — Limited to: [portfolio only / website only / no names / no venue names / other limits].
- ☐ **Release declined** — No promotional release is granted.

### Terms

- Client grants Illuminate Studios permission to use selected visual materials only to the extent selected above.
- Where a minor is named above, the signing adult confirms they are a parent or legal guardian with authority to grant the selected release.
- Illuminate Studios will not intentionally publish private contact details, residential addresses, or sensitive personal information with released images.
- Client may request that future promotional use cease by written notice. This does not require removal of printed materials, already published third-party content, archived posts, or uses already reasonably committed before the notice is received.
- This release does not transfer copyright. Copyright remains owned by Illuminate Studios or the relevant photographer unless expressly assigned in writing.

""" + _signature_block()


TEMPLATES = [FAMILY_PORTRAIT, ANNIVERSARY_COUPLES, KIDS_BIRTHDAY, EVENT, WEDDING, PORTFOLIO_RELEASE]


def build_template_body(spec: Dict) -> str:
    if spec["key"] == "portfolio_release":
        return _portfolio_release_body()
    return _compose(
        title=spec["title"],
        service_type=spec["service_type"],
        package_table=spec["package_table"],
        client_obligations=spec["client_obligations"],
        section_19=spec["section_19"],
        payment_terms=spec["payment_terms"],
    )


# ---------------------------------------------------------------------------
# Placeholder fill
# ---------------------------------------------------------------------------

def _fmt_money(v: Optional[float]) -> str:
    if v is None:
        return "[AUD $]"
    return f"AUD ${float(v):.2f}"


def _fmt_date(iso: Optional[str]) -> str:
    if not iso:
        return "[Session / event date]"
    try:
        return datetime.fromisoformat(iso).strftime("%A, %d %B %Y")
    except Exception:
        return iso


def fill_placeholders(body: str, ctx: Dict) -> str:
    """Replace `[Placeholder]` markers in a contract body with values from `ctx`.

    `ctx` accepts these keys (all optional):
      client_name, client_address, client_email, client_phone,
      session_date (ISO YYYY-MM-DD), location, start_time, end_time,
      duration_minutes (used to compute end_time when start_time given but end_time isn't),
      primary_contact, total_fee (float), retainer (float), package_inclusion.
    Unfilled placeholders stay as-is so admin can finalise before sending.
    """
    total = ctx.get("total_fee")
    retainer = ctx.get("retainer")
    if total is not None and retainer is None:
        retainer = round(total * 0.10, 2)

    # Auto-compute end_time when we have start_time + duration_minutes
    end_time = ctx.get("end_time")
    start_time = ctx.get("start_time")
    duration = ctx.get("duration_minutes")
    if not end_time and start_time and duration:
        try:
            h, m = start_time.split(":")
            total_min = int(h) * 60 + int(m) + int(duration)
            end_time = f"{(total_min // 60) % 24:02d}:{total_min % 60:02d}"
        except (ValueError, AttributeError):
            # Malformed start_time/duration — leave end_time unset (optional field).
            end_time = None

    mapping = {
        "[Client name(s)]": ctx.get("client_name", "[Client name(s)]"),
        "[Client address]": ctx.get("client_address", "[Client address]"),
        "[Client email]": ctx.get("client_email", "[Client email]"),
        "[Client phone]": ctx.get("client_phone", "[Client phone]"),
        "[Session / event date]": _fmt_date(ctx.get("session_date")),
        "[Location / venue / address]": ctx.get("location", "[Location / venue / address]"),
        "[Start time]": start_time or "[Start time]",
        "[End time]": end_time or "[End time]",
        "[Name and mobile]": ctx.get("primary_contact", "[Name and mobile]"),
        "[Number or package inclusion]": ctx.get("package_inclusion", "[Number or package inclusion]"),
    }
    out = body
    for key, val in mapping.items():
        out = out.replace(key, str(val) if val is not None else key)

    # Numeric placeholders — replace the first three '[AUD $]' occurrences with
    # selected fee / addons / total, then retainer.
    out = out.replace("Selected package fee: [AUD $]", f"Selected package fee: {_fmt_money(total)}", 1)
    out = out.replace("Total fee: [AUD $]", f"Total fee: {_fmt_money(total)}", 1)
    out = out.replace("Booking retainer: 10% of total fee unless otherwise agreed in writing — [AUD $]",
                      f"Booking retainer (10%): {_fmt_money(retainer)}", 1)
    return out
