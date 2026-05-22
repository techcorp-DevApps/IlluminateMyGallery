import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ client_user_id: "", title: "", amount: 0, currency: "AUD" });

    const refresh = useCallback(async () => {
        const [i, c] = await Promise.all([api.get("/invoices"), api.get("/admin/clients")]);
        setInvoices(i.data);
        setClients(c.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const create = async (e) => {
        e.preventDefault();
        await api.post("/invoices", { ...form, amount: parseFloat(form.amount) });
        setForm({ client_user_id: "", title: "", amount: 0, currency: "AUD" });
        setCreating(false);
        refresh();
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {invoices.length} invoices
                </p>
                <button
                    onClick={() => setCreating((v) => !v)}
                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                    data-testid="admin-invoice-new-btn"
                >
                    {creating ? "Cancel" : "+ New invoice"}
                </button>
            </div>
            {creating && (
                <form onSubmit={create} className="border border-border p-6 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4" data-testid="admin-invoice-form">
                    <div className="md:col-span-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client</label>
                        <select
                            value={form.client_user_id}
                            onChange={(e) => setForm({ ...form, client_user_id: e.target.value })}
                            required
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                            data-testid="admin-invoice-client"
                        >
                            <option value="">Select…</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name || c.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-5">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Title</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                            data-testid="admin-invoice-title"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            required
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                            data-testid="admin-invoice-amount"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Cur</label>
                        <input
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                            data-testid="admin-invoice-currency"
                        />
                    </div>
                    <div className="md:col-span-12">
                        <button
                            type="submit"
                            className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3"
                            data-testid="admin-invoice-create"
                        >
                            Issue invoice
                        </button>
                    </div>
                </form>
            )}

            {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No invoices yet.</p>
            ) : (
                <div className="divide-y divide-border border border-border" data-testid="admin-invoices-list">
                    {invoices.map((inv) => (
                        <div key={inv.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-5">
                            <div className="md:col-span-7">
                                <p className="font-display text-xl">{inv.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(inv.created_at).toLocaleDateString()} ·{" "}
                                    {clients.find((c) => c.id === inv.client_user_id)?.email || inv.client_user_id}
                                </p>
                            </div>
                            <div className="md:col-span-3 font-mono-ui">
                                {inv.currency} {inv.amount.toFixed(2)}
                            </div>
                            <div className="md:col-span-2 text-right">
                                <span
                                    className={`text-[10px] uppercase tracking-[0.3em] border px-3 py-1 ${
                                        inv.status === "paid"
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border"
                                    }`}
                                >
                                    {inv.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
