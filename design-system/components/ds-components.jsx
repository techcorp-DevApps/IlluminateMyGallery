/* eslint-disable */
// ============================================================
// DS-COMPONENTS — buttons, inputs, badges, cards, modals, nav
// ============================================================

// ===================== BUTTONS =====================
const ButtonsSection = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Section id="buttons" num="10" eyebrow="Components"
             title="Buttons"
             desc="Three variants — primary, ghost, outline-gold — three sizes. Letter-spacing and uppercase are part of the brand; never override them.">

      <Sub title="Variants">
        <div className="preview">
          <button className="btn btn-primary">Reserve a Date</button>
          <button className="btn btn-ghost">View Gallery</button>
          <button className="btn btn-outline-gold">Download <Icon name="download" size={14}/></button>
          <button className="btn btn-primary" disabled>Disabled</button>
        </div>
      </Sub>

      <Sub title="Sizes">
        <div className="preview">
          <button className="btn btn-primary btn-sm">Small</button>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary btn-lg">Large</button>
        </div>
      </Sub>

      <Sub title="Specifications">
        <table className="tok-table">
          <thead>
            <tr><th>Property</th><th>Small</th><th>Default</th><th>Large</th></tr>
          </thead>
          <tbody>
            <tr><td className="token">padding</td><td className="val">9 / 18</td><td className="val">14 / 28</td><td className="val">18 / 40</td></tr>
            <tr><td className="token">font-size</td><td className="val">11</td><td className="val">12</td><td className="val">13</td></tr>
            <tr><td className="token">tracking</td><td className="val">0.18em</td><td className="val">0.24em</td><td className="val">0.24em</td></tr>
            <tr><td className="token">radius</td><td className="val">xs · 2</td><td className="val">xs · 2</td><td className="val">xs · 2</td></tr>
            <tr><td className="token">min hit-target (RN)</td><td className="val">36</td><td className="val">44</td><td className="val">52</td></tr>
          </tbody>
        </table>
      </Sub>

      <Sub title="Cross-platform usage">
        <div className="code-pair">
          <Code tag="React · Vite">{`<button className="btn btn-primary">
  Reserve a Date
</button>

${'/* CSS already in styles.css */'}
.btn-primary {
  background: var(--brand-gold);
  color: var(--ink-inverse);
}`}</Code>

          <Code tag="Expo · React Native">{`${'import'} { Pressable, Text } ${'from'} "react-native";
${'import'} { useTheme, type } ${'from'} "@is/tokens";

${'export const'} Button = ({ children, variant = "primary", onPress }) => {
  ${'const'} t = useTheme();
  ${'const'} styles = variantStyles(t, variant);
  ${'return'} (
    <Pressable onPress={onPress}
               style={({ pressed }) => [
                 styles.base,
                 pressed && { transform: [{ translateY: -1 }] },
               ]}>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
};`}</Code>
        </div>
      </Sub>
    </Section>
  );
};

