import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import InvoiceDrawer from "../components/InvoiceDrawer";

function InvoiceRow({ inv, onOpen }) {
    return (
        <button
            type="button"
            onClick={() => onOpen(inv.id)}
            className="w-full text-left grid grid-cols-1 md:grid-cols-12 gap-3 p-5 hover:bg-muted/40 transition-colors"
            data-testid={`invoice-row-${inv.id}`}
        >
            <div className="md:col-span-3 font-mono-ui text-xs text-muted-foreground">
                <p>{inv.reference}</p>
                <p className="mt-1">{new Date(inv.created_at).toLocaleDateString()}</p>
            </div>
            <div className="md:col-span-5">
                <p className="font-display text-2xl">{inv.title}</p>
                {inv.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {inv.description}
                    </p>
                )}
            </div>
            <div className="md:col-span-4 flex justify-end items-start gap-3">
                <span className="font-display text-3xl">
                    {inv.currency} {inv.amount.toFixed(2)}
                </span>
                <span
                    className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 whitespace-nowrap ${
                        inv.status === "paid"
                            ? "border-foreground bg-foreground text-background"
                            : "border-border"
                    }`}
                    data-testid={`invoice-status-${inv.id}`}
                >
                    {inv.status === "paid" ? "Paid" : "Pay now"}
                </span>
            </div>
        </button>
    );
}

export default function CustomerInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [activeId, setActiveId] = useState(null);

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
        <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Tap an invoice to see the full breakdown and payment details.
            </p>
            <div className="border border-border divide-y divide-border" data-testid="invoices-list">
                {invoices.map((inv) => (
                    <InvoiceRow key={inv.id} inv={inv} onOpen={setActiveId} />
                ))}
            </div>
            {activeId && (
                <InvoiceDrawer
                    invoiceId={activeId}
                    onClose={() => setActiveId(null)}
                    onChanged={refresh}
                />
            )}
        </div>
    );
}
