/* eslint-disable */
// Mock data — represents the full system state. In production
// this would come from a backend (Postgres + S3 + auth).

// ============ Gallery imagery (Unsplash photographer photos) ============
// Real, stable photo IDs across wedding/event/portrait moods.
const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const GALLERY_PROOFS = [
  { id: "p01", src: u("1519741497674-611481863552"), label: "Ceremony · 04:12pm", w: 4, h: 5 },
  { id: "p02", src: u("1606216794074-735e91aa2c92"), label: "First look",          w: 1, h: 1 },
  { id: "p03", src: u("1511285560929-80b456fea0bc"), label: "Bridal portrait",     w: 4, h: 5 },
  { id: "p04", src: u("1583939003579-730e3918a45a"), label: "Rings detail",        w: 3, h: 2 },
  { id: "p05", src: u("1465495976277-4387d4b0b4c6"), label: "Aisle",               w: 4, h: 5 },
  { id: "p06", src: u("1519225421980-715cb0215aed"), label: "Vows",                w: 3, h: 2 },
  { id: "p07", src: u("1525772764200-be829a350797"), label: "Reception",           w: 4, h: 5 },
  { id: "p08", src: u("1519741497674-611481863552"), label: "Toast",               w: 1, h: 1 },
  { id: "p09", src: u("1537907510278-10acdb198d0f"), label: "Bouquet",             w: 4, h: 5 },
  { id: "p10", src: u("1591604466107-ec97de577aff"), label: "Groom prep",          w: 3, h: 4 },
  { id: "p11", src: u("1519671482749-fd09be7ccebf"), label: "Bridesmaids",         w: 4, h: 5 },
  { id: "p12", src: u("1606800052052-a08af7148866"), label: "Father walk",         w: 3, h: 4 },
  { id: "p13", src: u("1511795409834-ef04bbd61622"), label: "Cake cut",            w: 4, h: 3 },
  { id: "p14", src: u("1465495976277-4387d4b0b4c6"), label: "Recessional",         w: 4, h: 5 },
  { id: "p15", src: u("1583939411023-14783179e581"), label: "Golden hour",         w: 3, h: 2 },
  { id: "p16", src: u("1519741497674-611481863552"), label: "Dance floor",         w: 4, h: 5 },
  { id: "p17", src: u("1519225421980-715cb0215aed"), label: "Sparklers",           w: 3, h: 2 },
  { id: "p18", src: u("1525772764200-be829a350797"), label: "Send-off",            w: 4, h: 5 },
];

// ============ Packages — converted to AUD ============
const PACKAGES = [
  {
    id: "essentials",
    tier: "Essentials",
    price: 3200,
    duration: "Up to 6 hours coverage",
    includes: [
      "One lead photographer",
      "300+ edited high-resolution images",
      "Private online gallery (60 days)",
      "Print release for personal use",
      "Pre-shoot consultation"
    ],
    accent: false
  },
  {
    id: "signature",
    tier: "Signature",
    price: 5800,
    duration: "Up to 9 hours coverage",
    includes: [
      "Lead + second photographer",
      "600+ edited high-resolution images",
      "Private gallery (12 months)",
      "Engagement session (90 min)",
      "Custom album consultation",
      "Sneak-peek reel within 48 hours"
    ],
    accent: true
  },
  {
    id: "atelier",
    tier: "Atelier",
    price: 9200,
    duration: "Full day · open coverage",
    includes: [
      "Two photographers · one assistant",
      "1,000+ edited images, archival quality",
      "Lifetime gallery hosting",
      "Engagement & rehearsal coverage",
      "Heirloom album (40 spreads)",
      "Fine-art print collection (5 pieces)",
      "Day-after editorial session"
    ],
    accent: false
  }
];

const ADD_ONS = [
  { id: "a1", name: "Engagement Session",          price: 820,  unit: "session" },
  { id: "a2", name: "Second Photographer",         price: 1100, unit: "event" },
  { id: "a3", name: "Heirloom Album · 30 spreads", price: 1480, unit: "album" },
  { id: "a4", name: "Fine-art Print Collection",   price: 580,  unit: "set of 5" },
  { id: "a5", name: "Rehearsal Dinner Coverage",   price: 960,  unit: "2 hours" },
  { id: "a6", name: "Same-day Edit Reel",          price: 720,  unit: "60s reel" },
];

// ============ Phases — appears in welcome modal + shoot tracker ============
const PHASES = [
  { key: "inquiry",   label: "Inquiry Received",     description: "We've received your enquiry and are reviewing dates." },
  { key: "contract",  label: "Agreement Sent",       description: "Your photography agreement is in the inbox awaiting signature." },
  { key: "deposit",   label: "Deposit Pending",      description: "A 30% retainer secures your date." },
  { key: "booked",    label: "Date Confirmed",       description: "You're booked. Pre-shoot consultation scheduled." },
  { key: "shoot",     label: "Shoot Day",            description: "The day of. We can't wait." },
  { key: "editing",   label: "In Post-Production",   description: "Hand-editing your gallery. Allow 4–6 weeks." },
  { key: "delivered", label: "Gallery Delivered",    description: "Your private gallery is live. Select your favourites." },
  { key: "complete",  label: "Archived",             description: "Your collection is archived in perpetuity." },
];

// ============ Documents ============
const DOCUMENTS_INITIAL = [
  {
    id: "d1",
    title: "Wedding Photography Agreement",
    type: "Contract",
    status: "signed",
    signedAt: "2026-02-14",
    size: "382 KB",
    pages: 8
  },
  {
    id: "d2",
    title: "Package Schedule & Add-Ons",
    type: "Schedule",
    status: "signed",
    signedAt: "2026-02-14",
    size: "127 KB",
    pages: 4
  },
];

