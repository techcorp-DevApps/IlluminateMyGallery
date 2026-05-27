/* eslint-disable */
// ============================================================
// DS-FOUNDATIONS — color, type, spacing, radii, elevation, motion, icons
// ============================================================

// --- Color swatch row component
const Swatch = ({ name, val, role, light, dark }) => (
  <div className="swatch">
    <div className="swatch-color" style={{ background: val }} />
    <div className="swatch-meta">
      <div className="swatch-name">{name}</div>
      <div className="swatch-val">{val}</div>
      {role && <div className="swatch-role">{role}</div>}
    </div>
  </div>
);

// Color ramps from tokens.ts (mirrored here for display — single source still tokens.ts)
const RAMPS = {
  paper: [
    { name: "Paper 50",  val: "#fafbfc", role: "Page bg · light" },
    { name: "Paper 100", val: "#ffffff", role: "Card · light" },
    { name: "Paper 200", val: "#f1f4f7", role: "Inset · light" },
    { name: "Paper 300", val: "#e1e7ed", role: "Accent · light" },
    { name: "Paper 400", val: "#c4cdd6", role: "Border" },
    { name: "Paper 500", val: "#8a96a3", role: "Strong border" },
  ],
  navy: [
    { name: "Navy 50",  val: "#0e1730", role: "Primary ink" },
    { name: "Navy 100", val: "#1a2540", role: "" },
    { name: "Navy 200", val: "#34405a", role: "Secondary ink" },
    { name: "Navy 300", val: "#5a6378", role: "Tertiary ink" },
    { name: "Navy 400", val: "#828a9a", role: "" },
    { name: "Navy 500", val: "#aab1be", role: "Disabled" },
  ],
  ink: [
    { name: "Ink 0",   val: "#050505", role: "True black" },
    { name: "Ink 50",  val: "#0a0a0a", role: "Canvas · dark" },
    { name: "Ink 100", val: "#0f0f0f", role: "Elevated · dark" },
    { name: "Ink 200", val: "#141414", role: "Raised · dark" },
    { name: "Ink 300", val: "#1c1c1c", role: "Inset · dark" },
    { name: "Ink 400", val: "#242424", role: "Border" },
  ],
  cream: [
    { name: "Cream 50",  val: "#f4ebd9", role: "Primary ink · dark" },
    { name: "Cream 100", val: "#e8dcc4", role: "" },
    { name: "Cream 200", val: "#c9b896", role: "Secondary · dark" },
    { name: "Cream 300", val: "#8a8275", role: "Tertiary · dark" },
    { name: "Cream 400", val: "#5a5347", role: "Disabled" },
    { name: "Cream 500", val: "#3d3830", role: "" },
  ],
  gold: [
    { name: "Gold 100", val: "#e8d5a6", role: "Highlight" },
    { name: "Gold 200", val: "#d4b87a", role: "Hover" },
    { name: "Gold 300", val: "#c9a96e", role: "Brand · primary" },
    { name: "Gold 400", val: "#a8884f", role: "Border · light" },
    { name: "Gold 500", val: "#826737", role: "Pressed" },
  ],
  sage: [
    { name: "Sage 100", val: "#dde3d2", role: "Tint" },
    { name: "Sage 200", val: "#b5c2a4", role: "" },
    { name: "Sage 300", val: "#828d72", role: "Secondary accent" },
    { name: "Sage 400", val: "#5e6852", role: "Strong" },
    { name: "Sage 500", val: "#3d4534", role: "Deep" },
  ],
  status: [
    { name: "Success", val: "#7a9b6e", role: "Confirmed · paid" },
    { name: "Danger",  val: "#b86a5b", role: "Errors · destructive" },
    { name: "Info",    val: "#8aa3b8", role: "Neutral info" },
    { name: "Warning", val: "#d4a356", role: "Caution · review" },
  ],
};

