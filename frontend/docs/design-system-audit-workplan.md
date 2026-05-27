# Design System Assessment & Non-Breaking Alignment Work Plan

## Scope
This assessment cross-checks the current application styling/layout against the implemented design system primitives already present in the codebase (Tailwind theme tokens, base CSS variables, and reusable UI components), then proposes a **non-breaking** migration plan.

Constraints captured in this plan:
- No breaking visual or behavioral changes.
- No feature regressions.
- All existing flows remain functional.
- Missing features discovered during UX/design audit are integrated via additive changes only.

---

## 1) Current Design System (What is documented in code today)

### 1.1 Foundations
- **Color tokens** are defined as CSS custom properties (`--background`, `--foreground`, `--muted`, etc.) and mapped in Tailwind config (`colors.background`, `colors.primary`, etc.).
- **Typography system** exists with branded families:
  - `font-display` = Cormorant Garamond
  - `font-sans` = Manrope
  - `font-mono-ui` = JetBrains Mono
  - `font-signature` = Caveat
- **Shape system** is intentionally sharp with near-square radius (`2px`) globally overriding common rounded classes.
- **Motion primitive** exists (`fade-in` keyframe + `animation.fade-in`).
- **Theme variant** exists (`lights-out` class + `lights-out-active` body behavior).

### 1.2 Component primitives
- Reusable shadcn-style primitives are present (`Button`, `Input`, `Badge`, `Toast`, etc.) with variant support.
- Utility helper (`cn`) and `class-variance-authority` are available for variant architecture.

### 1.3 Layout conventions
- A de-facto shell width/padding pattern appears repeatedly:
  - `max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16`
- The app uses editorial micro-typography heavily:
  - `text-[10px] uppercase tracking-[0.3em]` and nearby variants.

---

## 2) Cross-check Findings (Design system vs current app implementation)

## ✅ Strengths
1. Strong brand direction (editorial aesthetic) is consistently visible across major pages.
2. Tokenized color foundations are broadly used (`bg-background`, `text-foreground`, `border-border`).
3. Common interaction patterns (hover, transitions, border-first controls) are generally coherent.
4. The global shell/layout rhythm is reused in many routes.

## ⚠️ Drift / Gaps
1. **Token bypass via raw utility values**
   - Repeated hard-coded micro-typography utilities (`text-[10px]`, `tracking-[0.3em]`, `tracking-[0.4em]`) instead of semantic utilities.
   - Repeated hard-coded layout strings (`max-w-[1400px] ...`).
2. **Primitive under-utilization**
   - Many native `<button>`/`<a>` controls duplicate variant styles instead of reusing `Button` variants.
3. **State-style inconsistency risk**
   - Similar states (primary CTA, outline CTA, quiet links, tags/status pills) are visually rebuilt ad hoc across pages.
4. **Theme compatibility gap risk**
   - Some surfaces use literal colors (e.g., `bg-white`), reducing consistency under alternate themes (`lights-out`).