// In a real backend these would be sent from admin → client.
const INBOX_INITIAL = [
  {
    id: "i1",
    title: "Optional Portfolio & Marketing Release",
    from: "Studio Director",
    sentAt: "2026-05-02",
    requiresSignature: true,
    preview: "Optional consent allowing Illuminate Studios to feature select images from your collection in portfolio and editorial submissions.",
    pages: 3,
    read: false
  },
  {
    id: "i2",
    title: "Pre-Shoot Questionnaire",
    from: "Studio Director",
    sentAt: "2026-04-28",
    requiresSignature: false,
    preview: "A brief questionnaire covering family groupings, must-have shots, and venue logistics.",
    pages: 2,
    read: true
  }
];

// ============ Client account — drives portal state ============
const CLIENT_INITIAL = {
  name: "Eleanor & James Whitfield",
  shortName: "E&J",
  email: "eleanor.whitfield@hey.com",
  eventDate: "2026-06-14",
  eventType: "Wedding",
  venue: "Stones of the Yarra Valley · VIC",
  package: "signature",
  phaseIdx: 6, // "Gallery Delivered" — gives us the gallery wall experience
  visitCount: 0,
};

// ============ Admin — bookings, contacts, tracker ============
const BOOKINGS_INITIAL = [
  { id: "b1", clientName: "Whitfield · Eleanor & James", eventType: "Wedding",  date: "2026-06-14", venue: "Stones of the Yarra Valley",     phase: 6, package: "signature", status: "confirmed", value: 5800 },
  { id: "b2", clientName: "Marchetti · Sofia & Luca",    eventType: "Wedding",  date: "2026-07-22", venue: "Werribee Park Mansion",          phase: 3, package: "atelier",   status: "confirmed", value: 9200 },
  { id: "b3", clientName: "Okonkwo · Adaeze",            eventType: "Portrait", date: "2026-05-30", venue: "Studio · Collingwood",           phase: 4, package: "essentials",status: "confirmed", value: 3200 },
  { id: "b4", clientName: "Chen · Mira",                 eventType: "Editorial",date: "2026-06-08", venue: "Royal Botanic Gardens · Cranbourne", phase: 1, package: "signature", status: "pending",   value: 5800 },
  { id: "b5", clientName: "Aldridge · Theo & Marcus",    eventType: "Wedding",  date: "2026-08-15", venue: "Mt Macedon Estate",              phase: 2, package: "signature", status: "confirmed", value: 5800 },
  { id: "b6", clientName: "Holloway · Beatrice",         eventType: "Family",   date: "2026-05-24", venue: "Carlton Gardens",                phase: 5, package: "essentials",status: "confirmed", value: 3200 },
];

const INQUIRIES_INITIAL = [
  { id: "q1", name: "Astrid Lindqvist",   email: "astrid@northstudio.co",  date: "2026-09-12", type: "Wedding",   message: "Considering Signature or Atelier for a 150-guest wedding at Mona Farm. Could we arrange a call?", receivedAt: "2026-05-13", status: "new" },
  { id: "q2", name: "Nile Bashir",        email: "nile.b@gmail.com",       date: "2026-07-05", type: "Editorial", message: "Looking for a fine-art editorial session for a magazine feature.", receivedAt: "2026-05-12", status: "new" },
  { id: "q3", name: "Priya Rajaram",      email: "priya.r@outlook.com",    date: "2026-10-04", type: "Wedding",   message: "Three-day Hindu wedding at Stamford Plaza. Interested in Atelier with travel.", receivedAt: "2026-05-10", status: "reviewing" },
];

const CONTACTS_INITIAL = [
  { id: "c1", name: "Eleanor & James Whitfield", email: "eleanor.whitfield@hey.com", phone: "+61 412 558 921", bookingId: "b1", assigned: true, tags: ["VIP", "Returning"] },
  { id: "c2", name: "Sofia & Luca Marchetti",    email: "sofia@marchetti.it",        phone: "+61 423 887 104", bookingId: "b2", assigned: true, tags: ["Destination"] },
  { id: "c3", name: "Adaeze Okonkwo",            email: "ada@studio-ko.com",         phone: "+61 401 442 218", bookingId: "b3", assigned: true, tags: [] },
  { id: "c4", name: "Mira Chen",                 email: "mira@chenmira.studio",      phone: "+61 432 119 448", bookingId: "b4", assigned: false, tags: ["Press"] },
  { id: "c5", name: "Theo & Marcus Aldridge",    email: "t.aldridge@me.com",         phone: "+61 408 776 512", bookingId: "b5", assigned: true, tags: [] },
  { id: "c6", name: "Beatrice Holloway",         email: "bea.holloway@gmail.com",    phone: "+61 421 904 677", bookingId: "b6", assigned: true, tags: ["Family"] },
];

// ============ Helpers ============
function getPackage(id) { return PACKAGES.find(p => p.id === id); }
function getPhase(idx)  { return PHASES[Math.min(Math.max(idx, 0), PHASES.length - 1)]; }
function formatDate(iso, opts = { day: "numeric", month: "long", year: "numeric" }) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", opts);
}
// Amount formatter — number only, no currency symbol (region: AU, AUD)
function amount(n) { return n.toLocaleString("en-AU"); }
// Backwards-compat alias — used in older bits of the codebase
function gbp(n) { return amount(n); }

// ============ Export to window so all babel files can see ============
Object.assign(window, {
  GALLERY_PROOFS, PACKAGES, ADD_ONS, PHASES,
  DOCUMENTS_INITIAL, INBOX_INITIAL, CLIENT_INITIAL,
  BOOKINGS_INITIAL, INQUIRIES_INITIAL, CONTACTS_INITIAL,
  getPackage, getPhase, formatDate, amount, gbp,
});
