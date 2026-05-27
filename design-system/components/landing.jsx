/* eslint-disable */
const landingStyles = {
  hero: {
    minHeight: "100vh",
    background: "var(--ink-050)",
    position: "relative",
    overflow: "hidden",
  },
  heroInner: {
    position: "relative",
    paddingTop: "120px",
    paddingBottom: "80px",
  },
  topnav: {
    position: "absolute", top: 0, left: 0, right: 0,
    padding: "28px 48px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    zIndex: 10,
  },
  navLinks: {
    display: "flex", gap: 40,
    fontFamily: "var(--font-body)",
    fontSize: 11, letterSpacing: "0.28em",
    textTransform: "uppercase", color: "var(--bone-200)",
  },
};

const Landing = ({ onSignIn, onAdminSignIn }) => {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div style={landingStyles.hero}>
      {/* Atmospheric backdrop */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(50% 40% at 70% 30%, rgba(201,169,110,0.10), transparent 60%),
          radial-gradient(40% 30% at 20% 80%, rgba(201,169,110,0.05), transparent 60%)`,
      }} />

      <Topnav onSignIn={onSignIn} onBook={() => setBookingOpen(true)} />

      <div style={landingStyles.heroInner}>
        <HeroSection onBook={() => setBookingOpen(true)} />
        <PortfolioStrip />
        <ExperienceSection />
        <PackagesSection onBook={() => setBookingOpen(true)} />
        <TestimonialSection />
        <BookSection onBook={() => setBookingOpen(true)} />
        <Footer onAdminSignIn={onAdminSignIn} />
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </div>
  );
};

// ============================================================
// TOPNAV
// ============================================================
const Topnav = ({ onSignIn, onBook }) => (
  <div style={landingStyles.topnav}>
    <LogoLockup />
    <div style={landingStyles.navLinks}>
      <a style={{ cursor: "pointer", transition: "color 200ms" }}
         onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
         onMouseLeave={e => e.currentTarget.style.color = "var(--bone-200)"}>Portfolio</a>
      <a style={{ cursor: "pointer", transition: "color 200ms" }}
         onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
         onMouseLeave={e => e.currentTarget.style.color = "var(--bone-200)"}>Experience</a>
      <a style={{ cursor: "pointer", transition: "color 200ms" }}
         onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
         onMouseLeave={e => e.currentTarget.style.color = "var(--bone-200)"}>Investment</a>
      <a style={{ cursor: "pointer", transition: "color 200ms" }}
         onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
         onMouseLeave={e => e.currentTarget.style.color = "var(--bone-200)"}>Journal</a>
    </div>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <ThemeToggle />
      <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Client Portal</button>
      <button className="btn btn-primary btn-sm" onClick={onBook}>Reserve a Date</button>
    </div>
  </div>
);

// ============================================================
// HERO
// ============================================================
const HeroSection = ({ onBook }) => (
  <section style={{
    padding: "80px 48px 120px",
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 80,
    alignItems: "center",
    maxWidth: 1440, margin: "0 auto",
  }}>
    <div className="fade-in">
      <div className="eyebrow" style={{ marginBottom: 32 }}>
        ◆ Est. Melbourne · 2014
      </div>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(48px, 6vw, 88px)",
        lineHeight: 0.95,
        letterSpacing: "0.04em",
        margin: 0,
        textTransform: "uppercase",
        fontWeight: 400,
      }}>
        Weddings,<br/>
        Editorials,<br/>
        <span className="serif-italic gold-text" style={{
          fontFamily: "var(--font-serif)",
          textTransform: "none",
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "0",
        }}>quietly extraordinary.</span>
      </h1>
      <div style={{ marginTop: 40, maxWidth: 460,
                    fontFamily: "var(--font-serif)", fontSize: 19,
                    lineHeight: 1.5, color: "var(--bone-200)" }}>
        A boutique studio for couples and brands who prefer their stories told in light,
        not in noise. Limited dates each season, hand-printed archives, fine-art delivery.
      </div>
      <div style={{ marginTop: 48, display: "flex", gap: 16 }}>
        <button className="btn btn-primary btn-lg" onClick={onBook}>
          Begin <Icon name="arrow" size={14} />
        </button>
        <button className="btn btn-ghost btn-lg">View Portfolio</button>
      </div>

      <div style={{ marginTop: 80, display: "flex", gap: 48, color: "var(--bone-300)" }}>
        <Metric n="280+" label="Weddings honoured" />
        <Metric n="12yr" label="Behind the lens" />
        <Metric n="40" label="Editorial features" />
      </div>
    </div>

    {/* Visual collage */}
    <div style={{ position: "relative", height: 640 }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: "62%", height: "70%",
        backgroundImage: `url(https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80)`,
        backgroundSize: "cover", backgroundPosition: "center",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, width: "55%", height: "55%",
        backgroundImage: `url(https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80)`,
        backgroundSize: "cover", backgroundPosition: "center",
        boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
        border: "1px solid rgba(201,169,110,0.2)",
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "35%", width: 96, height: 96,
        background: "var(--ink-050)", border: "1px solid var(--gold-400)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 6, zIndex: 2,
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11,
                      letterSpacing: "0.2em", color: "var(--gold-200)" }}>SINCE</div>
        <div className="gold-text" style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.1em" }}>MMXIV</div>
      </div>
    </div>
  </section>
);

const Metric = ({ n, label }) => (
  <div>
    <div className="gold-text" style={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: "0.05em" }}>{n}</div>
    <div className="label-sm" style={{ marginTop: 4 }}>{label}</div>
  </div>
);

// ============================================================
// PORTFOLIO STRIP — horizontal scroll feel
// ============================================================
const PortfolioStrip = () => {
  const photos = [
    "1519741497674-611481863552",
    "1465495976277-4387d4b0b4c6",
    "1583939003579-730e3918a45a",
    "1606216794074-735e91aa2c92",
    "1525772764200-be829a350797",
    "1606800052052-a08af7148866",
  ];
  return (
    <section style={{ padding: "100px 0", borderTop: "1px solid var(--ink-400)", borderBottom: "1px solid var(--ink-400)" }}>
      <div style={{ padding: "0 48px", marginBottom: 40 }}>
        <Hairline />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32 }}>
          <div>
            <div className="eyebrow">— Recent Work</div>
            <h2 className="display" style={{ fontSize: 40, margin: "12px 0 0" }}>Selected Frames</h2>
          </div>
          <button className="btn btn-ghost btn-sm">All Portfolio <Icon name="arrow" size={12} /></button>
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 2,
      }}>
        {photos.map((p, i) => (
          <div key={i} style={{
            aspectRatio: i % 3 === 1 ? "3/5" : "4/5",
            backgroundImage: `url(https://images.unsplash.com/photo-${p}?w=600&q=80)`,
            backgroundSize: "cover", backgroundPosition: "center",
            cursor: "pointer", transition: "all 600ms var(--ease-out)",
            filter: "grayscale(0.15)",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "grayscale(0)"; e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = "grayscale(0.15)"; e.currentTarget.style.transform = "scale(1)"; }} />
        ))}
      </div>
    </section>
  );
};

