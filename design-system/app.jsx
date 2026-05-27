/* eslint-disable */

// ============================================================
// AUTH SCREEN — minimal, dark, two roles
// ============================================================
const SignInScreen = ({ role, onSignIn, onBack }) => {
  const [email, setEmail] = useState(role === "client" ? "eleanor.whitfield@hey.com" : "victoria@illuminatestudios.com.au");
  const [pass, setPass]   = useState("•••••••••");
  const [pending, setPending] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    setPending(true);
    setTimeout(() => { setPending(false); onSignIn(); }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left — visual */}
      <div style={{
        background: `linear-gradient(180deg, rgba(5,5,5,0.5), rgba(5,5,5,0.85)),
                     url(https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80) center/cover`,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px",
      }}>
        <LogoLockup scale={1} />
        <div>
          <div className="eyebrow">— A private studio</div>
          <h2 className="display" style={{ fontSize: 56, lineHeight: 1, margin: "20px 0 0", letterSpacing: "0.06em" }}>
            Your story,<br/>
            <span className="serif-italic gold-text" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>quietly kept.</span>
          </h2>
          <div style={{ marginTop: 40, fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--bone-200)", maxWidth: 460, fontStyle: "italic" }}>
            "They moved through the day like they weren't even there — and yet every frame is a memory I didn't know I'd want to keep."
          </div>
          <div className="label-sm" style={{ marginTop: 20 }}>Sienna & Hamish · 2025</div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ background: "var(--ink-050)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <button onClick={onBack} style={{ color: "var(--bone-300)", fontSize: 11, letterSpacing: "0.24em",
                                            textTransform: "uppercase", marginBottom: 40 }}>
            ← Back to site
          </button>
          <div className="eyebrow">— {role === "client" ? "Client Portal" : "Studio Admin"}</div>
          <h1 className="display" style={{ fontSize: 36, margin: "16px 0 8px", lineHeight: 1.1 }}>
            Welcome <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>back.</span>
          </h1>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--bone-300)", marginBottom: 40, fontStyle: "italic" }}>
            {role === "client"
              ? "Sign in to view your gallery, documents and correspondence."
              : "Sign in to manage bookings, inquiries and clients."}
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="field-label">Email</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="input" value={pass} onChange={e => setPass(e.target.value)} type="password" autoComplete="current-password" />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={pending} style={{ marginTop: 12 }}>
              {pending ? "Signing in…" : <>Sign in <Icon name="arrow" size={14} /></>}
            </button>
          </form>

          <div className="hairline" style={{ margin: "32px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--bone-400)" }}>
            <a style={{ cursor: "pointer" }}
               onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
               onMouseLeave={e => e.currentTarget.style.color = "var(--bone-400)"}>Forgot password</a>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Demo credentials prefilled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// APP — top-level router
// ============================================================
const App = () => {
  // route: "landing" | "signin-client" | "signin-admin" | "client" | "admin"
  const [route, setRoute] = useState(() => localStorage.getItem("is_route") || "landing");
  const [clientState, setClientState] = useState(() =>
    JSON.parse(localStorage.getItem("is_client") || "null") || window.CLIENT_INITIAL);

  // Admin styling tweaks
  const [tweaks, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  useEffect(() => { localStorage.setItem("is_route", route); }, [route]);
  useEffect(() => { localStorage.setItem("is_client", JSON.stringify(clientState)); }, [clientState]);

  // Compute admin-only style overrides from tweak state
  const adminStyleOverrides = useMemo(
    () => window.adminTweakStyles(tweaks),
    [tweaks]
  );

  return (
    <ThemeProvider>
    <ToastProvider>
      <div className="grain" />

      {/* Floating utility — demo controls so user can reset, jump roles */}
      <DemoControls route={route} setRoute={setRoute}
                    clientState={clientState} setClientState={setClientState} />

      {route === "landing" && (
        <Landing
          onSignIn={() => setRoute("signin-client")}
          onAdminSignIn={() => setRoute("signin-admin")}
        />
      )}
      {route === "signin-client" && (
        <SignInScreen role="client"
                      onSignIn={() => setRoute("client")}
                      onBack={() => setRoute("landing")} />
      )}
      {route === "signin-admin" && (
        <SignInScreen role="admin"
                      onSignIn={() => setRoute("admin")}
                      onBack={() => setRoute("landing")} />
      )}
      {route === "client" && (
        <ClientPortal onSignOut={() => setRoute("landing")}
                      clientState={clientState} setClientState={setClientState} />
      )}
      {route === "admin" && (
        <div style={adminStyleOverrides}>
          <AdminPortal onSignOut={() => setRoute("landing")} />
          <AdminTweaksPanel tweaks={tweaks} setTweak={setTweak} />
        </div>
      )}
    </ToastProvider>
    </ThemeProvider>
  );
};

// ============================================================
// DEMO CONTROLS — small floating panel to jump views and
// flip shoot-delivered state. Lets reviewers explore quickly.
// ============================================================
const DemoControls = ({ route, setRoute, clientState, setClientState }) => {
  const [open, setOpen] = useState(false);

  const reset = () => {
    ["is_route", "is_client", "is_docs", "is_inbox", "is_selected",
     "is_bookings", "is_inquiries", "is_contacts"].forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  return (
    <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 9000 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          background: "rgba(20,20,20,0.92)", backdropFilter: "blur(8px)",
          color: "var(--gold-200)", padding: "10px 14px",
          fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase",
          border: "1px solid var(--gold-500)", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold-300)" }} />
          Prototype Controls
        </button>
      ) : (
        <div style={{
          background: "rgba(15,15,15,0.96)", backdropFilter: "blur(12px)",
          border: "1px solid var(--gold-500)", padding: "16px 18px", width: 280,
          boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold-200)", fontWeight: 600 }}>
              Prototype Controls
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "var(--bone-300)", padding: 2 }}>
              <Icon name="close" size={14} />
            </button>
          </div>

          <div className="label-sm" style={{ marginBottom: 8, fontSize: 9 }}>Jump to view</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 16 }}>
            <DemoBtn label="Landing"  active={route === "landing"}        onClick={() => setRoute("landing")} />
            <DemoBtn label="Sign in"  active={route === "signin-client"}  onClick={() => setRoute("signin-client")} />
            <DemoBtn label="Client"   active={route === "client"}         onClick={() => setRoute("client")} />
            <DemoBtn label="Admin"    active={route === "admin"}          onClick={() => setRoute("admin")} />
          </div>

          <div className="label-sm" style={{ marginBottom: 8, fontSize: 9 }}>Client phase · {window.getPhase(clientState.phaseIdx).label}</div>
          <input type="range" min="0" max={window.PHASES.length - 1} value={clientState.phaseIdx}
                 onChange={e => setClientState(c => ({ ...c, phaseIdx: +e.target.value }))}
                 style={{ width: "100%", accentColor: "var(--gold-300)" }} />
          <div style={{ fontSize: 10, color: "var(--bone-400)", marginTop: 4, fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            Phase ≥ "Gallery Delivered" flips pricing → wall
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ink-500)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <ThemeToggle />
            </div>
            <button onClick={reset} className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
              Reset all state
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DemoBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 10px",
    background: active ? "var(--gold-300)" : "var(--ink-200)",
    color: active ? "var(--ink-050)" : "var(--bone-200)",
    border: `1px solid ${active ? "var(--gold-300)" : "var(--ink-500)"}`,
    fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500,
    transition: "all 200ms",
  }}>{label}</button>
);

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
