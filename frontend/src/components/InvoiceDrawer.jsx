import { useEffect, useState } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { api } from "../lib/api";

function CopyBtn({ value, testId }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };
    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-1 hover:bg-foreground hover:text-background transition-colors"
            data-testid={testId}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

/**
 * Slide-out drawer showing a full invoice breakdown.
 *
 * Props:
 *   invoiceId — id of the invoice to load
 *   onClose   — close handler
 *   isAdmin   — true to show admin actions (mark paid / mark unpaid)
 *   onChanged — callback after any mutation so the parent list refreshes
 */
export default function InvoiceDrawer({ invoiceId, onClose, isAdmin = false, onChanged }) {
    const [inv, setInv] = useState(null);
    const [booking, setBooking] = useState(null);
    const [client, setClient] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!invoiceId) return;
        let cancelled = false;
        const load = async () => {
            setErr("");
            try {
                const { data } = await api.get(`/invoices/${invoiceId}`);
                if (cancelled) return;
                setInv(data);
                if (data.booking_id) {
                    try {
                        const { data: b } = await api.get(`/bookings/${data.booking_id}`);
                        if (!cancelled) setBooking(b);
                    } catch {
                        /* booking may have been removed */
                    }
                }
                if (isAdmin && data.client_user_id) {
                    try {
                        const { data: profile } = await api.get(
                            `/admin/clients/${data.client_user_id}`
                        );
                        if (!cancelled) setClient(profile.client);
                    } catch {
                        /* ignore */
                    }
                }
            } catch (ex) {
                setErr(ex.response?.data?.detail || "Could not load invoice");
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [invoiceId, isAdmin]);

    const markPaid = async () => {
        setBusy(true);
        try {
            const { data } = await api.post(`/invoices/${invoiceId}/mark-paid`);
            setInv(data);
            onChanged?.();
        } finally {
            setBusy(false);
        }
    };
    const markUnpaid = async () => {
        setBusy(true);
        try {
            const { data } = await api.post(`/invoices/${invoiceId}/mark-unpaid`);
            setInv(data);
            onChanged?.();
        } finally {
            setBusy(false);
        }
    };

    if (!invoiceId) return null;

    return (
        <div
            className="fixed inset-0 bg-black/30 z-40 flex justify-end"
            onClick={onClose}
            data-testid="invoice-drawer-backdrop"
        >
            <aside
                className="bg-background w-full max-w-xl h-full overflow-y-auto border-l border-border animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                data-testid="invoice-drawer"
            >
                <div className="p-6 border-b border-border flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            Invoice {inv?.reference || ""}
                        </p>
                        <h2 className="font-display text-3xl tracking-tighter mt-1">
                            {inv?.title || "Loading…"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:opacity-60"
                        aria-label="Close"
                        data-testid="invoice-drawer-close"
                    >
                        <X size={20} strokeWidth={1.25} />
                    </button>
                </div>

                {err && (
                    <p className="p-6 text-sm text-destructive" data-testid="invoice-drawer-error">
                        {err}
                    </p>
                )}

                {inv && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <p className="font-display text-5xl">
                                    {inv.currency} {inv.amount.toFixed(2)}
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                                    Issued {new Date(inv.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span
                                className={`text-[10px] uppercase tracking-[0.3em] border px-3 py-1.5 ${
                                    inv.status === "paid"
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border"
                                }`}
                                data-testid={`invoice-drawer-status-${inv.id}`}
                            >
                                {inv.status === "paid"
                                    ? `Paid ${
                                          inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ""
                                      }`
                                    : "Awaiting payment"}
                            </span>
                        </div>

                        {inv.description && (
                            <section>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    Details
                                </p>
                                <p className="text-sm mt-2 leading-relaxed">{inv.description}</p>
                            </section>
                        )}

                        {/* Line item summary (single-line invoice today; structured for future expansion) */}
                        <section>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                                Line items
                            </p>
                            <div className="border border-border divide-y divide-border">
                                <div className="grid grid-cols-12 p-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    <span className="col-span-8">Item</span>
                                    <span className="col-span-4 text-right">Amount</span>
                                </div>
                                <div className="grid grid-cols-12 p-3 text-sm">
                                    <span className="col-span-8">{inv.title}</span>
                                    <span className="col-span-4 text-right font-mono-ui">
                                        {inv.currency} {inv.amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-12 p-3 text-sm font-mono-ui bg-muted/40">
                                    <span className="col-span-8 text-[10px] uppercase tracking-[0.3em] pt-1">
                                        Total
                                    </span>
                                    <span className="col-span-4 text-right">
                                        {inv.currency} {inv.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {booking && (
                            <section>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                                    Linked booking
                                </p>
                                <div className="border border-border p-4 text-sm space-y-1">
                                    <p className="font-display text-lg">{booking.package_name}</p>
                                    <p className="text-muted-foreground">
                                        {booking.preferred_date} · {booking.preferred_time} ·{" "}
                                        {booking.duration_minutes} min
                                    </p>
                                    <p className="text-muted-foreground">
                                        {booking.location_address}
                                        {booking.suburb ? `, ${booking.suburb}` : ""}
                                    </p>
                                </div>
                            </section>
                        )}

                        {isAdmin && client && (
                            <section>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                                    Client
                                </p>
                                <div className="border border-border p-4 text-sm space-y-1">
                                    <p className="font-display text-lg">{client.name || client.email}</p>
                                    <p className="text-muted-foreground">{client.email}</p>
                                    {client.phone && (
                                        <p className="text-muted-foreground">{client.phone}</p>
                                    )}
                                </div>
                            </section>
                        )}

                        {inv.status !== "paid" && inv.payment_instructions && (
                            <section>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                                    How to pay
                                </p>
                                <div className="border border-border p-4 space-y-4 text-sm font-mono-ui">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                            PayID (instant, recommended)
                                        </p>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <span>
                                                <strong>{inv.payment_instructions.payid || "—"}</strong>
                                            </span>
                                            {inv.payment_instructions.payid && (
                                                <CopyBtn
                                                    value={inv.payment_instructions.payid}
                                                    testId={`drawer-copy-payid-${inv.id}`}
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Name on file: {inv.payment_instructions.business_name}
                                        </p>
                                    </div>
                                    <div className="border-t border-dashed border-border pt-3">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                            Bank transfer (fallback)
                                        </p>
                                        <p className="mt-1">BSB: {inv.payment_instructions.bsb || "—"}</p>
                                        <p>Acc: {inv.payment_instructions.account_number || "—"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Account name: {inv.payment_instructions.account_name}
                                        </p>
                                    </div>
                                    <div className="border-t border-dashed border-border pt-3">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                            Payment reference — please include exactly
                                        </p>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <span>
                                                <strong>{inv.reference}</strong>
                                            </span>
                                            <CopyBtn
                                                value={inv.reference}
                                                testId={`drawer-copy-ref-${inv.id}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {isAdmin && (
                            <section className="pt-4 border-t border-border flex flex-wrap gap-2">
                                {inv.status !== "paid" ? (
                                    <button
                                        onClick={markPaid}
                                        disabled={busy}
                                        className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-5 py-2 disabled:opacity-50"
                                        data-testid={`drawer-mark-paid-${inv.id}`}
                                    >
                                        {busy ? "Saving…" : "Mark as paid"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={markUnpaid}
                                        disabled={busy}
                                        className="text-xs uppercase tracking-[0.3em] border border-border px-5 py-2 disabled:opacity-50"
                                        data-testid={`drawer-mark-unpaid-${inv.id}`}
                                    >
                                        {busy ? "Saving…" : "Mark as unpaid"}
                                    </button>
                                )}
                                <a
                                    href={`mailto:${client?.email || ""}?subject=Invoice ${inv.reference}&body=Hi ${client?.name || ""}%2C%0A%0AYour invoice ${inv.reference} for ${inv.currency} ${inv.amount.toFixed(2)} is ready.%0APay via PayID ${inv.payment_instructions?.payid || ""} using reference ${inv.reference}.%0A%0AIlluminate Studios`}
                                    className="text-xs uppercase tracking-[0.3em] border border-border px-5 py-2 inline-flex items-center gap-2"
                                    data-testid={`drawer-email-${inv.id}`}
                                >
                                    Email client <ExternalLink size={12} />
                                </a>
                            </section>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
}