// ============================================================
// EXPERIENCE — process steps
// ============================================================
const ExperienceSection = () => {
  const steps = [
    { n: "01", title: "Enquiry",       text: "A private conversation about your story, your venue, and the feeling you're after." },
    { n: "02", title: "Reservation",   text: "A 30% retainer and signed agreement reserves your date in our limited season calendar." },
    { n: "03", title: "Pre-Production",text: "Mood-boards, location scouts and a pre-shoot consultation, four weeks ahead of the day." },
    { n: "04", title: "The Day",       text: "Discreet, considered coverage. We document — we never direct." },
    { n: "05", title: "Post & Delivery",text: "Hand-edited gallery delivered within six weeks via your private client portal." },
    { n: "06", title: "Heirloom",      text: "Optional fine-art album and archival prints, hand-finished in our Fitzroy bindery." },
  ];
  return (
    <section style={{ padding: "120px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ marginBottom: 80, maxWidth: 720 }}>
        <div className="eyebrow">— The Experience</div>
        <h2 className="display" style={{ fontSize: 56, margin: "12px 0 24px", lineHeight: 1 }}>
          From first letter <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>to final print.</span>
        </h2>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, color: "var(--bone-200)" }}>
          We accept twelve weddings each year. Every client receives the same considered, unhurried experience.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--ink-400)", border: "1px solid var(--ink-400)" }}>
        {steps.map(s => (
          <div key={s.n} style={{ background: "var(--ink-050)", padding: "48px 36px", minHeight: 240 }}>
            <div className="gold-text" style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.3em" }}>{s.n}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "20px 0 16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.title}</div>
            <div style={{ color: "var(--bone-300)", fontSize: 14, lineHeight: 1.6, fontFamily: "var(--font-serif)", fontSize: 16 }}>{s.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================================
// PACKAGES
// ============================================================
const PackagesSection = ({ onBook }) => (
  <section style={{ padding: "80px 48px 120px", maxWidth: 1440, margin: "0 auto" }}>
    <div style={{ marginBottom: 64, textAlign: "center" }}>
      <div className="eyebrow">— Investment</div>
      <h2 className="display" style={{ fontSize: 56, margin: "12px 0 0", lineHeight: 1 }}>
        Three <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>collections.</span>
      </h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
      {window.PACKAGES.map(p => (
        <PackageCard key={p.id} pkg={p} onBook={onBook} />
      ))}
    </div>
    <div style={{ textAlign: "center", marginTop: 48, color: "var(--bone-300)", fontFamily: "var(--font-serif)", fontSize: 16, fontStyle: "italic" }}>
      Travel, additional hours, and bespoke heirloom additions are accommodated by request.
    </div>
  </section>
);

const PackageCard = ({ pkg, onBook }) => (
  <div style={{
    background: pkg.accent ? "linear-gradient(180deg, var(--ink-200), var(--ink-100))" : "var(--ink-100)",
    border: `1px solid ${pkg.accent ? "var(--gold-400)" : "var(--ink-500)"}`,
    padding: "48px 36px",
    position: "relative",
    transition: "all 300ms var(--ease-out)",
  }}>
    {pkg.accent && (
      <div style={{
        position: "absolute", top: -1, right: 24,
        background: "var(--gold-300)", color: "var(--ink-050)",
        padding: "6px 14px", fontSize: 9, letterSpacing: "0.3em", fontWeight: 600,
        textTransform: "uppercase",
      }}>Most Chosen</div>
    )}
    <div className="eyebrow" style={{ color: pkg.accent ? "var(--gold-200)" : "var(--bone-300)" }}>
      Collection {pkg.id === "essentials" ? "I" : pkg.id === "signature" ? "II" : "III"}
    </div>
    <div className={pkg.accent ? "gold-text" : ""} style={{
      fontFamily: "var(--font-display)", fontSize: 36, letterSpacing: "0.1em",
      textTransform: "uppercase", margin: "20px 0 8px",
      color: pkg.accent ? undefined : "var(--bone-050)",
    }}>{pkg.tier}</div>
    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone-300)", fontSize: 15 }}>
      {pkg.duration}
    </div>
    <div style={{ margin: "32px 0", display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 14, color: "var(--bone-300)" }}>from</span>
      <span className="numeric" style={{ fontFamily: "var(--font-display)", fontSize: 44, letterSpacing: "0.04em" }}>
        {pkg.price.toLocaleString("en-AU")}
      </span>
    </div>
    <div className="hairline" style={{ margin: "0 0 24px" }} />
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {pkg.includes.map((inc, i) => (
        <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--bone-100)", fontFamily: "var(--font-serif)", fontSize: 16 }}>
          <span style={{ color: "var(--gold-300)", marginTop: 2 }}>
            <Icon name="check" size={14} />
          </span>
          {inc}
        </li>
      ))}
    </ul>
    <button
      onClick={onBook}
      className={pkg.accent ? "btn btn-primary" : "btn btn-outline-gold"}
      style={{ width: "100%", marginTop: 36 }}>
      Reserve {pkg.tier} <Icon name="arrow" size={12} />
    </button>
  </div>
);

// ============================================================
// TESTIMONIAL
// ============================================================
const TestimonialSection = () => (
  <section style={{ padding: "120px 48px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
    <div style={{ color: "var(--gold-300)", fontFamily: "var(--font-display)", fontSize: 36, marginBottom: 32 }}>
      ❝
    </div>
    <div className="serif-italic" style={{
      fontFamily: "var(--font-serif)", fontStyle: "italic",
      fontSize: 32, lineHeight: 1.35, color: "var(--bone-100)",
      letterSpacing: "0.01em",
    }}>
      They moved through the day like they weren't even there — and yet every frame is a memory I didn't know I'd want to keep. Six months later, we still find new details in the gallery.
    </div>
    <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
      <div style={{ width: 40, height: 1, background: "var(--gold-400)" }} />
      <div className="label-sm">Sienna &amp; Hamish · Mona Farm</div>
      <div style={{ width: 40, height: 1, background: "var(--gold-400)" }} />
    </div>
  </section>
);

// ============================================================
// BOOK CTA SECTION
// ============================================================
const BookSection = ({ onBook }) => (
  <section style={{ padding: "0 48px 120px" }}>
    <div style={{
      maxWidth: 1440, margin: "0 auto",
      background: "var(--sage-300)",
      color: "#fdfbf5",
      padding: "80px 80px",
      display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40, width: 240, height: 240,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "rgba(253,251,245,0.8)" }}>— Reserve a Date</div>
        <h2 className="display" style={{ fontSize: 56, margin: "16px 0 24px", lineHeight: 1, color: "#fdfbf5" }}>
          Limited dates<br/>
          <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none", color: "#fdfbf5" }}>
            for the 2026 season.
          </span>
        </h2>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, color: "rgba(253,251,245,0.85)", maxWidth: 540 }}>
          Begin with a short enquiry. We respond within two working days with availability,
          a recommended collection, and an invitation to a longer conversation.
        </div>
      </div>
      <button onClick={onBook} style={{
        alignSelf: "center", justifySelf: "end",
        padding: "18px 40px",
        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
        letterSpacing: "0.28em", textTransform: "uppercase",
        background: "transparent", color: "#fdfbf5",
        border: "1px solid rgba(253,251,245,0.7)",
        borderRadius: 9999,
        display: "inline-flex", alignItems: "center", gap: 12,
        transition: "all 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#fdfbf5"; e.currentTarget.style.color = "var(--sage-400)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fdfbf5"; }}>
        Begin Your Enquiry <Icon name="arrow" size={14} />
      </button>
    </div>
  </section>
);

// ============================================================
// FOOTER
// ============================================================
const Footer = ({ onAdminSignIn }) => (
  <footer style={{ borderTop: "1px solid var(--ink-400)", padding: "60px 48px 40px" }}>
    <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 60 }}>
      <div>
        <LogoLockup />
        <div style={{ marginTop: 24, color: "var(--bone-400)", fontSize: 13, fontFamily: "var(--font-serif)", fontSize: 16, fontStyle: "italic", maxWidth: 320 }}>
          A boutique photography studio in Fitzroy, Melbourne — working across Australia with an open passport.
        </div>
      </div>
      <FooterCol title="Studio" links={["About", "Journal", "Press", "Submissions"]} />
      <FooterCol title="Investment" links={["Wedding Collections", "Editorial", "Family", "Heirloom"]} />
      <FooterCol title="Contact" links={["hello@illuminatestudios.com.au", "+61 3 9417 4821", "Studio 12 · Gertrude Street, Fitzroy VIC 3065"]} />
    </div>
    <div style={{ borderTop: "1px solid var(--ink-400)", marginTop: 60, paddingTop: 24,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--bone-400)" }}>
      <div>© 2026 Illuminate Studios Ltd.</div>
      <button onClick={onAdminSignIn} style={{
        fontSize: 10, letterSpacing: "0.3em", color: "var(--bone-500)",
        textTransform: "uppercase", padding: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--gold-300)"}
      onMouseLeave={e => e.currentTarget.style.color = "var(--bone-500)"}>
        Studio Admin
      </button>
    </div>
  </footer>
);

const FooterCol = ({ title, links }) => (
  <div>
    <div className="label-sm" style={{ marginBottom: 20 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {links.map((l, i) => (
        <a key={i} style={{ color: "var(--bone-200)", fontSize: 14, cursor: "pointer", transition: "color 200ms", fontFamily: "var(--font-serif)", fontSize: 16 }}
           onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
           onMouseLeave={e => e.currentTarget.style.color = "var(--bone-200)"}>
          {l}
        </a>
      ))}
    </div>
  </div>
);

// ============================================================
// BOOKING MODAL with calendar
// ============================================================
const BookingModal = ({ onClose }) => {
  const [step, setStep] = useState(0);   // 0: date, 1: details, 2: success
  const [pickedDate, setPickedDate] = useState(null);
  const [pickedPackage, setPickedPackage] = useState("signature");
  const [eventType, setEventType] = useState("Wedding");
  const [form, setForm] = useState({ name: "", email: "", phone: "", venue: "", message: "" });

  return (
    <Modal open={true} onClose={onClose} width={780} dismissable={step !== 2}>
      {step === 0 && (
        <div>
          <div className="eyebrow">Step 1 · Date</div>
          <h2 className="display" style={{ fontSize: 32, margin: "12px 0 8px", lineHeight: 1.1 }}>
            Select a <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>preferred date.</span>
          </h2>
          <div style={{ color: "var(--bone-300)", fontFamily: "var(--font-serif)", fontSize: 16, marginBottom: 32 }}>
            Pencilled dates are tentative until a deposit is received.
          </div>
          <BookingCalendar selected={pickedDate} onSelect={setPickedDate} />
          <div className="hairline" style={{ margin: "32px 0 24px" }} />
          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label className="field-label">Event Type</label>
              <select className="select" value={eventType} onChange={e => setEventType(e.target.value)}>
                <option>Wedding</option>
                <option>Editorial</option>
                <option>Family</option>
                <option>Portrait</option>
                <option>Brand / Commercial</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">Collection</label>
              <select className="select" value={pickedPackage} onChange={e => setPickedPackage(e.target.value)}>
                {window.PACKAGES.map(p => (
                  <option key={p.id} value={p.id}>{p.tier} — {p.price.toLocaleString("en-AU")}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!pickedDate} onClick={() => setStep(1)}>
              Continue <Icon name="arrow" size={12} />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <button onClick={() => setStep(0)} style={{ color: "var(--bone-300)", fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 16 }}>
            ← Change date
          </button>
          <div className="eyebrow">Step 2 · You</div>
          <h2 className="display" style={{ fontSize: 32, margin: "12px 0 8px", lineHeight: 1.1 }}>
            Tell us <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>about you.</span>
          </h2>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field label="Full Name"  value={form.name}  onChange={v => setForm({...form, name: v})} />
            <Field label="Email"      value={form.email} onChange={v => setForm({...form, email: v})} />
            <Field label="Phone"      value={form.phone} onChange={v => setForm({...form, phone: v})} />
            <Field label="Venue / Location" value={form.venue} onChange={v => setForm({...form, venue: v})} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="field-label">A few words about your day</label>
              <textarea className="textarea" rows={4} value={form.message}
                        onChange={e => setForm({...form, message: e.target.value})} />
            </div>
          </div>
          <div className="hairline" style={{ margin: "32px 0 24px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "var(--bone-300)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              {window.formatDate(pickedDate)} · {eventType} · {window.getPackage(pickedPackage).tier}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!form.name || !form.email}
                      onClick={() => setStep(2)}>
                Submit Enquiry <Icon name="arrow" size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--ink-200)", border: "1px solid var(--gold-400)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 32px", color: "var(--gold-200)",
          }}>
            <Icon name="check" size={32} />
          </div>
          <div className="eyebrow">Enquiry Received</div>
          <h2 className="display" style={{ fontSize: 36, margin: "12px 0 16px", lineHeight: 1.1 }}>
            Thank <span className="serif-italic" style={{ fontFamily: "var(--font-serif)", textTransform: "none" }}>you.</span>
          </h2>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--bone-200)", maxWidth: 480, margin: "0 auto 36px" }}>
            We've received your enquiry for <strong style={{ color: "var(--gold-200)" }}>{window.formatDate(pickedDate)}</strong> and
            will respond within two working days.
          </div>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      )}
    </Modal>
  );
};

const Field = ({ label, value, onChange }) => (
  <div>
    <label className="field-label">{label}</label>
    <input className="input" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

// ============================================================
// BOOKING CALENDAR — clean grid, unavailable dates greyed out
// ============================================================
const BookingCalendar = ({ selected, onSelect }) => {
  const [view, setView] = useState(new Date(2026, 5, 1)); // June 2026
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date(2026, 4, 14);

  // pre-booked dates (from BOOKINGS_INITIAL)
  const booked = useMemo(() =>
    new Set(window.BOOKINGS_INITIAL.map(b => b.date)),
    []);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-first
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const monthName = view.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setView(new Date(year, month - 1, 1))}
                style={{ padding: 8, color: "var(--bone-300)" }}>
          <Icon name="chevronL" size={18} />
        </button>
        <div className="display" style={{ fontSize: 18, color: "var(--gold-200)" }}>{monthName}</div>
        <button onClick={() => setView(new Date(year, month + 1, 1))}
                style={{ padding: 8, color: "var(--bone-300)" }}>
          <Icon name="chevronR" size={18} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="label-sm" style={{ textAlign: "center", fontSize: 10 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isBooked = booked.has(dateStr);
          const isPast = new Date(year, month, d) < today;
          const isSelected = selected === dateStr;
          const isWeekend = (i % 7) === 5 || (i % 7) === 6;
          return (
            <button
              key={i}
              disabled={isBooked || isPast}
              onClick={() => onSelect(dateStr)}
              style={{
                aspectRatio: "1",
                background: isSelected ? "var(--gold-300)" : "transparent",
                color: isSelected ? "var(--ink-050)"
                     : isPast ? "var(--ink-500)"
                     : isBooked ? "var(--bone-500)"
                     : "var(--bone-100)",
                border: `1px solid ${isSelected ? "var(--gold-300)" : "var(--ink-500)"}`,
                fontFamily: "var(--font-display)", fontSize: 13,
                cursor: (isBooked || isPast) ? "not-allowed" : "pointer",
                textDecoration: isBooked ? "line-through" : "none",
                fontWeight: isWeekend ? 500 : 400,
                transition: "all 200ms",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isBooked && !isPast && !isSelected) e.currentTarget.style.borderColor = "var(--gold-400)"; }}
              onMouseLeave={e => { if (!isBooked && !isPast && !isSelected) e.currentTarget.style.borderColor = "var(--ink-500)"; }}
            >
              {d}
              {isBooked && <span style={{
                position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                width: 4, height: 4, borderRadius: "50%", background: "var(--danger)"
              }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 11, color: "var(--bone-300)" }}>
        <Legend dot="var(--gold-300)" label="Available" />
        <Legend dot="var(--danger)" label="Reserved" />
        <Legend dot="var(--ink-500)" label="Past" />
      </div>
    </div>
  );
};

const Legend = ({ dot, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.15em", textTransform: "uppercase" }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
    {label}
  </div>
);

Object.assign(window, { Landing });
