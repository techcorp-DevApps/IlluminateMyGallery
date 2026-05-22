import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { InvoiceCard } from "./CustomerInvoices";

export default function AdminInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        client_user_id: "",
        title: "",
        amount: 0,
        currency: "AUD",
        description: "",
    });

    const refresh = useCallback(async () => {
        const [i, c, b] = await Promise.all([
            api.get("/invoices"),
            api.get("/admin/clients"),
            api.get("/bookings"),
        ]);
        setInvoices(i.data);
        setClients(c.data);
        setBookings(b.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const create = async (e) => {
        e.preventDefault();
        await api.post("/invoices", { ...form, amount: parseFloat(form.amount) });
        setForm({ client_user_id: "", title: "", amount: 0, currency: "AUD", description: "" });
        setCreating(false);
        refresh();
    };

    const autoFromBooking = async (bid) => {
        if (!bid) return;
        await api.post(`/invoices/auto-from-booking/${bid}`);
        refresh();
    };

    const markPaid = async (inv) => {
        await api.post(`/invoices/${inv.id}/mark-paid`);
        refresh();
    };

    const eligibleBookings = bookings.filter(
        (b) => b.status === "approved" || b.status === "pending"
    );

    return (
        <div>
            <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {invoices.length} invoices · {invoices.filter((i) => i.status === "unpaid").length} unpaid
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                    {eligibleBookings.length > 0 && (
                        <select
                            onChange={(e) => {
                                autoFromBooking(e.target.value);
                                e.target.value = "";
                            }}
                            className="text-xs border border-border bg-background px-3 py-2"
                            data-testid="admin-invoice-auto-from-booking"
                            defaultValue=""
                        >
                            <option value="" disabled>
                                + Auto-invoice from booking…
                            </option>
                            {eligibleBookings.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.client_name || b.client_email} · {b.package_name} · {b.preferred_date} · AUD{" "}
                                    {b.estimated_price?.toFixed(0)}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setCreating((v) => !v)}
                        className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                        data-testid="admin-invoice-new-btn"
                    >
                        {creating ? "Cancel" : "+ Custom invoice"}
                    </button>
                </div>
            </div>

            {creating && (
                <form
                    onSubmit={create}
                    className="border border-border p-6 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4"
                    data-testid="admin-invoice-form"
                >
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
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Description (shown to client)</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-transparent border border-border p-2 mt-1"
                            data-testid="admin-invoice-description"
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
                <div className="space-y-6" data-testid="admin-invoices-list">
                    {invoices.map((inv) => (
                        <InvoiceCard key={inv.id} inv={inv} onMarkPaid={markPaid} />
                    ))}
                </div>
            )}
        </div>
    );
}
