import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

export default function AdminDocuments() {
    const [docs, setDocs] = useState([]);
    const [clients, setClients] = useState([]);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: "", client_user_id: "", body: DEFAULT_BODY });

    const refresh = useCallback(async () => {
        const [d, c] = await Promise.all([api.get("/documents"), api.get("/admin/clients")]);
        setDocs(d.data);
        setClients(c.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const create = async (e) => {
        e.preventDefault();
        await api.post("/documents", form);
        setForm({ title: "", client_user_id: "", body: DEFAULT_BODY });
        setCreating(false);
        refresh();
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{docs.length} documents</p>
                <button
                    onClick={() => setCreating((v) => !v)}
                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                    data-testid="admin-doc-new-btn"
                >
                    {creating ? "Cancel" : "+ New document"}
                </button>
            </div>
            {creating && (
                <form onSubmit={create} className="border border-border p-6 mb-6 space-y-4" data-testid="admin-doc-form">
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Title</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                            required
                            data-testid="admin-doc-title"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client</label>
                        <select
                            value={form.client_user_id}
                            onChange={(e) => setForm({ ...form, client_user_id: e.target.value })}
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
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
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
2. Payment — A non-refundable retainer of 30% secures the date. The balance is due before delivery.
3. Cancellation — Cancellations made within 14 days of the session will forfeit the retainer.
4. Image rights — The client receives a personal-use licence to all delivered images. The Studio retains copyright and the right to use selected images for portfolio and editorial purposes.

By signing below, the client confirms they have read and accept these terms.`;