// ===================== INPUTS & FORMS =====================
const InputsSection = () => (
  <Section id="inputs" num="11" eyebrow="Components"
           title="Inputs & Forms"
           desc="Label-above-input pattern. Focus state is a gold border; never use blue browser defaults.">

    <Sub title="Text · email · password">
      <div className="preview column">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <label className="field-label">Full Name</label>
            <input className="input" defaultValue="Eleanor Whitfield" />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" defaultValue="eleanor.whitfield@hey.com" />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="input" placeholder="+61 …" />
          </div>
          <div>
            <label className="field-label">Shoot Date</label>
            <input className="input" type="text" defaultValue="03 November 2025" />
          </div>
        </div>
      </div>
    </Sub>

    <Sub title="Select · textarea">
      <div className="preview column">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
          <div>
            <label className="field-label">Session Type</label>
            <select className="select" defaultValue="engagement">
              <option value="engagement">Engagement</option>
              <option>Wedding</option>
              <option>Portrait</option>
              <option>Editorial</option>
            </select>
          </div>
          <div>
            <label className="field-label">Notes for the studio</label>
            <textarea className="textarea" rows="3" defaultValue="We'd love something soft, golden hour, near the coast." />
          </div>
        </div>
      </div>
    </Sub>

    <Sub title="Cross-platform usage">
      <div className="code-pair">
        <Code tag="React · Vite">{`<label className="field-label">Email</label>
<input className="input" type="email" />

${'/* :focus → border-color: var(--brand-gold) */'}`}</Code>

        <Code tag="Expo · React Native">{`${'import'} { TextInput } ${'from'} "react-native";
${'import'} { useTheme, type, radius } ${'from'} "@is/tokens";

${'export const'} Input = (props) => {
  ${'const'} t = useTheme();
  ${'const'} [focus, setFocus] = useState(false);
  ${'return'} (
    <TextInput {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        backgroundColor: t.surface.raised,
        borderColor: focus ? t.border.gold : t.border.default,
        borderWidth: 1, borderRadius: radius.xs,
        paddingVertical: 12, paddingHorizontal: 14,
        color: t.ink.primary, fontSize: type.size.base,
      }}
      placeholderTextColor={t.ink.tertiary}
    />
  );
};`}</Code>
      </div>
    </Sub>
  </Section>
);

// ===================== BADGES =====================
const BadgesSection = () => (
  <Section id="badges" num="12" eyebrow="Components"
           title="Badges & Pills"
           desc="Status communication. Always uppercase, always tracked. Never carry primary content — they label it.">
    <div className="preview">
      <span className="badge badge-gold">Featured</span>
      <span className="badge badge-success"><Icon name="check" size={10}/> Confirmed</span>
      <span className="badge badge-info">Inquiry</span>
      <span className="badge badge-muted">Draft</span>
      <span className="badge badge-sage">Gallery Live</span>
    </div>

    <div style={{ height: 24 }} />

    <table className="tok-table">
      <thead><tr><th>Variant</th><th>Use for</th><th>Colors</th></tr></thead>
      <tbody>
        <tr><td className="token">badge-gold</td><td className="desc">Premium · featured · brand-marked</td><td className="val">brand.gold / brand.goldMuted</td></tr>
        <tr><td className="token">badge-success</td><td className="desc">Paid · delivered · confirmed</td><td className="val">status.success</td></tr>
        <tr><td className="token">badge-info</td><td className="desc">New inquiry · neutral state</td><td className="val">status.info</td></tr>
        <tr><td className="token">badge-muted</td><td className="desc">Draft · archived</td><td className="val">surface.inset / ink.tertiary</td></tr>
        <tr><td className="token">badge-sage</td><td className="desc">Non-brand accent · soft positive</td><td className="val">sage 300/400</td></tr>
      </tbody>
    </table>
  </Section>
);

// ===================== CARDS =====================
const CardsSection = () => (
  <Section id="cards" num="13" eyebrow="Components"
           title="Cards"
           desc="Three card styles share padding and radius but carry different weight. Reach for card-gold sparingly — its job is to mark importance.">

    <Sub title="Card variants">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="card">
          <div className="label-sm" style={{ marginBottom: 8 }}>card · default</div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.04em",
                       textTransform: "uppercase", margin: "0 0 8px" }}>Eleanor & James</h4>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                        color: "var(--bone-300)", fontSize: 14 }}>
            Engagement · 03 November 2025
          </div>
        </div>
        <div className="card card-elev">
          <div className="label-sm" style={{ marginBottom: 8 }}>card-elev · elevated</div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.04em",
                       textTransform: "uppercase", margin: "0 0 8px" }}>Sienna & Hamish</h4>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                        color: "var(--bone-300)", fontSize: 14 }}>
            Wedding · 28 October 2025
          </div>
        </div>
        <div className="card card-gold">
          <div className="label-sm" style={{ marginBottom: 8, color: "var(--gold-300)" }}>card-gold · accent</div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.04em",
                       textTransform: "uppercase", margin: "0 0 8px" }}>Heritage Package</h4>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                        color: "var(--bone-300)", fontSize: 14 }}>
            From $7,200 · curated edition
          </div>
        </div>
      </div>
    </Sub>

    <Sub title="Cross-platform usage">
      <Code tag="Expo · React Native">{`${'import'} { useTheme, radius, space } ${'from'} "@is/tokens";

${'export const'} Card = ({ variant = "default", children }) => {
  ${'const'} t = useTheme();
  ${'const'} base = {
    backgroundColor: t.surface.raised,
    borderColor: t.border.subtle,
    borderWidth: 1, borderRadius: radius.sm,
    padding: space.s5,
  };
  ${'const'} style =
    variant === "gold" ? { ...base, borderColor: t.border.gold } :
    variant === "elev" ? { ...base, ...shadowToRN("md") } : base;
  ${'return'} <View style={style}>{children}</View>;
};`}</Code>
    </Sub>
  </Section>
);