5. **Missing formal design-system documentation**
   - System is encoded in implementation, but not codified as consumable docs/tables (tokens, component states, usage rules, do/don't).
6. **Regression risk due to broad class duplication**
   - Because style decisions are spread across many pages, any rebrand or spacing tweak becomes fragile and expensive.

---

## 3) Non-Breaking Upgrade Strategy

Adopt a **strangler pattern** for design-system alignment:
- Add semantic tokens/components first.
- Backfill old usages incrementally.
- Keep old classes working until migration is complete.
- Validate user-critical flows after each batch.

No route/functionality rewrites are required.

---

## 4) Detailed Work Plan

## Phase 0 — Baseline & Safety Nets
**Goal:** Freeze behavior before visual refactor.

1. Capture route-by-route screenshots of key states (public, auth, admin, booking, invoices, gallery, documents).
2. Create a visual parity checklist (spacing, hierarchy, controls, hover/focus, responsive breakpoints).
3. Expand smoke tests for critical paths:
   - Register/login/logout
   - Book session
   - Admin booking status flows
   - Client gallery/invoice/document actions
4. Add Storybook or lightweight component preview route (if Storybook not desired) for DS primitives.

**Exit criteria:** Test baseline and image baseline exist.

## Phase 1 — Formalize Design Tokens (Additive)
**Goal:** Replace raw repeated values with named design tokens/utilities, no visual change.

1. Add semantic aliases in Tailwind/theme for:
   - Container widths/paddings
   - Micro label text styles
   - Letter-spacing tiers
   - CTA height/padding scales
2. Introduce utility classes in `index.css` via `@layer components`:
   - `.container-shell`
   - `.label-caps`
   - `.btn-editorial-primary`, `.btn-editorial-outline`, `.btn-editorial-ghost`
3. Preserve old classes; new semantic classes must render identical computed styles.

**Exit criteria:** New semantic utilities exist and match current UI output.

## Phase 2 — Componentize Repeated Patterns
**Goal:** Reduce drift by standardizing repeated UI chunks.

1. Extend `Button` variants to include editorial variants already used in pages.
2. Add small reusable primitives:
   - `SectionShell` (container + responsive paddings)
   - `SectionLabel` (caps micro label)
   - `StatusPill` (booking/doc/invoice statuses)
   - `PageHeadingBlock` (eyebrow + title + subtitle)
3. Migrate page-by-page, preserving test IDs and behavior.

**Exit criteria:** No duplicated CTA/status label recipes remain in migrated pages.

## Phase 3 — Layout System Normalization
**Goal:** Keep responsive rhythm consistent while preserving current compositions.

1. Centralize common spacing scales for vertical sections.
2. Replace repeated shell literals with `SectionShell` / semantic utility.
3. Standardize grid presets used repeatedly (`12-col editorial`, `card list`, `split hero`).

**Exit criteria:** Shared layout primitives cover majority of route layouts.

## Phase 4 — Theme Hardening (including lights-out)
**Goal:** Ensure all surfaces derive from tokens.

1. Replace literal colors (e.g., `bg-white`) with token-based equivalents.
2. Verify contrast and readable states under default and lights-out themes.
3. Ensure focus rings, borders, disabled states remain clear in both themes.

**Exit criteria:** No non-exempt literal color usage in app UI surfaces.

## Phase 5 — Missing Feature Integration (Additive only)
**Goal:** Integrate currently missing UX/system features discovered in audit without regression.

Priority additions:
1. **Consistent loading/empty/error skeleton states** for major data pages.
2. **Unified form validation presentation** (error text, invalid border/focus states).
3. **Accessible focus and keyboard affordances** for all interactive controls.
4. **Design-system documentation page** inside app/admin for maintainers (optional internal route).

**Exit criteria:** Missing UX states integrated and mapped to DS primitives.

## Phase 6 — Verification & Release Controls
**Goal:** Prove non-breaking compliance.

1. Re-run automated tests + smoke scripts.
2. Visual diff against Phase 0 baselines.
3. Manual QA matrix by role (guest/client/admin).
4. Staged rollout with rollback-safe small PRs.

**Exit criteria:** Zero functional regression, visual parity accepted, DS adoption metrics improved.

---

## 5) Recommended Implementation Sequence (PR slicing)

1. PR-1: Token aliases + semantic utilities + no page migration.
2. PR-2: Button/label/status primitives + migrate 2–3 pages.
3. PR-3: Migrate remaining public pages.
4. PR-4: Migrate admin pages.
5. PR-5: Theme hardening + literal color cleanup.
6. PR-6: Missing UX states + final docs + visual/test verification.

Each PR must include:
- Before/after screenshots.
- Route-level smoke test results.
- Explicit note: “No behavioral/feature changes intended.”

---

## 6) Risk Register and Mitigations

1. **Risk:** Styling refactor unintentionally changes clickable area/hierarchy.
   - **Mitigation:** Snapshot + interaction test coverage before migration.
2. **Risk:** Hidden admin/client states regress.
   - **Mitigation:** Role-based QA checklist and scripted smoke runs.
3. **Risk:** Over-centralization blocks edge cases.
   - **Mitigation:** Provide escape hatches (`className` passthrough + variant extension).
4. **Risk:** Long migration window causes mixed paradigms.
   - **Mitigation:** Enforce “new work must use DS primitives” policy immediately after Phase 1.

---

## 7) Definition of Done

The design-system alignment is complete when:
1. All high-frequency repeated style patterns are represented by semantic DS primitives.
2. All key routes consume DS primitives for buttons, labels, containers, and status chips.
3. All major states (loading/empty/error/success/disabled/focus) are documented and implemented.
4. Theme parity (default + lights-out) is validated.
5. No functional features are removed; no regressions are introduced.

