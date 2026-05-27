/* eslint-disable */
// ============================================================
// ADMIN TWEAKS — applies user-controlled style overrides to the
// admin portal only. Defaults aim for a cleaner business look:
// near-white surface, deep-navy + black text, gold reserved
// strictly for accents.
// ============================================================

// --- Style preset maps ---------------------------------------
const BG_TONES = {
  crisp: {   // near-white surfaces on faintly warm paper — best for admin
    "--ink-050": "#fafaf8",   // page bg, almost white
    "--ink-100": "#ffffff",   // card surface, pure white
    "--ink-200": "#f5f1e8",   // accent surface
    "--ink-300": "#ebe3cf",
    "--ink-400": "#c8b88e",   // borders strong enough to read
    "--ink-500": "#9a8859",
    "--ink-600": "#6a5a37",
  },
  cool: {    // cool grey/white, clinical
    "--ink-050": "#fafbfc",
    "--ink-100": "#ffffff",
    "--ink-200": "#f1f4f7",
    "--ink-300": "#e1e7ed",
    "--ink-400": "#b8c2cc",
    "--ink-500": "#7a8896",
    "--ink-600": "#4a5666",
  },
  cream: {   // warmer cream paper, matches client portal
    "--ink-050": "#f5efe0",
    "--ink-100": "#ffffff",
    "--ink-200": "#fbf6ea",
    "--ink-300": "#ede2c8",
    "--ink-400": "#c8b88e",
    "--ink-500": "#9a8859",
    "--ink-600": "#6a5a37",
  },
};

const TEXT_STYLES = {
  navy: {
    "--bone-050": "#0e1a2e",   // deep navy primary
    "--bone-100": "#1a2540",
    "--bone-200": "#3a4659",
    "--bone-300": "#647084",
    "--bone-400": "#8e95a3",
    "--bone-500": "#b0b8c4",
  },
  black: {
    "--bone-050": "#0a0a0a",
    "--bone-100": "#1a1a1a",
    "--bone-200": "#3a3a3a",
    "--bone-300": "#6a6a6a",
    "--bone-400": "#9a9a9a",
    "--bone-500": "#c4c4c4",
  },
  mixed: {   // navy headings, black body (set on bone-050 = body)
    "--bone-050": "#1a1f2e",
    "--bone-100": "#0e1a2e",   // deep navy for h headings (bone-100 is used in lockup)
    "--bone-200": "#2a3242",
    "--bone-300": "#6e7384",
    "--bone-400": "#9099a8",
    "--bone-500": "#b0b8a8",
  },
};

const GOLD_INTENSITY = {
  subtle: {
    "--gold-100": "#c9a96e",
    "--gold-200": "#b8956a",
    "--gold-300": "#a08055",   // softer accent
    "--gold-400": "#8a6f3e",
    "--gold-500": "#5e4a24",
  },
  standard: {
    "--gold-100": "#b8956a",
    "--gold-200": "#a8884f",
    "--gold-300": "#8a6f3e",   // matches contracts
    "--gold-400": "#6e572e",
    "--gold-500": "#4a3a1e",
  },
  bold: {
    "--gold-100": "#d4b87a",
    "--gold-200": "#c9a96e",
    "--gold-300": "#a8884f",   // a touch more saturated
    "--gold-400": "#826737",
    "--gold-500": "#5a481f",
  },
};

const DENSITY = {
  compact: { "--s-5": "16px", "--s-6": "20px", "--s-7": "32px", "--s-8": "40px" },
  regular: {},
};

// Compute the inline-style object for a given tweak state
function adminTweakStyles(t) {
  const bg = BG_TONES[t.adminBgTone] || BG_TONES.crisp;
  const text = TEXT_STYLES[t.adminTextStyle] || TEXT_STYLES.navy;
  const gold = GOLD_INTENSITY[t.adminGoldIntensity] || GOLD_INTENSITY.standard;
  const density = DENSITY[t.adminDensity] || DENSITY.regular;

  // Optional fully custom accent hue, overrides gold-300
  const extra = (t.adminAccentHue && t.adminAccentHue !== "#8a6f3e")
    ? { "--gold-300": t.adminAccentHue }
    : {};

  // Re-derive gold gradients to match the chosen palette
  const gradient = {
    "--gold-text-grad": `linear-gradient(180deg, ${gold["--gold-200"]} 0%, ${gold["--gold-300"]} 50%, ${gold["--gold-500"]} 100%)`,
    "--gold-fill-grad": `radial-gradient(120% 80% at 30% 30%, ${gold["--gold-100"]}66, transparent 60%),
                          linear-gradient(135deg, ${gold["--gold-100"]} 0%, ${gold["--gold-300"]} 50%, ${gold["--gold-500"]} 100%)`,
  };

  return { ...bg, ...text, ...gold, ...density, ...gradient, ...extra };
}

// ============================================================
// ADMIN TWEAKS PANEL — uses the starter <TweaksPanel> shell
// ============================================================
const AdminTweaksPanel = ({ tweaks, setTweak }) => (
  <TweaksPanel title="Admin Styling">
    <TweakSection label="Surface" />
    <TweakRadio
      label="Background"
      value={tweaks.adminBgTone}
      options={["crisp", "cool", "cream"]}
      onChange={v => setTweak("adminBgTone", v)}
    />
    <TweakRadio
      label="Density"
      value={tweaks.adminDensity}
      options={["compact", "regular"]}
      onChange={v => setTweak("adminDensity", v)}
    />

    <TweakSection label="Type" />
    <TweakRadio
      label="Text Style"
      value={tweaks.adminTextStyle}
      options={["navy", "black", "mixed"]}
      onChange={v => setTweak("adminTextStyle", v)}
    />

    <TweakSection label="Accent" />
    <TweakRadio
      label="Gold Intensity"
      value={tweaks.adminGoldIntensity}
      options={["subtle", "standard", "bold"]}
      onChange={v => setTweak("adminGoldIntensity", v)}
    />
    <TweakColor
      label="Accent Hue"
      value={tweaks.adminAccentHue}
      options={["#8a6f3e", "#a8884f", "#c9a96e", "#1f3a5f", "#2a2a2a"]}
      onChange={v => setTweak("adminAccentHue", v)}
    />
  </TweaksPanel>
);

Object.assign(window, { adminTweakStyles, AdminTweaksPanel });
