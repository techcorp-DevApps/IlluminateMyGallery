import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const STATS = [
    {
        key: "bookings",
        label: "Total bookings",
        to: "/admin/bookings",
        hint: "All sessions",
    },
    {
        key: "pending_bookings",
        label: "Awaiting approval",
        to: "/admin/bookings?status=pending",
        hint: "Review",
    },
    {
        key: "approved_bookings",
        label: "Confirmed",
        to: "/admin/calendar",
        hint: "Open calendar",
    },
    {
        key: "clients",
        label: "Active clients",
        to: "/admin/clients",
        hint: "Manage",
    },
    {
        key: "galleries",
        label: "Delivered galleries",
        to: "/admin/galleries",
        hint: "Open galleries",
    },
    {
        key: "unpaid_invoices",
        label: "Unpaid invoices",
        to: "/admin/invoices?status=unpaid",
        hint: "Chase",
    },
];

export default function AdminOverview() {
    const [data, setData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/admin/overview").then((r) => setData(r.data));
    }, []);

    return (
        <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border"
            data-testid="admin-overview"
        >
            {STATS.map((s) => (
                <button
                    key={s.key}
                    type="button"
                    onClick={() => navigate(s.to)}
                    className="bg-background p-6 text-left group hover:bg-foreground hover:text-background transition-colors duration-300 focus:outline-none focus:bg-foreground focus:text-background"
                    data-testid={`overview-tile-${s.key}`}
                >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground group-hover:text-background/70 group-focus:text-background/70">
                        {s.label}
                    </p>
                    <p className="font-display text-5xl tracking-tighter mt-3">{data[s.key] ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] mt-3 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                        {s.hint} →
                    </p>
                </button>
            ))}
        </div>
    );
}
