/* eslint-disable */
// ============================================================
// DS-HANDOFF — engineering install + structure + checklist
// ============================================================

// ===================== HANDOFF (install) =====================
const HandoffSection = () => (
  <Section id="handoff" num="20" eyebrow="Engineering"
           title="Handoff"
           desc="Drop tokens.ts into a shared package. Wire one ThemeProvider per app. Done."
           headRight={<span className="ds-status live"><span className="pulse"/>Production Ready</span>}>

    <Sub title="Install · monorepo layout (recommended)">
      <Code tag="Workspace">{`packages/
  tokens/                       ${'// the shared source of truth'}
    src/
      tokens.ts                 ${'// primitives + themes + adapters'}
      index.ts
      ThemeProvider.tsx
      ThemeProvider.native.tsx  ${'// Metro picks .native by default'}
    package.json                ${'// name: "@is/tokens"'}

  ui/                           ${'// platform-agnostic primitives'}
    src/
      Button.tsx
      Button.native.tsx
      …
    package.json                ${'// name: "@is/ui"'}

apps/
  web/                          ${'// Vite + React'}
    src/main.tsx
    vite.config.ts
  mobile/                       ${'// Expo'}
    app/_layout.tsx
    app.json`}</Code>
    </Sub>

    <Sub title="Web · React Vite">
      <Code tag="React · Vite">{`${'// apps/web/src/main.tsx'}
${'import'} React ${'from'} "react";
${'import'} ReactDOM ${'from'} "react-dom/client";
${'import'} { ThemeProvider } ${'from'} "@is/tokens";
${'import'} App ${'from'} "./App";
${'import'} "@is/tokens/dist/css/index.css";  ${'// injects CSS vars'}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);`}</Code>
    </Sub>

    <Sub title="Native · Expo">
      <Code tag="Expo · React Native">{`${'// apps/mobile/app/_layout.tsx'}
${'import'} { Stack } ${'from'} "expo-router";
${'import'} { ThemeProvider } ${'from'} "@is/tokens";
${'import'} { useColorScheme } ${'from'} "react-native";
${'import'} { useFonts } ${'from'} "expo-font";

${'export default function'} RootLayout() {
  ${'const'} scheme = useColorScheme();   ${'// "light" | "dark"'}
  ${'const'} [loaded] = useFonts({
    Cinzel:                require("../assets/fonts/Cinzel.ttf"),
    CormorantGaramond:     require("../assets/fonts/CormorantGaramond.ttf"),
    CormorantGaramondItalic: require("../assets/fonts/CormorantGaramond-Italic.ttf"),
    Inter:                 require("../assets/fonts/Inter.ttf"),
    JetBrainsMono:         require("../assets/fonts/JetBrainsMono.ttf"),
  });
  ${'if'} (!loaded) ${'return null'};

  ${'return'} (
    <ThemeProvider defaultTheme={scheme ?? "light"}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}`}</Code>
    </Sub>

    <Sub title="ThemeProvider — both platforms">
      <div className="code-pair">
        <Code tag="ThemeProvider.tsx · web">{`${'import'} React, { createContext, useContext, useState, useEffect } ${'from'} "react";
${'import'} { themes, themeToCSSVars, ThemeName } ${'from'} "./tokens";

${'const'} Ctx = createContext({ theme: "light", setTheme: (_: ThemeName) => {} });

${'export const'} ThemeProvider = ({ children, defaultTheme = "light" }) => {
  ${'const'} [theme, setTheme] = useState<ThemeName>(defaultTheme);
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    ${'const'} vars = themeToCSSVars(themes[theme]);
    Object.entries(vars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v));
  }, [theme]);
  ${'return'} <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
};

${'export const'} useTheme = () => themes[useContext(Ctx).theme];`}</Code>

        <Code tag="ThemeProvider.native.tsx">{`${'import'} React, { createContext, useContext, useState } ${'from'} "react";
${'import'} { themes, ThemeName } ${'from'} "./tokens";

${'const'} Ctx = createContext({ theme: "light", setTheme: (_: ThemeName) => {} });

${'export const'} ThemeProvider = ({ children, defaultTheme = "light" }) => {
  ${'const'} [theme, setTheme] = useState<ThemeName>(defaultTheme);
  ${'return'} <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
};

${'// useTheme returns the resolved theme object — exact same'}
${'// shape as web, so component code is platform-agnostic.'}
${'export const'} useTheme = () => themes[useContext(Ctx).theme];`}</Code>
      </div>
    </Sub>
  </Section>
);

