import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const STATUSES = ["pending", "approved", "rejected", "completed"];

export default function AdminBookings() {
    const [rows, setRows] = useState([]);
    const refresh = useCallback(() => api.get("/bookings").then((r) => setRows(r.data)), []);
    useEffect(() => {
        refresh();
    }, [refresh]);

    const setStatus = async (b, status) => {
        await api.patch(`/bookings/${b.id}/status?status=${status}`);
        refresh();
    };

    if (!rows.length) {
        return <p className="text-muted-foreground text-center py-12">No bookings yet.</p>;
    }

    return (
        <div className="divide-y divide-border border border-border" data-testid="admin-bookings-list">
            {rows.map((b) => (
                <div key={b.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-5">
                    <div className="md:col-span-2 font-mono-ui text-xs">
                        {b.preferred_date}
                        <br />
                        {b.preferred_time}
                    </div>
                    <div className="md:col-span-4">
                        <p className="font-display text-xl">{b.client_name || b.client_email}</p>
                        <p className="text-xs text-muted-foreground">{b.client_email}</p>
                        <p className="text-sm mt-1">{b.package_name}</p>
                    </div>
                    <div className="md:col-span-3 text-sm text-muted-foreground">
                        {b.location_address}
                        <br />
                        {b.suburb}
                    </div>
                    <div className="md:col-span-3 flex flex-wrap gap-2 items-start justify-end">
                        <span
                            className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 ${
                                b.status === "approved"
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border"
                            }`}
                        >
                            {b.status}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-1">
                            via {b.source}
                        </span>
                        <select
                            value={b.status}
                            onChange={(e) => setStatus(b, e.target.value)}
                            className="text-xs border border-border bg-background px-2 py-1"
                            data-testid={`admin-booking-status-${b.id}`}
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
}
