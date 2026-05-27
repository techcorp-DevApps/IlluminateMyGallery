/* eslint-disable */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============================================================
// ICONS — minimalist line set, no emoji
// ============================================================
const Icon = ({ name, size = 18, stroke = 1.5 }) => {
  const paths = {
    menu:      "M3 6h18M3 12h18M3 18h18",
    close:     "M6 6l12 12M18 6L6 18",
    chevronR:  "M9 6l6 6-6 6",
    chevronL:  "M15 6l-6 6 6 6",
    chevronD:  "M6 9l6 6 6-6",
    check:     "M5 13l4 4L19 7",
    plus:      "M12 5v14M5 12h14",
    minus:     "M5 12h14",
    image:     "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
    folder:    "M3 7v12h18V9H13l-2-2H3z",
    doc:       "M7 3h8l4 4v14H7zM15 3v4h4",
    inbox:     "M3 13l3-8h12l3 8M3 13v6h18v-6M8 13h2l1 2h2l1-2h2",
    pricing:   "M7 4h10l3 4-8 12L4 8z M9 9h2 M9 13h6",
    gallery:   "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    calendar:  "M3 7h18v14H3zM3 11h18M8 3v4M16 3v4",
    user:      "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    users:     "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M16 11a4 4 0 100-8M22 21a7 7 0 00-7-7",
    search:    "M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l5 5",
    bell:      "M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 004 0",
    star:      "M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9.1 9z",
    settings:  "M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
    arrow:     "M5 12h14M13 5l7 7-7 7",
    arrowL:    "M19 12H5M11 5l-7 7 7 7",
    heart:     "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    download:  "M12 3v12M7 10l5 5 5-5M5 21h14",
    eye:       "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z",
    edit:      "M14 4l6 6L8 22H2v-6zM14 4l2-2 6 6-2 2",
    trash:     "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
    camera:    "M4 8h3l2-3h6l2 3h3v12H4zM12 17a4 4 0 100-8 4 4 0 000 8z",
    clock:     "M12 6v6l4 2M12 21a9 9 0 100-18 9 9 0 000 18z",
    pin:       "M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12zM12 11a2 2 0 100-4 2 2 0 000 4z",
    logout:    "M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4",
    sparkle:   "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

// ============================================================
// LOGO — uses the actual brand banner PNG, swaps with theme
// via CSS custom property (--logo-banner / --logo-lens).
// ============================================================
const LogoBanner = ({ height = 32 }) => (
  <div className="logo-banner-img"
       role="img" aria-label="Illuminate Studios"
       style={{ height, aspectRatio: "5.5 / 1" }} />
);

const LogoMark = ({ size = 36 }) => (
  <div className="logo-lens-img"
       role="img" aria-label="Illuminate Studios"
       style={{ width: size, height: size }} />
);

// Lockup = banner (cleanest, has the camera + wordmark together)
const LogoLockup = ({ scale = 1 }) => (
  <LogoBanner height={28 * scale} />
);

// ============================================================
// THEME — light (default) / dark, persisted, sets data-theme on body
// ============================================================
const ThemeContext = React.createContext({ theme: "light", setTheme: () => {} });

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("is_theme") || "light");
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("is_theme", theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
const useTheme = () => React.useContext(ThemeContext);

const ThemeToggle = ({ variant = "pill" }) => {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button onClick={() => setTheme(next)} className="theme-toggle" aria-label={`Switch to ${next} theme`}
            title={`Switch to ${next} theme`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {theme === "light"
          ? <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          : <>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </>}
      </svg>
      {theme === "light" ? "Light" : "Dark"}
    </button>
  );
};

// ============================================================
// HAIRLINE — decorative divider with center ornament
// ============================================================
const Hairline = ({ ornament = true, color = "gold" }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 16,
    color: color === "gold" ? "var(--gold-400)" : "var(--ink-500)"
  }}>
    <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
    {ornament && (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M8 2 L10 8 L8 14 L6 8 Z" fill="currentColor" opacity="0.7"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      </svg>
    )}
    <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
  </div>
);

// ============================================================
// MODAL — fade-in luxury modal w/ gold border + close
// ============================================================
const Modal = ({ open, onClose, children, width = 560, dismissable = true }) => {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={dismissable ? onClose : undefined}>
      <div className="modal-card" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        {dismissable && (
          <button onClick={onClose} aria-label="Close"
                  style={{ position: "absolute", top: 20, right: 20, color: "var(--bone-300)",
                           transition: "color 200ms", padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--gold-200)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--bone-300)"}>
            <Icon name="close" size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

// ============================================================
// PHASE DOTS — progress indicator
// ============================================================
const PhaseDots = ({ currentIdx, total = window.PHASES.length, compact = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 8 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === currentIdx ? (compact ? 16 : 24) : (compact ? 6 : 8),
        height: compact ? 6 : 8,
        borderRadius: 9999,
        background: i < currentIdx ? "var(--gold-400)"
                  : i === currentIdx ? "var(--gold-200)"
                  : "var(--ink-500)",
        transition: "all 400ms var(--ease-out)",
        boxShadow: i === currentIdx ? "0 0 12px rgba(201,169,110,0.5)" : "none",
      }} />
    ))}
  </div>
);

// ============================================================
// TOAST — bottom-right notification
// ============================================================
const ToastContext = React.createContext(null);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex",
                    flexDirection: "column", gap: 8, zIndex: 2000 }}>
        {toasts.map(t => (
          <div key={t.id} className="card-elev fade-in"
               style={{ padding: "14px 20px", borderLeft: "2px solid var(--gold-300)",
                        minWidth: 280, fontSize: 13, animation: "rise 340ms var(--ease-out)" }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => React.useContext(ToastContext);

// ============================================================
// BACKDROP TEXTURE — subtle photographic atmosphere panel
// ============================================================
const AtmosphereBg = ({ children, intensity = 1 }) => (
  <div style={{ position: "relative", isolation: "isolate" }}>
    <div style={{
      position: "absolute", inset: 0,
      background: `
        radial-gradient(60% 50% at 20% 10%, rgba(201,169,110,${0.08*intensity}), transparent 60%),
        radial-gradient(80% 60% at 90% 90%, rgba(201,169,110,${0.05*intensity}), transparent 60%)`,
      pointerEvents: "none", zIndex: 0
    }} />
    <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
  </div>
);

// Export
Object.assign(window, {
  Icon, LogoBanner, LogoMark, LogoLockup, Hairline,
  Modal, PhaseDots, ToastProvider, useToast, AtmosphereBg,
  ThemeProvider, ThemeToggle, useTheme,
});
