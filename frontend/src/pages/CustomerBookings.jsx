import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

const STATUS_LABEL = {
    pending: "Awaiting studio",
    approved: "Confirmed",
    rejected: "Declined",
    completed: "Completed",
};

export default function CustomerBookings() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        api.get("/bookings/mine").then((r) => setItems(r.data));
    }, []);

    if (!items.length) {
        return (
            <div className="border border-border p-12 text-center" data-testid="bookings-empty">
                <p className="font-display text-3xl">No sessions yet.</p>
                <p className="text-muted-foreground mt-3">When you book a session it will appear here.</p>
                <Link
                    to="/book"
                    className="inline-block mt-6 bg-foreground text-background px-6 py-3 text-xs uppercase tracking-[0.3em]"
                    data-testid="bookings-book-btn"
                >
                    Book a session →
                </Link>
            </div>
        );
    }

    return (
        <div className="divide-y divide-border border border-border" data-testid="bookings-list">
            {items.map((b) => (
                <div key={b.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6">
                    <div className="md:col-span-2 font-mono-ui text-xs text-muted-foreground">
                        {b.preferred_date}<br />{b.preferred_time}
                    </div>
                    <div className="md:col-span-5">
                        <p className="font-display text-2xl">{b.package_name}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
                            {b.service_category} · {b.duration_minutes} min
                        </p>
                    </div>
                    <div className="md:col-span-3 text-sm text-muted-foreground">
                        {b.location_address}
                        <br />
                        {b.suburb}
                    </div>
                    <div className="md:col-span-2 text-right">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                        <p className="mt-1 text-sm">{STATUS_LABEL[b.status] || b.status}</p>
                        <p className="font-mono-ui text-xs mt-3">AUD {b.estimated_price?.toFixed(0)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
