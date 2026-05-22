import { useEffect, useState } from "react";
import { api } from "../lib/api";

const STATS = [
    ["bookings", "Total bookings"],
    ["pending_bookings", "Awaiting approval"],
    ["approved_bookings", "Confirmed"],
    ["clients", "Active clients"],
    ["galleries", "Delivered galleries"],
    ["unpaid_invoices", "Unpaid invoices"],
];

export default function AdminOverview() {
    const [data, setData] = useState({});
    useEffect(() => {
        api.get("/admin/overview").then((r) => setData(r.data));
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border" data-testid="admin-overview">
            {STATS.map(([k, label]) => (
                <div key={k} className="bg-background p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
                    <p className="font-display text-5xl tracking-tighter mt-3">{data[k] ?? "—"}</p>
                </div>
            ))}
        </div>
    );
}
