/* eslint-disable */
// ============================================================
// DS-SHELL — sidebar nav + section anchoring
// ============================================================

const SECTIONS = [
  { id: "intro",       num: "00", title: "Introduction",   group: "Overview" },
  { id: "philosophy",  num: "01", title: "Philosophy",     group: "Overview" },
  { id: "platforms",   num: "02", title: "Platforms",      group: "Overview" },

  { id: "color",       num: "03", title: "Color",          group: "Foundations" },
  { id: "typography",  num: "04", title: "Typography",     group: "Foundations" },
  { id: "spacing",     num: "05", title: "Spacing",        group: "Foundations" },
  { id: "radii",       num: "06", title: "Radii",          group: "Foundations" },
  { id: "elevation",   num: "07", title: "Elevation",      group: "Foundations" },
  { id: "motion",      num: "08", title: "Motion",         group: "Foundations" },
  { id: "iconography", num: "09", title: "Iconography",    group: "Foundations" },

  { id: "buttons",     num: "10", title: "Buttons",        group: "Components" },
  { id: "inputs",      num: "11", title: "Inputs & Forms", group: "Components" },
  { id: "badges",      num: "12", title: "Badges & Pills", group: "Components" },
  { id: "cards",       num: "13", title: "Cards",          group: "Components" },
  { id: "modals",      num: "14", title: "Modals & Toasts",group: "Components" },
  { id: "navigation",  num: "15", title: "Navigation",     group: "Components" },

  { id: "gallery",     num: "16", title: "Gallery Grid",   group: "Patterns" },
  { id: "chat",        num: "17", title: "Chat & AI",      group: "Patterns" },
  { id: "booking",     num: "18", title: "Booking Form",   group: "Patterns" },
  { id: "auth",        num: "19", title: "Auth & Tokens",  group: "Patterns" },

  { id: "handoff",     num: "20", title: "Handoff",        group: "Engineering" },
  { id: "structure",   num: "21", title: "File Structure", group: "Engineering" },
  { id: "checklist",   num: "22", title: "Checklist",      group: "Engineering" },
];

const groupOrder = ["Overview", "Foundations", "Components", "Patterns", "Engineering"];

const Sidebar = ({ active, setActive }) => {
  const grouped = groupOrder.map(g => ({
    group: g, items: SECTIONS.filter(s => s.group === g)
  }));
  return (
    <aside className="ds-side">
      <div className="ds-side-head">
        <LogoBanner height={28} />
        <div className="ds-side-version">
          <span>Design System</span>
          <b>v1.0 · Live</b>
        </div>
      </div>

      {grouped.map(g => (
        <div className="ds-side-section" key={g.group}>
          <div className="ds-side-section-title">— {g.group}</div>
          {g.items.map(s => (
            <button key={s.id}
                    className={"ds-side-link " + (active === s.id ? "active" : "")}
                    onClick={() => {
                      setActive(s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}>
              <span className="num">{s.num}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      ))}

      <div className="ds-side-foot">
        "Quiet, considered, dual-platform. Light enough to live on disk; sturdy enough to live in production."
      </div>
    </aside>
  );
};

// Section wrapper
const Section = ({ id, num, eyebrow, title, desc, headRight, children }) => (
  <section className="ds-section" id={id}>
    <div className="ds-section-head">
      <div>
        <div className="ds-section-eyebrow">{num} · {eyebrow}</div>
        <h2>{title}</h2>
        {desc && <div className="ds-section-desc">{desc}</div>}
      </div>
      {headRight && <div>{headRight}</div>}
    </div>
    {children}
  </section>
);

// Sub-section
const Sub = ({ title, desc, children }) => (
  <div className="ds-sub">
    <h3>{title}</h3>
    {desc && <div className="ds-sub-desc">{desc}</div>}
    {children}
  </div>
);

// ============================================================
// CODE BLOCK — minimal syntax highlight using inline spans
// ============================================================
const Code = ({ platform, tag, children }) => (
  <div className="code">
    <span className="tag">
      <span className="dot" />
      {tag || platform}
    </span>
    {children}
  </div>
);

// Code helpers — token spans (used inside Code blocks via simple template)
const kw  = (t) => <span className="c-kw">{t}</span>;
const str = (t) => <span className="c-str">{t}</span>;
const num = (t) => <span className="c-num">{t}</span>;
const com = (t) => <span className="c-com">{t}</span>;
const key = (t) => <span className="c-key">{t}</span>;
const fn  = (t) => <span className="c-fn">{t}</span>;
const typ = (t) => <span className="c-typ">{t}</span>;

// Platform-tabs widget
const PlatformTabs = ({ value, onChange }) => (
  <div className="platform-tabs">
    {["both", "web", "native"].map(v => (
      <button key={v}
              className={"platform-tab " + (value === v ? "active" : "")}
              onClick={() => onChange(v)}>
        <span className="dot" />
        {v === "both" ? "Both" : v === "web" ? "React · Vite" : "Expo · RN"}
      </button>
    ))}
  </div>
);

// Phone frame helper (live RN component preview)
const PhoneFrame = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div className="rn-frame">
      <div className="rn-frame-screen">
        <div className="rn-frame-notch" />
        {children}
      </div>
    </div>
    {label && (
      <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
                    color: "var(--bone-400)", fontWeight: 600 }}>
        {label}
      </div>
    )}
  </div>
);

Object.assign(window, {
  Sidebar, Section, Sub, Code, PlatformTabs, PhoneFrame, SECTIONS,
  kw, str, num, com, key, fn, typ,
});
