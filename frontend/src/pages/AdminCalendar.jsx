import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLOR = {
    pending: "border-border",
    approved: "border-foreground bg-foreground text-background",
    rejected: "border-border line-through opacity-60",
    completed: "border-border bg-muted",
};

function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(monthDate) {
    const first = startOfMonth(monthDate);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
        cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

function isoDate(d) {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminCalendar() {
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        api.get("/bookings").then((r) => setBookings(r.data));
    }, []);

    const byDate = useMemo(() => {
        const m = {};
        for (const b of bookings) {
            const k = b.preferred_date;
            if (!k) continue;
            (m[k] = m[k] || []).push(b);
        }
        return m;
    }, [bookings]);

    const grid = buildGrid(month);
    const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const today = isoDate(new Date());

    return (
        <div data-testid="admin-calendar">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The diary</p>
                    <h2 className="font-display text-4xl tracking-tighter mt-1">{monthLabel}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors"
                        data-testid="cal-prev"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} strokeWidth={1.25} />
                    </button>
                    <button
                        onClick={() => setMonth(startOfMonth(new Date()))}
                        className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.3em]"
                        data-testid="cal-today"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        className="border border-border p-2 hover:bg-foreground hover:text-background transition-colors"
                        data-testid="cal-next"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} strokeWidth={1.25} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-t border-l border-border">
                {DOW.map((d) => (
                    <div
                        key={d}
                        className="border-r border-b border-border p-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    >
                        {d}
                    </div>
                ))}
                {grid.map((d, i) => {
                    const k = isoDate(d);
                    const items = byDate[k] || [];
                    const isToday = k === today;
                    return (
                        <div
                            key={i}
                            className={`border-r border-b border-border min-h-[110px] p-2 align-top ${
                                d ? "bg-background" : "bg-muted/40"
                            }`}
                            data-testid={d ? `cal-day-${k}` : undefined}
                        >
                            {d && (
                                <p
                                    className={`font-mono-ui text-xs ${
                                        isToday ? "text-foreground font-semibold" : "text-muted-foreground"
                                    }`}
                                >
                                    {String(d.getDate()).padStart(2, "0")}
                                </p>
                            )}
                            <div className="space-y-1 mt-1">
                                {items.slice(0, 3).map((b) => (
                                    <div
                                        key={b.id}
                                        className={`text-[10px] uppercase tracking-[0.15em] border px-1.5 py-1 truncate ${STATUS_COLOR[b.status] || "border-border"}`}
                                        title={`${b.preferred_time} · ${b.package_name} · ${b.client_name || b.client_email}`}
                                        data-testid={`cal-event-${b.id}`}
                                    >
                                        {b.preferred_time} · {b.package_name}
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                                        +{items.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                <span>
                    <span className="inline-block border border-foreground bg-foreground text-background px-2 py-1 mr-2">
                        Approved
                    </span>
                </span>
                <span>
                    <span className="inline-block border border-border px-2 py-1 mr-2">Pending</span>
                </span>
                <span>
                    <span className="inline-block border border-border bg-muted px-2 py-1 mr-2">Completed</span>
                </span>
            </div>
        </div>
    );
}