// ===================== MODAL & TOAST =====================
const ModalsSection = () => {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <Section id="modals" num="14" eyebrow="Components"
             title="Modals & Toasts"
             desc="Modal: gold-bordered, scrim-darkened, animated in via 'rise' easing. Toast: bottom-right, gold left-border, 4-second auto-dismiss.">

      <Sub title="Live demos">
        <div className="preview">
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            Open Modal
          </button>
          <button className="btn btn-ghost" onClick={() => toast("Booking request sent to Victoria")}>
            Trigger Toast
          </button>
          <button className="btn btn-outline-gold" onClick={() => toast("Gallery delivered · 142 images")}>
            Success Toast
          </button>
        </div>
        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="eyebrow">— Reserve your date</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "12px 0 8px",
                       letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Confirm <span className="serif-italic" style={{ fontFamily: "var(--font-serif)",
                                                            textTransform: "none" }}>booking</span>
          </h3>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                        color: "var(--bone-300)", fontSize: 16, marginBottom: 24 }}>
            A retainer reserves your day exclusively. We'll send the contract within the hour.
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Not yet</button>
            <button className="btn btn-primary" onClick={() => { setOpen(false); toast("Booking confirmed."); }}>
              Confirm & Pay Retainer
            </button>
          </div>
        </Modal>
      </Sub>

      <Sub title="Anatomy">
        <table className="tok-table">
          <thead><tr><th>Element</th><th>Token</th><th>Note</th></tr></thead>
          <tbody>
            <tr><td className="token">backdrop</td><td className="val">scrim · blur(16px)</td><td className="desc">Click to dismiss unless dismissable=false</td></tr>
            <tr><td className="token">border</td><td className="val">border.gold · 1px</td><td className="desc">Brand signature on entry surfaces</td></tr>
            <tr><td className="token">radius</td><td className="val">radius.sm · 4</td><td className="desc">Sharp, editorial</td></tr>
            <tr><td className="token">padding</td><td className="val">space.s8 · 64</td><td className="desc">Generous interior breathing</td></tr>
            <tr><td className="token">animation</td><td className="val">rise 700ms ease-out</td><td className="desc">Slow rise · feels considered</td></tr>
          </tbody>
        </table>
      </Sub>
    </Section>
  );
};