// ===================== FILE STRUCTURE =====================
const StructureSection = () => (
  <Section id="structure" num="21" eyebrow="Engineering"
           title="File Structure"
           desc="What ships with the design system package, and what each app brings.">

    <Sub title="What @is/tokens exports">
      <table className="tok-table">
        <thead><tr><th>Export</th><th>Shape</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td className="token">palette</td><td className="val">{`{ paper, navy, ink, cream, gold, sage, status }`}</td><td className="desc">Raw primitives</td></tr>
          <tr><td className="token">themes</td><td className="val">{`{ light: Theme, dark: Theme }`}</td><td className="desc">Semantic role map</td></tr>
          <tr><td className="token">space</td><td className="val">{`{ s1…s10 }`}</td><td className="desc">4pt scale</td></tr>
          <tr><td className="token">radius</td><td className="val">{`{ none, xs, sm, md, lg, full }`}</td><td className="desc">Corner radii</td></tr>
          <tr><td className="token">type</td><td className="val">{`{ family, size, weight, leading, tracking }`}</td><td className="desc">Type system</td></tr>
          <tr><td className="token">shadow</td><td className="val">{`{ sm, md, lg }`}</td><td className="desc">Elevation primitives</td></tr>
          <tr><td className="token">motion</td><td className="val">{`{ easing, duration }`}</td><td className="desc">Animation curves</td></tr>
          <tr><td className="token">z</td><td className="val">{`{ base…max }`}</td><td className="desc">Z-index scale</td></tr>
          <tr><td className="token">breakpoint</td><td className="val">{`{ sm, md, lg, xl, 2xl }`}</td><td className="desc">Responsive cuts</td></tr>
          <tr><td className="token">shadowToCSS()</td><td className="val">(k) ⇒ string</td><td className="desc">Web box-shadow string</td></tr>
          <tr><td className="token">shadowToRN()</td><td className="val">(k) ⇒ object</td><td className="desc">RN shadow + elevation</td></tr>
          <tr><td className="token">themeToCSSVars()</td><td className="val">(theme) ⇒ vars</td><td className="desc">Per-theme CSS variable block</td></tr>
          <tr><td className="token">trackingToRN()</td><td className="val">(size, key) ⇒ dp</td><td className="desc">letterSpacing dp converter</td></tr>
          <tr><td className="token">useTheme()</td><td className="val">() ⇒ Theme</td><td className="desc">Resolved theme object hook</td></tr>
          <tr><td className="token">ThemeProvider</td><td className="val">React.FC</td><td className="desc">App-root provider, web + native</td></tr>
        </tbody>
      </table>
    </Sub>

    <Sub title="Conditional imports — Metro & Vite">
      <Code tag="@is/tokens · package.json">{`{
  "name": "@is/tokens",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "react-native": "./dist/index.native.js",
      "default":      "./dist/index.js"
    },
    "./css": "./dist/css/index.css"
  },
  "peerDependencies": {
    "react":      ">=18",
    "react-dom":  ">=18",
    "react-native": ">=0.74"
  }
}`}</Code>
      <div className="ds-sub-desc" style={{ marginTop: 16 }}>
        Metro auto-picks <code style={{ color: "var(--gold-300)" }}>.native.js</code> · Vite uses the default entry. Same import path, both platforms.
      </div>
    </Sub>

    <Sub title="Compliance matrix">
      <div className="matrix">
        <div className="matrix-cell h">Token / Concern</div>
        <div className="matrix-cell h">React · Vite (web)</div>
        <div className="matrix-cell h">Expo · React Native</div>

        <div className="matrix-cell">Color</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>CSS vars via data-theme</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>useTheme() hook</small></div>

        <div className="matrix-cell">Typography</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>Google Fonts CDN</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>expo-font + .ttf bundled</small></div>

        <div className="matrix-cell">Spacing</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>px values</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>dp values (1:1)</small></div>

        <div className="matrix-cell">Radii</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>border-radius</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>borderRadius</small></div>

        <div className="matrix-cell">Shadows</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>shadowToCSS()</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>shadowToRN() + elevation</small></div>

        <div className="matrix-cell">Motion</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>CSS transitions</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>Animated + Easing.bezier</small></div>

        <div className="matrix-cell">Icons</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>inline {`<svg>`}</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>react-native-svg</small></div>

        <div className="matrix-cell">Theme swap</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>data-theme attribute</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>useColorScheme()</small></div>

        <div className="matrix-cell">Backdrop blur</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>backdrop-filter</small></div>
        <div className="matrix-cell"><span className="partial">≈ Use BlurView</span><small>expo-blur</small></div>

        <div className="matrix-cell">Letter-spacing</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>em units</small></div>
        <div className="matrix-cell"><span className="yes">✓ Via helper</span><small>trackingToRN(size, key)</small></div>

        <div className="matrix-cell">Form inputs</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>native HTML</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>TextInput / Picker / DateTimePicker</small></div>

        <div className="matrix-cell">Image grid</div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>CSS grid</small></div>
        <div className="matrix-cell"><span className="yes">✓ Full</span><small>FlatList numColumns</small></div>
      </div>
    </Sub>
  </Section>
);

