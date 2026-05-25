import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { X, Plus } from "lucide-react";
import InvoiceDrawer from "../components/InvoiceDrawer";

const STATUS_LABEL = {
    pending: "Pending",
    approved: "Confirmed",
    rejected: "Rejected",
    completed: "Completed",
};

function ProfileDrawer({ clientId, onClose, onChange, templates }) {
    const [profile, setProfile] = useState(null);
    const [tab, setTab] = useState("overview");
    const [edits, setEdits] = useState(null);
    const [busy, setBusy] = useState(false);
    const [sendingTemplate, setSendingTemplate] = useState("");
    const [activeInvoiceId, setActiveInvoiceId] = useState(null);

    const reload = useCallback(async () => {
        const { data } = await api.get(`/admin/clients/${clientId}`);
        setProfile(data);
        setEdits({
            name: data.client.name || "",
            email: data.client.email || "",
            phone: data.client.phone || "",
            notes: data.client.notes || "",
        });
    }, [clientId]);

    useEffect(() => {
        reload();
    }, [reload]);

    if (!profile || !edits) {
        return (
            <aside className="bg-background w-full max-w-2xl h-full overflow-y-auto border-l border-border p-6">
                <p className="text-muted-foreground">Loading…</p>
            </aside>
        );
    }

    const save = async () => {
        setBusy(true);
        try {
            await api.patch(`/admin/clients/${clientId}`, edits);
            await reload();
            onChange?.();
        } finally {
            setBusy(false);
        }
    };

    const sendContract = async (templateKey, bookingId) => {
        setSendingTemplate(templateKey);
        try {
            await api.post("/contract-templates/create-document", {
                template_key: templateKey,
                client_user_id: clientId,
                booking_id: bookingId || null,
            });
            await reload();
            onChange?.();
        } finally {
            setSendingTemplate("");
        }
    };

    const issueInvoiceFromBooking = async (bookingId) => {
        const { data } = await api.post(`/invoices/auto-from-booking/${bookingId}`);
        await reload();
        onChange?.();
        setActiveInvoiceId(data.id);
    };

    const c = profile.client;
    const s = profile.stats;

    return (
        <aside
            className="bg-background w-full max-w-2xl h-full overflow-y-auto border-l border-border animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            data-testid="client-profile-drawer"
        >
            <div className="p-6 border-b border-border flex items-start justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client profile</p>
                    <h2 className="font-display text-4xl tracking-tighter mt-1">{c.name || c.email}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{c.email}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:opacity-60"
                    aria-label="Close"
                    data-testid="client-profile-close"
                >
                    <X size={20} strokeWidth={1.25} />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-px bg-border border-b border-border">
                {[
                    ["bookings", "Sessions", s.bookings],
                    ["completed", "Completed", s.completed_bookings],
                    ["paid", "Paid AUD", s.total_paid_aud.toFixed(0)],
                    ["unpaid", "Unpaid inv", s.unpaid_invoices],
                ].map(([k, label, v]) => (
                    <div key={k} className="bg-background p-3 text-center">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
                        <p className="font-display text-2xl mt-1">{v}</p>
                    </div>
                ))}
            </div>

            <div className="border-b border-border flex flex-wrap gap-x-6 px-6 pt-4">
                {[
                    ["overview", "Overview & notes"],
                    ["bookings", `Bookings (${profile.bookings.length})`],
                    ["galleries", `Galleries (${profile.galleries.length})`],
                    ["documents", `Documents (${profile.documents.length})`],
                    ["invoices", `Invoices (${profile.invoices.length})`],
                    ["actions", "Quick actions"],
                ].map(([k, label]) => (
                    <button
                        key={k}
                        onClick={() => setTab(k)}
                        className={`text-xs uppercase tracking-[0.3em] py-2 border-b-2 ${
                            tab === k ? "border-foreground" : "border-transparent text-muted-foreground"
                        }`}
                        data-testid={`client-profile-tab-${k}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-6">
                {tab === "overview" && (
                    <div className="space-y-4" data-testid="client-profile-overview">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Name</label>
                            <input
                                value={edits.name}
                                onChange={(e) => setEdits({ ...edits, name: e.target.value })}
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                                data-testid="client-profile-name"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</label>
                            <input
                                type="email"
                                value={edits.email}
                                onChange={(e) => setEdits({ ...edits, email: e.target.value })}
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                                data-testid="client-profile-email"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Phone</label>
                            <input
                                value={edits.phone}
                                onChange={(e) => setEdits({ ...edits, phone: e.target.value })}
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                                data-testid="client-profile-phone"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                Studio notes (preferences, allergies, special requests, do-not-photograph guests…)
                            </label>
                            <textarea
                                rows={8}
                                value={edits.notes}
                                onChange={(e) => setEdits({ ...edits, notes: e.target.value })}
                                className="w-full bg-transparent border border-border p-3 mt-2 focus:outline-none focus:border-foreground"
                                data-testid="client-profile-notes"
                                placeholder="Anything the photographer should remember about this client…"
                            />
                        </div>
                        <button
                            onClick={save}
                            disabled={busy}
                            className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3 disabled:opacity-50"
                            data-testid="client-profile-save"
                        >
                            {busy ? "Saving…" : "Save changes"}
                        </button>
                        {c.is_lead && (
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground border border-border p-3">
                                Lead-only client (no portal password set). Once they register with this email,
                                their portal unlocks and all history below carries through.
                            </p>
                        )}
                    </div>
                )}

                {tab === "bookings" && (
                    <div className="space-y-3" data-testid="client-profile-bookings">
                        {profile.bookings.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No bookings yet.</p>
                        ) : (
                            profile.bookings.map((b) => (
                                <div key={b.id} className="border border-border p-4 flex justify-between items-start gap-4">
                                    <div>
                                        <p className="font-display text-xl">{b.package_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {b.preferred_date} · {b.preferred_time} · {b.duration_minutes} min
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {b.location_address}, {b.suburb}
                                        </p>
                                        {b.notes && (
                                            <p className="text-sm mt-2 italic">{b.notes}</p>
                                        )}
                                        <p className="text-xs font-mono-ui mt-2">
                                            AUD {b.estimated_price?.toFixed(2)} · via {b.source}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <span className="text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-1 inline-block">
                                            {STATUS_LABEL[b.status] || b.status}
                                        </span>
                                        <button
                                            onClick={() => issueInvoiceFromBooking(b.id)}
                                            className="block text-[10px] uppercase tracking-[0.3em] border border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors"
                                            data-testid={`client-booking-invoice-${b.id}`}
                                        >
                                            + Invoice
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {tab === "galleries" && (
                    <div className="space-y-3" data-testid="client-profile-galleries">
                        {profile.galleries.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No galleries delivered yet.{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose?.();
                                        window.location.assign("/admin/galleries");
                                    }}
                                    className="underline"
                                    data-testid="client-profile-go-galleries"
                                >
                                    Create one →
                                </button>
                            </p>
                        ) : (
                            profile.galleries.map((g) => (
                                <a
                                    key={g.id}
                                    href={`/admin/galleries?gallery=${g.id}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onClose?.();
                                        window.location.assign(`/admin/galleries?gallery=${g.id}`);
                                    }}
                                    className="block border border-border p-4 hover:border-foreground transition-colors"
                                    data-testid={`client-gallery-${g.id}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-display text-xl">{g.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {g.photo_count} photos
                                                {g.created_at && (
                                                    <> · delivered {new Date(g.created_at).toLocaleDateString()}</>
                                                )}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 whitespace-nowrap ${
                                                g.allow_downloads
                                                    ? "border-foreground bg-foreground text-background"
                                                    : "border-border"
                                            }`}
                                        >
                                            {g.allow_downloads ? "Downloads on" : "Preview only"}
                                        </span>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                )}

                {tab === "documents" && (
                    <div className="space-y-3" data-testid="client-profile-documents">
                        {profile.documents.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No documents sent yet.</p>
                        ) : (
                            profile.documents.map((d) => (
                                <div key={d.id} className="border border-border p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-display text-lg">{d.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(d.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 ${
                                            d.signed
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border"
                                        }`}
                                    >
                                        {d.signed ? `Signed · ${d.signature_name}` : "Awaiting signature"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {tab === "invoices" && (
                    <div className="space-y-3" data-testid="client-profile-invoices">
                        {profile.invoices.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No invoices issued yet.</p>
                        ) : (
                            profile.invoices.map((inv) => (
                                <button
                                    type="button"
                                    key={inv.id}
                                    onClick={() => setActiveInvoiceId(inv.id)}
                                    className="w-full text-left border border-border p-4 flex justify-between items-center hover:bg-muted/40 transition-colors"
                                    data-testid={`client-invoice-row-${inv.id}`}
                                >
                                    <div>
                                        <p className="font-mono-ui text-xs">{inv.reference}</p>
                                        <p className="font-display text-lg">{inv.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {inv.currency} {inv.amount.toFixed(2)}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 inline-block ${
                                            inv.status === "paid"
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border"
                                        }`}
                                    >
                                        {inv.status}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {tab === "actions" && (
                    <div className="space-y-6" data-testid="client-profile-actions">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                                Send a contract from template
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {templates.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => sendContract(t.key, profile.bookings[0]?.id)}
                                        disabled={sendingTemplate === t.key}
                                        className="border border-border p-3 text-left hover:border-foreground transition-colors disabled:opacity-50"
                                        data-testid={`client-action-template-${t.key}`}
                                    >
                                        <p className="font-display text-base">{t.title}</p>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                            {sendingTemplate === t.key
                                                ? "Sending…"
                                                : profile.bookings[0]
                                                ? `Auto-fill from latest booking`
                                                : `No booking — fields left as placeholders`}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {activeInvoiceId && (
                <InvoiceDrawer
                    invoiceId={activeInvoiceId}
                    onClose={() => setActiveInvoiceId(null)}
                    isAdmin
                    onChanged={() => {
                        reload();
                        onChange?.();
                    }}
                />
            )}
        </aside>
    );
}

function CreateClientForm({ onCreated, onClose }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            const { data } = await api.post("/admin/clients", form);
            onCreated(data);
        } catch (ex) {
            setErr(ex.response?.data?.detail || "Could not create client");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="border border-border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="admin-client-form"
        >
            <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Name</label>
                <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-client-name"
                />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-client-email"
                />
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Phone</label>
                <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-client-phone"
                />
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Notes</label>
                <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-transparent border border-border p-2 mt-1 focus:outline-none focus:border-foreground"
                    data-testid="admin-client-notes"
                    placeholder="Initial notes about this client…"
                />
            </div>
            {err && (
                <p className="md:col-span-2 text-sm text-destructive" data-testid="admin-client-form-error">
                    {err}
                </p>
            )}
            <div className="md:col-span-2 flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3 disabled:opacity-50"
                    data-testid="admin-client-create"
                >
                    {busy ? "Adding…" : "Add client"}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs uppercase tracking-[0.3em] border border-border px-6 py-3"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [creating, setCreating] = useState(false);
    const [activeId, setActiveId] = useState(null);

    const refresh = useCallback(async () => {
        const [c, t] = await Promise.all([
            api.get("/admin/clients"),
            api.get("/contract-templates").catch(() => ({ data: [] })),
        ]);
        setClients(c.data.filter((u) => !u.is_archived));
        setTemplates(t.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div>
            <div className="flex justify-between items-end mb-6 flex-wrap gap-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {clients.length} clients
                </p>
                <button
                    onClick={() => setCreating((v) => !v)}
                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2 inline-flex items-center gap-2"
                    data-testid="admin-client-new-btn"
                >
                    <Plus size={14} strokeWidth={1.5} />
                    {creating ? "Cancel" : "New client"}
                </button>
            </div>

            {creating && (
                <CreateClientForm
                    onClose={() => setCreating(false)}
                    onCreated={(newClient) => {
                        setCreating(false);
                        refresh();
                        setActiveId(newClient.id);
                    }}
                />
            )}

            {clients.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No clients yet — add one to get started.</p>
            ) : (
                <div className="border border-border divide-y divide-border" data-testid="admin-clients-list">
                    {clients.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveId(c.id)}
                            className="w-full text-left p-5 grid grid-cols-1 md:grid-cols-12 gap-3 hover:bg-muted/40 transition-colors"
                            data-testid={`admin-client-row-${c.id}`}
                        >
                            <div className="md:col-span-5">
                                <p className="font-display text-xl">{c.name || c.email}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                            <div className="md:col-span-4 text-sm text-muted-foreground">
                                {c.phone || "—"}
                                {c.is_lead && (
                                    <span className="ml-2 text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-0.5">
                                        Lead
                                    </span>
                                )}
                            </div>
                            <div className="md:col-span-3 text-right font-mono-ui text-xs text-muted-foreground">
                                {new Date(c.created_at).toLocaleDateString()}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {activeId && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 flex justify-end"
                    onClick={() => setActiveId(null)}
                    data-testid="client-profile-backdrop"
                >
                    <ProfileDrawer
                        clientId={activeId}
                        onClose={() => setActiveId(null)}
                        onChange={refresh}
                        templates={templates}
                    />
                </div>
            )}
        </div>
    );
}