const SemanticTable = () => (
  <table className="tok-table">
    <thead>
      <tr><th>Semantic Token</th><th>Light</th><th>Dark</th><th>Role</th></tr>
    </thead>
    <tbody>
      {[
        ["surface.canvas",   "Paper 50",  "Ink 50",   "Page background"],
        ["surface.raised",   "Paper 100", "Ink 200",  "Card · panel"],
        ["surface.elevated", "Paper 100", "Ink 100",  "Modal · popover"],
        ["surface.inset",    "Paper 200", "Ink 300",  "Input background"],
        ["surface.accent",   "Paper 300", "Ink 400",  "Hover · tint"],
        ["ink.primary",      "Navy 50",   "Cream 50", "Headings · body"],
        ["ink.secondary",    "Navy 200",  "Cream 200","Muted body"],
        ["ink.tertiary",     "Navy 300",  "Cream 300","Labels · hints"],
        ["ink.disabled",     "Navy 500",  "Cream 400","Disabled text"],
        ["ink.inverse",      "#fdf8ee",   "Ink 50",   "Text on gold buttons"],
        ["border.subtle",    "Paper 300", "Ink 400",  "Hairlines"],
        ["border.default",   "Paper 400", "Ink 500",  "Inputs · cards"],
        ["border.strong",    "Paper 500", "Ink 600",  "Emphasized"],
        ["border.gold",      "Gold 400",  "Gold 400", "Accent border"],
        ["brand.gold",       "Gold 300",  "Gold 300", "Primary brand"],
        ["brand.goldHover",  "Gold 200",  "Gold 100", "Hover state"],
        ["brand.goldMuted",  "rgba(168,136,79,0.12)", "rgba(201,169,110,0.15)", "Tinted bg"],
        ["scrim",            "rgba(14,23,48,0.55)",   "rgba(0,0,0,0.85)",       "Modal backdrop"],
      ].map(([t, l, d, role]) => (
        <tr key={t}>
          <td className="token">{t}</td><td className="val">{l}</td><td className="val">{d}</td><td className="desc">{role}</td></tr>
      ))}
    </tbody>
  </table>
);

const ColorSection = () => (
  <Section id="color" num="03" eyebrow="Foundations"
           title="Color"
           desc="Two themes, one semantic vocabulary. Primitives are never referenced in components — code always reaches for a semantic role (e.g. surface.raised) which the active theme resolves.">

    <Sub title="Brand · gold ramp" desc="Brass-toned signature. One ramp, two themes — different roles per theme.">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {RAMPS.gold.map(s => <Swatch key={s.name} {...s} />)}
      </div>
    </Sub>

    <Sub title="Light · paper & navy" desc="Cool off-whites for surfaces; deep navy inks for text. Used as the default daylight theme.">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {RAMPS.paper.map(s => <Swatch key={s.name} {...s} />)}
      </div>
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginTop: 1 }}>
        {RAMPS.navy.map(s => <Swatch key={s.name} {...s} />)}
      </div>
    </Sub>

    <Sub title="Dark · ink & cream" desc="True blacks paired with warm creams — gallery viewing mode and after-hours admin.">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {RAMPS.ink.map(s => <Swatch key={s.name} {...s} />)}
      </div>
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginTop: 1 }}>
        {RAMPS.cream.map(s => <Swatch key={s.name} {...s} />)}
      </div>
    </Sub>

    <Sub title="Secondary · sage & status" desc="Olive sage for non-brand accents; four-color status set used across both themes.">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {RAMPS.sage.map(s => <Swatch key={s.name} {...s} />)}
      </div>
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 1 }}>
        {RAMPS.status.map(s => <Swatch key={s.name} {...s} />)}
      </div>
    </Sub>

    <Sub title="Semantic mapping" desc="The keys components actually consume. Light and dark theme objects must keep identical keys — this table is the contract.">
      <SemanticTable />
    </Sub>

    <Sub title="Cross-platform usage">
      <div className="code-pair">
        <Code tag="Shared · tokens.ts">{`${'import'} { themes, useTheme } ${'from'} "./tokens";

${'export const'} useColor = () => {
  ${'const'} t = useTheme();
  ${'return'} t.surface.canvas;
};`}</Code>

        <Code tag="React · Vite">{`${'/* index.css — vars injected per theme */'}
:root[data-theme="light"] {
  --surface-canvas: #fafbfc;
  --ink-primary:    #0e1730;
}
.card { background: var(--surface-canvas); }`}</Code>
      </div>
      <div style={{ height: 16 }} />
      <Code tag="Expo · React Native">{`${'import'} { useTheme } ${'from'} "@is/tokens";
${'import'} { View, Text } ${'from'} "react-native";

${'export const'} Card = ({ children }) => {
  ${'const'} t = useTheme();
  ${'return'} (
    <View style={{ backgroundColor: t.surface.raised,
                   borderColor: t.border.subtle,
                   borderWidth: 1, borderRadius: 4, padding: 24 }}>
      <Text style={{ color: t.ink.primary }}>{children}</Text>
    </View>
  );
};`}</Code>
    </Sub>
  </Section>
);

