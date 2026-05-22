import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function CustomerInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [search] = useSearchParams();
    const sessionId = search.get("session_id");
    const [statusMsg, setStatusMsg] = useState("");

    const refresh = useCallback(() => {
        api.get("/invoices/mine").then((r) => setInvoices(r.data));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Poll payment status if returning from Stripe.
    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        let attempts = 0;
        const poll = async () => {
            if (cancelled || attempts >= 6) {
                if (attempts >= 6 && !cancelled)
                    setStatusMsg("Payment status taking longer than expected. Check back shortly.");
                return;
            }
            attempts += 1;
            try {
                const { data } = await api.get(`/payments/status/${sessionId}`);
                if (data.payment_status === "paid") {
                    setStatusMsg("Payment received — thank you.");
                    refresh();
                    return;
                }
                if (data.status === "expired") {
                    setStatusMsg("Payment session expired. Please try again.");
                    return;
                }
                setStatusMsg("Confirming payment…");
                setTimeout(poll, 2000);
            } catch {
                setStatusMsg("Couldn't verify payment status.");
            }
        };
        poll();
        return () => {
            cancelled = true;
        };
    }, [sessionId, refresh]);

    const pay = async (inv) => {
        const origin = window.location.origin;
        try {
            const { data } = await api.post("/payments/checkout/invoice", {
                invoice_id: inv.id,
                origin_url: origin,
            });
            window.location.href = data.url;
        } catch (e) {
            setStatusMsg(e.response?.data?.detail || "Could not open checkout.");
        }
    };

    if (!invoices.length && !statusMsg) {
        return (
            <div className="border border-border p-12 text-center" data-testid="invoices-empty">
                <p className="font-display text-3xl">No invoices yet.</p>
            </div>
        );
    }

    return (
        <div>
            {statusMsg && (
                <p
                    className="border border-border p-4 mb-4 text-sm font-mono-ui"
                    data-testid="invoice-status-msg"
                >
                    {statusMsg}
                </p>
            )}
            <div className="divide-y divide-border border border-border" data-testid="invoices-list">
                {invoices.map((inv) => (
                    <div key={inv.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center">
                        <div className="md:col-span-6">
                            <p className="font-display text-2xl">{inv.title}</p>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                Issued {new Date(inv.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="md:col-span-3 font-mono-ui text-lg">
                            {inv.currency} {inv.amount.toFixed(2)}
                        </div>
                        <div className="md:col-span-3 text-right">
                            {inv.status === "paid" ? (
                                <span className="text-[10px] uppercase tracking-[0.3em] border border-foreground bg-foreground text-background px-3 py-2">
                                    Paid
                                </span>
                            ) : (
                                <button
                                    onClick={() => pay(inv)}
                                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-6 py-3 hover:opacity-90"
                                    data-testid={`invoice-pay-${inv.id}`}
                                >
                                    Pay AUD {inv.amount.toFixed(0)} →
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
