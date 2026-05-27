/* eslint-disable */
// ============================================================
// DS-PATTERNS — gallery, chat, booking, auth
// ============================================================

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80",
  "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=800&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=800&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80",
];

// ===================== GALLERY GRID =====================
const GallerySection = () => {
  const [view, setView] = useState("grid"); // grid | film

  return (
    <Section id="gallery" num="16" eyebrow="Patterns"
             title="Gallery Grid"
             desc="The core artifact. Two view modes: masonry grid for browsing, filmstrip for selecting hero images. Image cards never get rounded corners — photos are the system's most precious surface.">

      <Sub title="Live preview">
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24,
                        alignItems: "center" }}>
            <div>
              <div className="eyebrow">— Engagement</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22,
                            letterSpacing: "0.04em", textTransform: "uppercase",
                            marginTop: 8 }}>
                Eleanor & James · 142 images
              </div>
            </div>
            <div className="platform-tabs">
              <button className={"platform-tab " + (view === "grid" ? "active" : "")}
                      onClick={() => setView("grid")}>Grid</button>
              <button className={"platform-tab " + (view === "film" ? "active" : "")}
                      onClick={() => setView("film")}>Film</button>
            </div>
          </div>

          {view === "grid" ? (
            <div style={{ display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {PLACEHOLDERS.map((src, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: i % 5 === 0 ? "3/4" : "1/1",
                                      overflow: "hidden", gridRow: i === 2 ? "span 2" : "auto",
                                      cursor: "pointer" }}
                     onMouseEnter={e => e.currentTarget.firstChild.style.transform = "scale(1.03)"}
                     onMouseLeave={e => e.currentTarget.firstChild.style.transform = "scale(1)"}>
                  <img src={src} alt=""
                       style={{ width: "100%", height: "100%", objectFit: "cover",
                                transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)" }} />
                  <div style={{ position: "absolute", top: 10, right: 10,
                                background: "rgba(0,0,0,0.55)", color: "var(--gold-200)",
                                padding: "4px 8px", fontSize: 10, letterSpacing: "0.2em",
                                textTransform: "uppercase", fontWeight: 500,
                                display: i % 3 === 0 ? "block" : "none" }}>
                    Favourite
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {PLACEHOLDERS.map((src, i) => (
                <img key={i} src={src} alt=""
                     style={{ height: 160, aspectRatio: "3/4", objectFit: "cover",
                              flexShrink: 0, opacity: i === 1 ? 1 : 0.55,
                              outline: i === 1 ? "2px solid var(--gold-300)" : "none" }} />
              ))}
            </div>
          )}
        </div>
      </Sub>

      <Sub title="Cross-platform usage">
        <div className="code-pair">
          <Code tag="React · Vite">{`${'import'} { GalleryGrid } ${'from'} "@is/ui";

<GalleryGrid
  images={images}
  view="grid"
  onSelect={img => …}
/>

${'/* CSS grid + gap 4px '}
${' * Web overrides hover scale */'}`}</Code>

          <Code tag="Expo · React Native">{`${'import'} { FlatList, Image, Pressable } ${'from'} "react-native";
${'import'} { useTheme } ${'from'} "@is/tokens";

<FlatList data={images}
  numColumns={2}
  columnWrapperStyle={{ gap: 4 }}
  contentContainerStyle={{ gap: 4 }}
  renderItem={({ item }) => (
    <Pressable onPress={() => select(item)}>
      <Image source={{ uri: item.uri }}
             style={{ width: w / 2 - 6, aspectRatio: 1 }} />
    </Pressable>
  )}
/>`}</Code>
        </div>
      </Sub>
    </Section>
  );
};

// ===================== CHAT / AI =====================
const ChatSection = () => {
  const [draft, setDraft] = useState("");
  const messages = [
    { role: "ai",     text: "Hello — I'm Luma, the studio's booking assistant. I can hold a date, share package details, or pass you straight to Victoria. What can I help you with?" },
    { role: "user",   text: "We're getting married 28 October in the Adelaide Hills. Are you available?" },
    { role: "ai",     text: "October 28 is still open — let me hold it provisionally for 24 hours while I gather a few details. Have you had an engagement session before?" },
    { role: "user",   text: "No, this would be our first." },
    { role: "ai-typing" },
  ];

  return (
    <Section id="chat" num="17" eyebrow="Patterns"
             title="Chat & AI Assistant"
             desc="Two bubble styles — user (right, gold-tinted) and AI (left, soft surface with subtle assistant badge). Same component handles both human and AI threads.">

      <Sub title="Live preview">
        <div className="panel" style={{ padding: 0, maxWidth: 720 }}>
          {/* header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--ink-400)",
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999,
                            background: "var(--gold-fill-grad)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--ink-050)" }}>
                <Icon name="sparkle" size={16}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--bone-100)" }}>Luma</div>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
                              color: "var(--bone-400)" }}>
                  Booking Assistant · AI
                </div>
              </div>
            </div>
            <span className="badge badge-sage">Online</span>
          </div>

          {/* thread */}
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14,
                        maxHeight: 420, overflowY: "auto" }}>
            {messages.map((m, i) =>
              m.role === "ai-typing" ? (
                <div key={i} style={{ alignSelf: "flex-start", display: "flex", gap: 6,
                                      padding: "10px 14px",
                                      background: "var(--ink-200)",
                                      borderRadius: "12px 12px 12px 2px",
                                      border: "1px solid var(--ink-400)" }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: 999,
                                          background: "var(--gold-300)", opacity: 0.5,
                                          animation: `pulse-gold 1.4s ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              ) : (
                <div key={i} style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  background: m.role === "user" ? "rgba(168,136,79,0.12)" : "var(--ink-200)",
                  border: `1px solid ${m.role === "user" ? "rgba(168,136,79,0.35)" : "var(--ink-400)"}`,
                  color: "var(--bone-100)",
                  padding: "12px 16px", fontSize: 14, lineHeight: 1.55,
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                }}>
                  {m.role === "ai" && (
                    <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase",
                                  color: "var(--gold-300)", fontWeight: 600, marginBottom: 4 }}>
                      Luma · AI
                    </div>
                  )}
                  {m.text}
                </div>
              )
            )}
          </div>

          {/* composer */}
          <div style={{ borderTop: "1px solid var(--ink-400)", padding: 16,
                        display: "flex", gap: 12, alignItems: "center" }}>
            <input className="input"
                   placeholder="Ask Luma a question…"
                   value={draft}
                   onChange={e => setDraft(e.target.value)}
                   style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm"
                    onClick={() => setDraft("")}>
              Send <Icon name="arrow" size={12}/>
            </button>
          </div>
        </div>
      </Sub>

      <Sub title="Bubble anatomy">
        <table className="tok-table">
          <thead><tr><th>Element</th><th>User bubble</th><th>AI bubble</th></tr></thead>
          <tbody>
            <tr><td className="token">background</td><td className="val">brand.goldMuted</td><td className="val">surface.inset</td></tr>
            <tr><td className="token">border</td><td className="val">brand.gold · 0.35α</td><td className="val">border.subtle</td></tr>
            <tr><td className="token">corner clip</td><td className="val">12 12 2 12</td><td className="val">12 12 12 2</td></tr>
            <tr><td className="token">label</td><td className="val">— none —</td><td className="val">Luma · AI eyebrow</td></tr>
            <tr><td className="token">max-width</td><td className="val">78%</td><td className="val">78%</td></tr>
          </tbody>
        </table>
      </Sub>
    </Section>
  );
};

// ===================== BOOKING FORM =====================
const BookingSection = () => (
  <Section id="booking" num="18" eyebrow="Patterns"
           title="Booking Request Form"
           desc="Multi-step on mobile, single-page on desktop. The form is the studio's first impression — every field reads like a hand-written question.">

    <div className="compare">
      <div>
        <div className="eyebrow">Composition</div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "12px 0 16px",
                     letterSpacing: "0.04em", textTransform: "uppercase" }}>
          A quiet questionnaire
        </h4>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15,
                      color: "var(--bone-300)", lineHeight: 1.65, marginBottom: 24 }}>
          Use the serif voice for the question itself. The label sits below, in capitals — small,
          informational. The submit button never says "Submit"; it names the action.
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0,
                     fontSize: 12, color: "var(--bone-200)", lineHeight: 1.9 }}>
          <li>· Question above, label below</li>
          <li>· Inputs full-width on mobile</li>
          <li>· No required-field asterisks — validate on blur</li>
          <li>· Final CTA names the outcome</li>
        </ul>
      </div>

      <div className="panel">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic",
                          color: "var(--bone-100)", lineHeight: 1.3, marginBottom: 10 }}>
              What kind of day are we capturing?
            </div>
            <select className="select" defaultValue="engagement">
              <option>Wedding</option>
              <option value="engagement">Engagement</option>
              <option>Portrait</option>
              <option>Editorial</option>
            </select>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic",
                          color: "var(--bone-100)", lineHeight: 1.3, marginBottom: 10 }}>
              When does it happen?
            </div>
            <input className="input" defaultValue="28 October 2025" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic",
                          color: "var(--bone-100)", lineHeight: 1.3, marginBottom: 10 }}>
              Anything we should know?
            </div>
            <textarea className="textarea" rows="3"
                      placeholder="Tell us about the day, the place, the feeling…" />
          </div>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
            Send Inquiry to Victoria <Icon name="arrow" size={14}/>
          </button>
        </div>
      </div>
    </div>
  </Section>
);

// ===================== AUTH & TOKENS =====================
const AuthSection = () => (
  <Section id="auth" num="19" eyebrow="Patterns"
           title="Auth & Tokens"
           desc="Two roles, one auth surface. Admin invites clients by adding them to Contacts — this generates a single-use access token; clients sign in once and receive a long-lived session.">

    <Sub title="Token issuance flow">
      <div className="panel">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 24, alignItems: "start" }}>
          {[
            { n: "01", t: "Admin adds contact", d: "Victoria adds Eleanor in Admin · Contacts." },
            { n: "02", t: "Token generated",    d: "Server creates one-time invite token, 7-day TTL." },
            { n: "03", t: "Client receives invite", d: "Email with magic link · auto-fills credentials." },
            { n: "04", t: "Session issued",     d: "On first sign-in, swap invite for a 30-day session JWT." },
          ].map(s => (
            <div key={s.n}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11,
                            color: "var(--gold-400)", marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                            color: "var(--bone-100)", marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic",
                            fontSize: 13, color: "var(--bone-300)", lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </Sub>

    <Sub title="Storage & expiry">
      <table className="tok-table">
        <thead><tr><th>Token</th><th>TTL</th><th>Storage (Web)</th><th>Storage (Native)</th></tr></thead>
        <tbody>
          <tr><td className="token">invite</td><td className="val">7d</td><td className="val">URL param only</td><td className="val">URL param only</td></tr>
          <tr><td className="token">session</td><td className="val">30d</td><td className="val">httpOnly cookie</td><td className="val">expo-secure-store</td></tr>
          <tr><td className="token">refresh</td><td className="val">90d</td><td className="val">httpOnly cookie</td><td className="val">expo-secure-store</td></tr>
        </tbody>
      </table>
    </Sub>

    <Sub title="Shared auth hook">
      <Code tag="Shared · auth.ts (web + native)">{`${'import'} { storage } ${'from'} "./storage";   ${'// platform-shimmed'}

${'export async function'} signIn(email, password) {
  ${'const'} res = ${'await'} api.post("/auth/sign-in", { email, password });
  ${'await'} storage.set("session", res.token);
  ${'return'} res.user;
}

${'/* storage.ts (web) */'}
${'export const'} storage = {
  set: (k, v) => (document.cookie = ${'`'}${'${k}=${v}; Secure; HttpOnly'}${'`'}),
  get: async (k) => fetch("/api/me").then(r => r.json()),
};

${'/* storage.native.ts — Expo */'}
${'import'} * ${'as'} SecureStore ${'from'} "expo-secure-store";
${'export const'} storage = {
  set: (k, v) => SecureStore.setItemAsync(k, v),
  get: (k) => SecureStore.getItemAsync(k),
};`}</Code>
    </Sub>
  </Section>
);

Object.assign(window, {
  GallerySection, ChatSection, BookingSection, AuthSection,
});
