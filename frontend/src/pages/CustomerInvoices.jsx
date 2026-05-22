import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

function CopyBtn({ value, label }) {
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
            onClick={copy}
            className="text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-1 hover:bg-foreground hover:text-background transition-colors"
            data-testid={`copy-${label}`}
        >
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

function InvoiceCard({ inv, onMarkPaid }) {
    const pi = inv.payment_instructions || {};
    const ref = inv.reference || inv.id;
    return (
        <article className="border border-border p-6 md:p-8" data-testid={`invoice-card-${inv.id}`}>
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Invoice {ref}</p>
                    <h2 className="font-display text-3xl mt-2">{inv.title}</h2>
                    {inv.description && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-xl">{inv.description}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3">
                        Issued {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-display text-4xl">{inv.currency} {inv.amount.toFixed(2)}</p>
                    <span
                        className={`mt-2 inline-block text-[10px] uppercase tracking-[0.3em] px-3 py-1 border ${
                            inv.status === "paid"
                                ? "border-foreground bg-foreground text-background"
                                : "border-border"
                        }`}
                        data-testid={`invoice-status-${inv.id}`}
                    >
                        {inv.status === "paid"
                            ? `Paid ${inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ""}`
                            : "Awaiting payment"}
                    </span>
                </div>
            </div>

            {inv.status !== "paid" && (
                <div className="mt-6 border-t border-border pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pay by PayID (fastest)</p>
                        <div className="mt-3 font-mono-ui text-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span>
                                    PayID: <strong>{pi.payid || "—"}</strong>
                                </span>
                                {pi.payid && <CopyBtn value={pi.payid} label={`payid-${inv.id}`} />}
                            </div>
                            <div>Name: {pi.business_name}</div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-border">
                                <span>
                                    Reference: <strong>{ref}</strong>
                                </span>
                                <CopyBtn value={ref} label={`ref-${inv.id}`} />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground pt-1">
                                Please include this reference exactly when paying.
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Or bank transfer</p>
                        <div className="mt-3 font-mono-ui text-sm space-y-2">
                            <div>BSB: {pi.bsb || "—"}</div>
                            <div>Account: {pi.account_number || "—"}</div>
                            <div>Name: {pi.account_name}</div>
                            <div className="pt-2 border-t border-dashed border-border">
                                Reference: <strong>{ref}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {inv.status !== "paid" && onMarkPaid && (
                <button
                    onClick={() => onMarkPaid(inv)}
                    className="mt-6 text-[10px] uppercase tracking-[0.3em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                    data-testid={`invoice-admin-mark-paid-${inv.id}`}
                >
                    Mark as paid (admin)
                </button>
            )}
        </article>
    );
}

export default function CustomerInvoices() {
    const [invoices, setInvoices] = useState([]);

    const refresh = useCallback(() => {
        api.get("/invoices/mine").then((r) => setInvoices(r.data));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!invoices.length) {
        return (
            <div className="border border-border p-12 text-center" data-testid="invoices-empty">
                <p className="font-display text-3xl">No invoices yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="invoices-list">
            {invoices.map((inv) => (
                <InvoiceCard key={inv.id} inv={inv} />
            ))}
        </div>
    );
}

export { InvoiceCard };
