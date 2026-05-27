/* eslint-disable */
// ============================================================
// DS-APP — Overview sections + top-level page assembly
// ============================================================

const IntroSection = () => (
  <section className="ds-section" id="intro" style={{ paddingTop: 0, borderBottom: 0 }}>
    <div className="ds-hero">
      <div>
        <div className="ds-section-eyebrow">— Illuminate Studios</div>
        <h1>
          Design <span className="serif-italic gold-text"
                       style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>System.</span>
        </h1>
        <div className="lede">
          One source of tokens, two platforms. Editorial restraint applied with engineering rigour —
          built for the studio's photographer, her admin work, and the quiet rooms her clients sign in to.
        </div>
      </div>
      <div className="ds-hero-meta">
        <div><span className="k">v1.0.0</span> · Live</div>
        <div><span className="k">Expo</span> SDK 51+</div>
        <div><span className="k">React</span> 18.3 · Vite 5</div>
        <div><span className="k">TypeScript</span> 5.4</div>
        <div style={{ marginTop: 8 }}>
          <ThemeToggle />
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                  background: "var(--ink-400)", border: "1px solid var(--ink-400)" }}>
      {[
        { k: "23", l: "Sections", s: "Foundations · Components · Patterns" },
        { k: "8",  l: "Token Layers", s: "Color · Type · Space · Radius · Shadow · Motion · Z · Breakpoint" },
        { k: "2",  l: "Themes",   s: "Light · Dark · semantic swap" },
        { k: "2",  l: "Platforms",s: "React Vite · Expo React Native" },
      ].map(m => (
        <div key={m.l} style={{ background: "var(--ink-100)", padding: "28px 24px",
                                display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48,
                        letterSpacing: "0.04em", color: "var(--gold-300)",
                        lineHeight: 1 }}>{m.k}</div>
          <div className="swatch-name" style={{ marginTop: 8 }}>{m.l}</div>
          <div className="swatch-role">{m.s}</div>
        </div>
      ))}
    </div>
  </section>
);

const PhilosophySection = () => (
  <Section id="philosophy" num="01" eyebrow="Overview"
           title="Philosophy"
           desc="Six principles. Every component answers to all six.">
    <div className="panel">
      {[
        ["01", "Quiet over loud",          "Whitespace, hairlines, and serif italics carry the voice. No drop-shadow theatrics; no gradient theatre. The photographs are the loud thing — chrome stays out of their way."],
        ["02", "One token, two platforms", "Every value lives in tokens.ts. Web and native consume identical names. If a token can't be expressed on one platform, it doesn't enter the system."],
        ["03", "Semantic over primitive",  "Component code never sees a hex code. It asks for surface.raised, ink.primary, brand.gold — the active theme resolves. Themes swap without rewrites."],
        ["04", "Editorial type rules",     "Display = Cinzel uppercase. Serif italic = Cormorant Garamond. Body = Inter. Mono = JetBrains. Don't blur the assignments."],
        ["05", "Restrained motion",        "Two easings — out and inOut. Three durations — 180, 340, 700. The system rises and fades; it never bounces."],
        ["06", "Accessibility is structural", "Hit targets ≥ 44 dp on native. Focus rings are gold, never blue. Color contrast ≥ AA, including dark theme cream-on-ink."],
      ].map(p => (
        <div className="anchor-row" key={p[0]} style={{ alignItems: "flex-start" }}>
          <span className="num" style={{ minWidth: 32 }}>{p[0]}</span>
          <span className="name" style={{ minWidth: 200 }}>{p[1]}</span>
          <span className="desc">{p[2]}</span>
        </div>
      ))}
    </div>
  </Section>
);

const PlatformsSection = () => (
  <Section id="platforms" num="02" eyebrow="Overview"
           title="Platforms"
           desc="Both apps consume @is/tokens. Both apps consume @is/ui. The token file is platform-agnostic; the UI package ships .tsx and .native.tsx variants per component, picked by Metro or Vite automatically.">

    <div className="compare">
      <div className="panel">
        <div className="eyebrow" style={{ color: "var(--gold-300)" }}>Web</div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "12px 0 14px",
                     letterSpacing: "0.04em", textTransform: "uppercase" }}>
          React · Vite
        </h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13,
                     color: "var(--bone-200)", lineHeight: 1.9 }}>
          <li>· Tokens → CSS custom properties via themeToCSSVars()</li>
          <li>· data-theme attribute swaps themes in O(1)</li>
          <li>· Google Fonts via {`<link>`}</li>
          <li>· Icons inline SVG, color = currentColor</li>
          <li>· Storybook 8 for component docs</li>
        </ul>
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ color: "var(--gold-300)" }}>Native</div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "12px 0 14px",
                     letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Expo · React Native
        </h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13,
                     color: "var(--bone-200)", lineHeight: 1.9 }}>
          <li>· Tokens → useTheme() returns the resolved Theme object</li>
          <li>· expo-font preloads all five families before render</li>
          <li>· react-native-svg drives the icon set (same JSX shape)</li>
          <li>· expo-secure-store keeps session tokens</li>
          <li>· Animated + Easing.bezier for motion tokens</li>
        </ul>
      </div>
    </div>

    <div style={{ height: 16 }} />

    <Code tag="Single import works in both">{`${'import'} { useTheme, type, space, radius } ${'from'} "@is/tokens";

${'// React Vite — emits px '}
${'// Expo RN  — emits dp'}
${'// One file. Two platforms. Identical API.'}`}</Code>
  </Section>
);

// ============================================================
// PAGE ROOT
// ============================================================
const DesignSystemPage = () => {
  const [active, setActive] = useState("intro");

  // Scroll-spy
  useEffect(() => {
    const ids = SECTIONS.map(s => s.id);
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="ds-app">
          <Sidebar active={active} setActive={setActive} />
          <main className="ds-main">
            <IntroSection />
            <PhilosophySection />
            <PlatformsSection />

            <ColorSection />
            <TypographySection />
            <SpacingSection />
            <RadiiSection />
            <ElevationSection />
            <MotionSection />
            <IconographySection />

            <ButtonsSection />
            <InputsSection />
            <BadgesSection />
            <CardsSection />
            <ModalsSection />
            <NavigationSection />

            <GallerySection />
            <ChatSection />
            <BookingSection />
            <AuthSection />

            <HandoffSection />
            <StructureSection />
            <ChecklistSection />
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<DesignSystemPage />);