// ===================== TYPOGRAPHY =====================
const TypographySection = () => (
  <Section id="typography" num="04" eyebrow="Foundations"
           title="Typography"
           desc="Four families — display, serif, body, mono — earn distinct roles. No casual mixing. Sizes are unitless numbers; web treats them as px, RN as dp.">

    <Sub title="Type families">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        {[
          { name: "Display", family: "Cinzel", role: "Headings, eyebrows", spec: "400/500/600",
            sample: "ILLUMINATE STUDIOS", className: "display", style: { fontSize: 28 } },
          { name: "Serif",   family: "Cormorant Garamond", role: "Lede, italic emphasis", spec: "400/500 · italic",
            sample: "Quietly kept.", className: "serif-italic", style: { fontSize: 28 } },
          { name: "Body",    family: "Inter", role: "Interface, labels", spec: "400/500/600",
            sample: "The body voice of the system.", style: { fontFamily: "var(--font-body)", fontSize: 18 } },
          { name: "Mono",    family: "JetBrains Mono", role: "Code, token IDs, numbers", spec: "400/500/600",
            sample: "tokens.brand.gold", style: { fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--gold-300)" } },
        ].map(f => (
          <div key={f.name} style={{ padding: 0 }}>
            <div style={{ padding: 24, borderBottom: "1px solid var(--ink-400)" }}>
              <div className={f.className} style={f.style}>{f.sample}</div>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="swatch-name">{f.name}</div>
                <div className="swatch-role">{f.role}</div>
              </div>
              <div className="swatch-val" style={{ textAlign: "right" }}>
                {f.family}<br/>{f.spec}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Sub>

    <Sub title="Type scale" desc="11-step scale. Mobile and web share the same numbers — adjust per breakpoint via the responsive helpers in tokens.ts.">
      {[
        { tok: "6xl", val: 88, label: "Display", sample: "Illuminate",  cls: "display" },
        { tok: "5xl", val: 64, label: "Hero",    sample: "Your story",  cls: "display" },
        { tok: "4xl", val: 48, label: "Page H1", sample: "Bookings",    cls: "display" },
        { tok: "3xl", val: 36, label: "Section", sample: "Recent activity", cls: "" },
        { tok: "2xl", val: 28, label: "Card H",  sample: "Eleanor Whitfield" },
        { tok: "xl",  val: 22, label: "Sub-h",   sample: "Engagement · 2025" },
        { tok: "lg",  val: 18, label: "Lead",    sample: "A quiet documentation of your day." },
        { tok: "md",  val: 16, label: "Body+",   sample: "Standard reading size for paragraphs." },
        { tok: "base",val: 14, label: "Body",    sample: "Default UI text — buttons, lists, inputs." },
        { tok: "sm",  val: 12, label: "Caption", sample: "Metadata, captions, micro-copy" },
        { tok: "xs",  val: 10, label: "Label",   sample: "EYEBROW · TIMESTAMP" },
      ].map(s => (
        <div className="type-row" key={s.tok}>
          <div className="type-meta">
            <b>{s.label}</b>
            type.size.{s.tok} · <i>{s.val}px / {s.val}dp</i>
          </div>
          <div className={s.cls} style={{ fontSize: s.val, lineHeight: 1.1,
              fontFamily: s.cls ? undefined : "var(--font-body)",
              fontWeight: s.cls ? undefined : 500,
              color: "var(--bone-100)" }}>
            {s.sample}
          </div>
        </div>
      ))}
    </Sub>

    <Sub title="Weight · leading · tracking">
      <table className="tok-table">
        <thead>
          <tr><th>Token</th><th>Value</th><th>Web</th><th>RN</th><th>Role</th></tr>
        </thead>
        <tbody>
          {[
            ["weight.regular",  "400", "font-weight: 400", "fontWeight: '400'", "Body copy"],
            ["weight.medium",   "500", "font-weight: 500", "fontWeight: '500'", "Buttons, labels"],
            ["weight.semibold", "600", "font-weight: 600", "fontWeight: '600'", "Strong UI"],
            ["weight.bold",     "700", "font-weight: 700", "fontWeight: '700'", "Rare emphasis"],
            ["leading.tight",   "1.15", "line-height: 1.15", "lineHeight: size * 1.15", "Display"],
            ["leading.snug",    "1.30", "line-height: 1.30", "lineHeight: size * 1.30", "Headings"],
            ["leading.normal",  "1.55", "line-height: 1.55", "lineHeight: size * 1.55", "Body"],
            ["leading.relaxed", "1.70", "line-height: 1.70", "lineHeight: size * 1.70", "Long-form"],
            ["tracking.tight",  "-0.01em", "letter-spacing: -0.01em", "letterSpacing: size * -0.01", "Display"],
            ["tracking.wide",   "0.08em",  "letter-spacing: 0.08em",  "letterSpacing: size * 0.08",  "Brand"],
            ["tracking.wider",  "0.24em",  "letter-spacing: 0.24em",  "letterSpacing: size * 0.24",  "Buttons"],
            ["tracking.widest", "0.32em",  "letter-spacing: 0.32em",  "letterSpacing: size * 0.32",  "Eyebrows"],
          ].map(r => (
            <tr key={r[0]}>
              <td className="token">{r[0]}</td><td className="val">{r[1]}</td><td className="val">{r[2]}</td><td className="val">{r[3]}</td><td className="desc">{r[4]}</td></tr>
          ))}
        </tbody>
      </table>
    </Sub>

    <Sub title="Cross-platform usage">
      <div className="code-pair">
        <Code tag="React · Vite">{`<h1 ${'style'}={{
  fontFamily: ${'"var(--font-display)"'},
  fontSize:    ${'"64px"'},
  lineHeight:  ${'1.15'},
  letterSpacing: ${'"0.08em"'},
  textTransform: ${'"uppercase"'},
}}>Your story</h1>`}</Code>

        <Code tag="Expo · React Native">{`${'import'} { type, trackingToRN } ${'from'} "@is/tokens";

<Text style={{
  fontFamily: type.family.display,
  fontSize: type.size["5xl"],         ${'// 64'}
  lineHeight: type.size["5xl"] * 1.15,
  letterSpacing: trackingToRN(64, "wide"),
  textTransform: "uppercase",
}}>Your story</Text>`}</Code>
      </div>
    </Sub>
  </Section>
);

// ===================== SPACING =====================
const SpacingSection = () => (
  <Section id="spacing" num="05" eyebrow="Foundations"
           title="Spacing"
           desc="A 4-point scale, ten steps. Same values on web (px) and native (dp). Always reach for a token — never a free integer.">
    <div className="panel">
      {[
        { tok: "space.s1",  val: 4,   role: "Hair gap inside chips" },
        { tok: "space.s2",  val: 8,   role: "Tight stack between label + input" },
        { tok: "space.s3",  val: 12,  role: "Compact list rows" },
        { tok: "space.s4",  val: 16,  role: "Default card padding (mobile)" },
        { tok: "space.s5",  val: 24,  role: "Default card padding (web)" },
        { tok: "space.s6",  val: 32,  role: "Section padding-y · medium" },
        { tok: "space.s7",  val: 48,  role: "Container gutter · web" },
        { tok: "space.s8",  val: 64,  role: "Major section break" },
        { tok: "space.s9",  val: 96,  role: "Hero vertical rhythm" },
        { tok: "space.s10", val: 128, role: "Editorial breathing room" },
      ].map(s => (
        <div className="scale-row" key={s.tok}>
          <span className="scale-tok">{s.tok}</span>
          <span className="scale-val">{s.val}px / {s.val}dp</span>
          <span className="scale-bar" style={{ width: s.val * 3 }} title={s.role} />
        </div>
      ))}
    </div>
  </Section>
);

// ===================== RADII =====================
const RadiiSection = () => (
  <Section id="radii" num="06" eyebrow="Foundations"
           title="Radii"
           desc="Editorial restraint: most surfaces are square or near-square. Reserve full radius for chips and avatars.">
    <div className="spec-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
      {[
        { tok: "none", val: 0,    label: "Photos, banners" },
        { tok: "xs",   val: 2,    label: "Buttons, inputs" },
        { tok: "sm",   val: 4,    label: "Cards · default" },
        { tok: "md",   val: 8,    label: "Sheets, panels" },
        { tok: "lg",   val: 16,   label: "Frame · device" },
        { tok: "full", val: 9999, label: "Pills, avatars" },
      ].map(r => (
        <div key={r.tok} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 22 }}>
          <div style={{ width: "100%", aspectRatio: "1/1", maxHeight: 96,
                        background: "var(--gold-fill-grad)",
                        borderRadius: r.val, opacity: 0.85 }} />
          <div>
            <div className="swatch-name">radius.{r.tok}</div>
            <div className="swatch-val">{r.val === 9999 ? "9999" : `${r.val}px`}</div>
            <div className="swatch-role">{r.label}</div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

// ===================== ELEVATION =====================
const ElevationSection = () => (
  <Section id="elevation" num="07" eyebrow="Foundations"
           title="Elevation"
           desc="Three shadows + one gold halo. Web uses box-shadow strings; RN uses an object plus Android elevation. Both come from the same primitive.">
    <div className="spec-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {[
        { name: "shadow.sm",  cls: "sm",   role: "Toolbars · raised text" },
        { name: "shadow.md",  cls: "md",   role: "Cards · popovers" },
        { name: "shadow.lg",  cls: "lg",   role: "Modals · sheets" },
        { name: "shadow.gold",cls: "gold", role: "Premium · gold-accented" },
      ].map(s => (
        <div key={s.name} style={{ padding: 36 }}>
          <div className={"shadow-demo " + s.cls}>{s.name}</div>
          <div style={{ marginTop: 16 }}>
            <div className="swatch-name">{s.name}</div>
            <div className="swatch-role">{s.role}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ height: 16 }} />
    <div className="code-pair">
      <Code tag="React · Vite">{`${'import'} { shadowToCSS } ${'from'} "@is/tokens";

.card {
  box-shadow: ${'/* generated */'} 0 4px 16px rgba(20,30,50,0.10);
}
${'// or programmatically:'}
const css = shadowToCSS("md");`}</Code>

      <Code tag="Expo · React Native">{`${'import'} { shadowToRN } ${'from'} "@is/tokens";

<View style={{
  ...shadowToRN("md"),
  ${'// shadowColor: "#000",'}
  ${'// shadowOffset: { width: 0, height: 4 },'}
  ${'// shadowOpacity: 0.10,'}
  ${'// shadowRadius: 8, elevation: 4'}
}} />`}</Code>
    </div>
  </Section>
);

// ===================== MOTION =====================
const EaseChart = ({ d, label, bezier }) => (
  <div className="ease-card">
    <div className="ease-name">motion.easing.{label}</div>
    <div className="ease-bezier">cubic-bezier({bezier})</div>
    <svg viewBox="0 0 100 60" preserveAspectRatio="none">
      <path d={`M 0 50 L 100 50`} stroke="var(--ink-400)" strokeWidth="0.5" fill="none"/>
      <path d={`M 0 10 L 100 10`} stroke="var(--ink-400)" strokeWidth="0.5" fill="none"/>
      <path d={d} stroke="var(--gold-300)" strokeWidth="1.5" fill="none"/>
    </svg>
  </div>
);

const MotionSection = () => (
  <Section id="motion" num="08" eyebrow="Foundations"
           title="Motion"
           desc="Three durations, two easings — applied with restraint. The system favours fades and rises; never bounces.">
    <Sub title="Easing curves">
      <div className="spec-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <EaseChart label="out"
                   bezier="0.16, 1, 0.3, 1"
                   d="M 0 50 C 16 50, 30 10, 100 10" />
        <EaseChart label="inOut"
                   bezier="0.65, 0, 0.35, 1"
                   d="M 0 50 C 35 50, 65 10, 100 10" />
      </div>
    </Sub>

    <Sub title="Durations">
      <table className="tok-table">
        <thead>
          <tr><th>Token</th><th>Value</th><th>Use for</th></tr>
        </thead>
        <tbody>
          <tr><td className="token">duration.fast</td><td className="val">180ms</td><td className="desc">Hover, focus rings, micro-state</td></tr>
          <tr><td className="token">duration.medium</td><td className="val">340ms</td><td className="desc">Modal open, toast enter, route swap</td></tr>
          <tr><td className="token">duration.slow</td><td className="val">700ms</td><td className="desc">Hero rise, key reveal moments</td></tr>
        </tbody>
      </table>
    </Sub>

    <Sub title="Cross-platform usage">
      <div className="code-pair">
        <Code tag="React · Vite">{`.btn {
  transition: all var(--dur-fast) var(--ease-out);
}
.btn:hover { transform: translateY(-1px); }`}</Code>

        <Code tag="Expo · React Native">{`${'import'} { Animated, Easing } ${'from'} "react-native";
${'import'} { motion } ${'from'} "@is/tokens";

Animated.timing(opacity, {
  toValue: 1,
  duration: motion.duration.medium,    ${'// 340'}
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  useNativeDriver: true,
}).start();`}</Code>
      </div>
    </Sub>
  </Section>
);

// ===================== ICONOGRAPHY =====================
const IconographySection = () => {
  const iconNames = [
    "menu", "close", "chevronR", "chevronL", "chevronD", "check", "plus", "image",
    "folder", "doc", "inbox", "pricing", "gallery", "calendar", "user", "users",
    "search", "bell", "star", "settings", "arrow", "heart", "download", "eye",
    "edit", "trash", "camera", "clock", "pin", "logout", "sparkle",
  ];
  return (
    <Section id="iconography" num="09" eyebrow="Foundations"
             title="Iconography"
             desc="One stroke family. 24×24 viewbox, 1.5 stroke, round caps + joins. Same SVG source on web (raw <svg>) and native (react-native-svg).">
      <div className="panel">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1,
                      background: "var(--ink-400)", border: "1px solid var(--ink-400)" }}>
          {iconNames.map(n => (
            <div key={n} style={{ background: "var(--ink-100)", padding: 18,
                                  display: "flex", flexDirection: "column",
                                  alignItems: "center", gap: 10 }}>
              <div style={{ color: "var(--gold-300)" }}><Icon name={n} size={22}/></div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5,
                            color: "var(--bone-300)" }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 16 }} />
      <div className="code-pair">
        <Code tag="React · Vite">{`<Icon name="camera" size={20} />
${'// renders inline SVG, color = currentColor'}`}</Code>
        <Code tag="Expo · React Native">{`${'import'} Svg, { Path } ${'from'} "react-native-svg";

<Icon name="camera" size={20} stroke="#c9a96e" />
${'// same JSX shape — wraps Svg + Path'}`}</Code>
      </div>
    </Section>
  );
};

Object.assign(window, {
  ColorSection, TypographySection, SpacingSection,
  RadiiSection, ElevationSection, MotionSection, IconographySection,
});