// ===================== CHECKLIST =====================
const ChecklistSection = () => (
  <Section id="checklist" num="22" eyebrow="Engineering"
           title="Handoff Checklist"
           desc="What Claude Code should verify before declaring the system live.">

    <div className="panel">
      {[
        ["01", "tokens.ts compiles with no any references to raw palette in app code"],
        ["02", "ThemeProvider mounted at root of web AND native apps"],
        ["03", "Theme swap works in both apps · light ↔ dark, no flash"],
        ["04", "All five font families load — Cinzel, Cormorant Garamond, Cormorant Italic, Inter, JetBrains Mono"],
        ["05", "Button hit-targets ≥ 44 dp on native"],
        ["06", "Input focus border = brand.gold, never browser default"],
        ["07", "Gallery grid uses gap (not margin) for spacing"],
        ["08", "AI bubble carries 'Luma · AI' eyebrow label"],
        ["09", "Modal backdrop uses scrim token + blur fallback"],
        ["10", "Session tokens stored in expo-secure-store on native, httpOnly cookie on web"],
        ["11", "Storybook (web) + Expo Storybook entries exist for every primitive"],
        ["12", "Visual regression run against this page on every PR"],
      ].map(r => (
        <div className="anchor-row" key={r[0]}>
          <span className="num">{r[0]}</span>
          <Icon name="check" size={14} stroke={2} />
          <span className="desc" style={{ flex: 1 }}>{r[1]}</span>
        </div>
      ))}
    </div>

    <div style={{ height: 24 }} />

    <Code tag="Verify · single command">{`pnpm -F @is/tokens build  ${'# emits dist/index.js + dist/index.native.js + dist/css/index.css'}
pnpm -F web      dev      ${'# Vite on :5173 — sanity-check theme swap'}
pnpm -F mobile   start    ${'# Expo on iOS sim + Android — sanity-check theme swap'}
pnpm test                 ${'# token snapshots + accessibility checks'}`}</Code>
  </Section>
);

Object.assign(window, {
  HandoffSection, StructureSection, ChecklistSection,
});