// ===================== NAVIGATION =====================
const NavigationSection = () => {
  const [tab, setTab] = useState("gallery");

  return (
    <Section id="navigation" num="15" eyebrow="Components"
             title="Navigation"
             desc="Web: side nav with gold left-rule active state. Native: bottom tab bar with the same gold rule on top.">

      <Sub title="Side nav · web">
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: 320 }}>
            <div style={{ borderRight: "1px solid var(--ink-400)", padding: "24px 0" }}>
              <div style={{ padding: "0 24px 16px", borderBottom: "1px solid var(--ink-400)" }}>
                <LogoBanner height={22} />
              </div>
              {[
                { ic: "gallery", l: "Gallery",  id: "gallery" },
                { ic: "doc",     l: "Documents",id: "docs" },
                { ic: "inbox",   l: "Messages", id: "inbox" },
                { ic: "user",    l: "Account",  id: "account" },
              ].map(item => (
                <button key={item.id}
                        onClick={() => setTab(item.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "11px 24px", width: "100%",
                          fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
                          fontWeight: 500,
                          color: tab === item.id ? "var(--gold-300)" : "var(--bone-200)",
                          borderLeft: `2px solid ${tab === item.id ? "var(--gold-300)" : "transparent"}`,
                          background: tab === item.id ? "rgba(168,136,79,0.08)" : "transparent",
                          transition: "all 200ms",
                        }}>
                  <Icon name={item.ic} size={16}/>
                  {item.l}
                </button>
              ))}
            </div>
            <div style={{ padding: 32 }}>
              <div className="eyebrow">— {tab}</div>
              <h4 className="display" style={{ fontSize: 28, margin: "12px 0 8px",
                                               letterSpacing: "0.04em" }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </h4>
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                            color: "var(--bone-300)" }}>
                Content area for {tab}. Side nav stays sticky on scroll.
              </div>
            </div>
          </div>
        </div>
      </Sub>

      <Sub title="Bottom tab bar · native">
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <PhoneFrame label="iOS · Expo">
            <div style={{ background: "var(--ink-050)", height: "100%", display: "flex",
                          flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "60px 20px 20px",
                            display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="eyebrow">— My Gallery</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22,
                              letterSpacing: "0.04em", textTransform: "uppercase",
                              color: "var(--bone-050)" }}>
                  Eleanor & James
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                              color: "var(--bone-300)", fontSize: 13 }}>
                  142 images delivered
                </div>
                <div style={{ marginTop: 16, display: "grid",
                              gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ aspectRatio: "1/1.2",
                                          background: "var(--gold-fill-grad)", opacity: 0.6 }} />
                  ))}
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--ink-400)",
                            display: "flex", justifyContent: "space-around",
                            padding: "10px 0 24px", background: "var(--ink-100)" }}>
                {[
                  { ic: "gallery", l: "Gallery", a: true },
                  { ic: "doc",     l: "Docs",    a: false },
                  { ic: "inbox",   l: "Inbox",   a: false },
                  { ic: "user",    l: "You",     a: false },
                ].map(t => (
                  <div key={t.l} style={{ display: "flex", flexDirection: "column",
                                          alignItems: "center", gap: 4,
                                          color: t.a ? "var(--gold-300)" : "var(--bone-400)",
                                          position: "relative", padding: "6px 12px" }}>
                    {t.a && <div style={{ position: "absolute", top: -10,
                                          height: 2, width: 20,
                                          background: "var(--gold-300)" }}/>}
                    <Icon name={t.ic} size={18}/>
                    <div style={{ fontSize: 9, letterSpacing: "0.18em",
                                  textTransform: "uppercase", fontWeight: 500 }}>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </PhoneFrame>

          <div style={{ flex: 1 }}>
            <Code tag="Expo · React Native">{`${'import'} { Tabs } ${'from'} "expo-router";
${'import'} { useTheme } ${'from'} "@is/tokens";

${'export default function'} TabLayout() {
  ${'const'} t = useTheme();
  ${'return'} (
    <Tabs screenOptions={{
      tabBarActiveTintColor:   t.brand.gold,
      tabBarInactiveTintColor: t.ink.tertiary,
      tabBarStyle: {
        backgroundColor: t.surface.raised,
        borderTopColor:  t.border.subtle,
        height: 80, paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 9, letterSpacing: 1.6,
        textTransform: "uppercase", fontWeight: "500",
      },
    }}>
      <Tabs.Screen name="gallery" />
      <Tabs.Screen name="docs" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}`}</Code>
          </div>
        </div>
      </Sub>
    </Section>
  );
};

Object.assign(window, {
  ButtonsSection, InputsSection, BadgesSection, CardsSection,
  ModalsSection, NavigationSection,
});
