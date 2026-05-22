import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

export default function AdminDocuments() {
    const [docs, setDocs] = useState([]);
    const [clients, setClients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [mode, setMode] = useState(null); // null | 'template' | 'custom'
    const [tpl, setTpl] = useState({ template_key: "", client_user_id: "", booking_id: "" });
    const [preview, setPreview] = useState("");
    const [custom, setCustom] = useState({ title: "", client_user_id: "", body: DEFAULT_BODY });

    const refresh = useCallback(async () => {
        const [d, c, b, t] = await Promise.all([
            api.get("/documents"),
            api.get("/admin/clients"),
            api.get("/bookings"),
            api.get("/contract-templates"),
        ]);
        setDocs(d.data);
        setClients(c.data);
        setBookings(b.data);
        setTemplates(t.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (mode === "template" && tpl.template_key) {
            const t = templates.find((x) => x.key === tpl.template_key);
            if (t) setPreview(t.body);
        } else {
            setPreview("");
        }
    }, [mode, tpl.template_key, templates]);

    const sendFromTemplate = async (e) => {
        e.preventDefault();
        if (!tpl.template_key || !tpl.client_user_id) return;
        await api.post("/contract-templates/create-document", {
            template_key: tpl.template_key,
            client_user_id: tpl.client_user_id,
            booking_id: tpl.booking_id || null,
        });
        setTpl({ template_key: "", client_user_id: "", booking_id: "" });
        setMode(null);
        refresh();
    };

    const sendCustom = async (e) => {
        e.preventDefault();
        await api.post("/documents", custom);
        setCustom({ title: "", client_user_id: "", body: DEFAULT_BODY });
        setMode(null);
        refresh();
    };

    const clientBookings = bookings.filter(
        (b) => tpl.client_user_id && b.user_id === tpl.client_user_id
    );

    return (
        <div>
            <div className="flex justify-between items-end mb-6 flex-wrap gap-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{docs.length} documents</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode(mode === "template" ? null : "template")}
                        className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                        data-testid="admin-doc-template-btn"
                    >
                        {mode === "template" ? "Cancel" : "+ From template"}
                    </button>
                    <button
                        onClick={() => setMode(mode === "custom" ? null : "custom")}
                        className="text-xs uppercase tracking-[0.3em] border border-foreground px-5 py-2"
                        data-testid="admin-doc-new-btn"
                    >
                        {mode === "custom" ? "Cancel" : "+ Custom"}
                    </button>
                </div>
            </div>

            {mode === "template" && (
                <form onSubmit={sendFromTemplate} className="border border-border p-6 mb-6" data-testid="admin-doc-template-form">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Template</label>
                            <select
                                value={tpl.template_key}
                                onChange={(e) => setTpl({ ...tpl, template_key: e.target.value })}
                                required
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                                data-testid="admin-doc-template-select"
                            >
                                <option value="">Select template…</option>
                                {templates.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client</label>
                            <select
                                value={tpl.client_user_id}
                                onChange={(e) => setTpl({ ...tpl, client_user_id: e.target.value, booking_id: "" })}
                                required
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                                data-testid="admin-doc-template-client"
                            >
                                <option value="">Select client…</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name || c.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                Booking (auto-fill)
                            </label>
                            <select
                                value={tpl.booking_id}
                                onChange={(e) => setTpl({ ...tpl, booking_id: e.target.value })}
                                disabled={!tpl.client_user_id}
                                className="w-full bg-transparent border-b border-foreground py-2 mt-1 disabled:opacity-40"
                                data-testid="admin-doc-template-booking"
                            >
                                <option value="">— None —</option>
                                {clientBookings.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.package_name} · {b.preferred_date}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {preview && (
                        <div className="mt-6">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Preview</p>
                            <div
                                className="bg-muted p-4 border border-border max-h-72 overflow-y-auto whitespace-pre-wrap font-display text-sm leading-relaxed"
                                data-testid="admin-doc-template-preview"
                            >
                                {preview.slice(0, 1500)}
                                {preview.length > 1500 ? "\n…" : ""}
                            </div>
                        </div>
                    )}
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3"
                            data-testid="admin-doc-template-send"
                        >
                            Generate & send to client
                        </button>
                    </div>
                </form>
            )}

            {mode === "custom" && (
                <form onSubmit={sendCustom} className="border border-border p-6 mb-6 space-y-4" data-testid="admin-doc-form">
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Title</label>
                        <input
                            value={custom.title}
                            onChange={(e) => setCustom({ ...custom, title: e.target.value })}
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                            required
                            data-testid="admin-doc-title"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client</label>
                        <select
                            value={custom.client_user_id}
                            onChange={(e) => setCustom({ ...custom, client_user_id: e.target.value })}
                            required
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                            data-testid="admin-doc-client"
                        >
                            <option value="">Select a client…</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name || c.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Body</label>
                        <textarea
                            rows={10}
                            value={custom.body}
                            onChange={(e) => setCustom({ ...custom, body: e.target.value })}
                            className="w-full bg-transparent border border-border p-3 mt-1 font-display text-base leading-relaxed focus:outline-none focus:border-foreground"
                            data-testid="admin-doc-body"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3"
                        data-testid="admin-doc-create"
                    >
                        Send to client
                    </button>
                </form>
            )}

            {docs.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No documents yet.</p>
            ) : (
                <div className="divide-y divide-border border border-border" data-testid="admin-docs-list">
                    {docs.map((d) => (
                        <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-5">
                            <div className="md:col-span-7">
                                <p className="font-display text-xl">{d.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(d.created_at).toLocaleDateString()} ·{" "}
                                    {clients.find((c) => c.id === d.client_user_id)?.email || d.client_user_id}
                                </p>
                            </div>
                            <div className="md:col-span-5 text-right">
                                {d.signed ? (
                                    <span className="text-[10px] uppercase tracking-[0.3em] border border-foreground bg-foreground text-background px-3 py-2">
                                        Signed · {d.signature_name}
                                    </span>
                                ) : (
                                    <span className="text-[10px] uppercase tracking-[0.3em] border border-border px-3 py-2">
                                        Awaiting signature
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const DEFAULT_BODY = `This agreement is made between Illuminate Studios ("the Studio") and the named client below for the photography session described in the booking.

1. Scope of work — The Studio agrees to provide the agreed package, deliverables and coverage.
2. Payment — A 10% non-refundable retainer secures the date. The balance is due before delivery.
3. Cancellation — Cancellations made within 14 days of the session will forfeit the retainer.
4. Image rights — The client receives a personal-use licence to all delivered images. The Studio retains copyright and the right to use selected images for portfolio and editorial purposes.

By signing below, the client confirms they have read and accept these terms.`;
