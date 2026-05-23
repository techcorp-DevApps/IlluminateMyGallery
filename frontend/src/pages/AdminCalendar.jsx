import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../lib/api";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const STATUS_COLOR = {
    pending: "border-border",
    approved: "border-foreground bg-foreground text-background",
    rejected: "border-border line-through opacity-60",
    completed: "border-border bg-muted",
};

const STATUS_LABEL = {
    pending: "Awaiting approval",
    approved: "Confirmed",
    rejected: "Declined",
    completed: "Completed",
};

const NEXT_STATUS_OPTIONS = ["pending", "approved", "rejected", "completed"];

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

function prettyDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminCalendar() {
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [bookings, setBookings] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null); // ISO YYYY-MM-DD
    const [selectedBookingId, setSelectedBookingId] = useState(null);

    const refresh = useCallback(() => {
        api.get("/bookings").then((r) => setBookings(r.data));
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

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

    const dayBookings = selectedDate ? byDate[selectedDate] || [] : [];
    const selectedBooking = selectedBookingId
        ? bookings.find((b) => b.id === selectedBookingId)
        : null;

    const updateStatus = async (booking, status) => {
        await api.patch(`/bookings/${booking.id}/status?status=${status}`);
        refresh();
    };

    return (
        <div data-testid="admin-calendar" className="relative">
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
                    const isSelected = k === selectedDate;
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!d}
                            onClick={() => d && setSelectedDate(k)}
                            className={`text-left border-r border-b border-border min-h-[110px] p-2 align-top transition-colors ${
                                d
                                    ? `bg-background hover:bg-muted/50 cursor-pointer ${
                                          isSelected ? "ring-2 ring-foreground ring-inset" : ""
                                      }`
                                    : "bg-muted/40 cursor-default"
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
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDate(k);
                                            setSelectedBookingId(b.id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedDate(k);
                                                setSelectedBookingId(b.id);
                                            }
                                        }}
                                        key={b.id}
                                        className={`text-[10px] uppercase tracking-[0.15em] border px-1.5 py-1 truncate hover:opacity-80 ${STATUS_COLOR[b.status] || "border-border"}`}
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
                        </button>
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

            {/* Day detail panel */}
            {selectedDate && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 flex justify-end"
                    onClick={() => {
                        setSelectedDate(null);
                        setSelectedBookingId(null);
                    }}
                    data-testid="cal-day-panel-backdrop"
                >
                    <aside
                        className="bg-background w-full max-w-md h-full overflow-y-auto border-l border-border animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="cal-day-panel"
                    >
                        <div className="p-6 border-b border-border flex items-start justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    {dayBookings.length === 0
                                        ? "No bookings"
                                        : `${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"}`}
                                </p>
                                <h3 className="font-display text-3xl tracking-tighter mt-1">
                                    {prettyDate(selectedDate)}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedDate(null);
                                    setSelectedBookingId(null);
                                }}
                                className="p-1 hover:opacity-60"
                                aria-label="Close"
                                data-testid="cal-day-panel-close"
                            >
                                <X size={20} strokeWidth={1.25} />
                            </button>
                        </div>

                        {dayBookings.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">
                                Free day — no sessions booked.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {dayBookings
                                    .sort((a, b) =>
                                        (a.preferred_time || "").localeCompare(b.preferred_time || "")
                                    )
                                    .map((b) => {
                                        const expanded = b.id === selectedBookingId;
                                        return (
                                            <li
                                                key={b.id}
                                                className="p-6"
                                                data-testid={`cal-day-booking-${b.id}`}
                                            >
                                                <button
                                                    onClick={() =>
                                                        setSelectedBookingId(expanded ? null : b.id)
                                                    }
                                                    className="w-full text-left"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-mono-ui text-xs text-muted-foreground">
                                                                {b.preferred_time} · {b.duration_minutes} min
                                                            </p>
                                                            <p className="font-display text-2xl mt-1">
                                                                {b.package_name}
                                                            </p>
                                                            <p className="text-sm mt-1">
                                                                {b.client_name || b.client_email}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`text-[10px] uppercase tracking-[0.3em] border px-2 py-1 whitespace-nowrap ${
                                                                STATUS_COLOR[b.status] || "border-border"
                                                            }`}
                                                        >
                                                            {STATUS_LABEL[b.status] || b.status}
                                                        </span>
                                                    </div>
                                                </button>
                                                {expanded && (
                                                    <div
                                                        className="mt-4 pt-4 border-t border-border space-y-3 text-sm"
                                                        data-testid={`cal-booking-details-${b.id}`}
                                                    >
                                                        <p className="text-muted-foreground">{b.client_email}</p>
                                                        {b.client_phone && (
                                                            <p className="text-muted-foreground">
                                                                {b.client_phone}
                                                            </p>
                                                        )}
                                                        <p>
                                                            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mr-2">
                                                                Location
                                                            </span>
                                                            {b.location_address}
                                                            {b.suburb ? `, ${b.suburb}` : ""}
                                                        </p>
                                                        {b.notes && (
                                                            <p>
                                                                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mr-2">
                                                                    Notes
                                                                </span>
                                                                {b.notes}
                                                            </p>
                                                        )}
                                                        <p className="font-mono-ui">
                                                            AUD {b.estimated_price?.toFixed(2)} · via {b.source}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {NEXT_STATUS_OPTIONS.filter(
                                                                (s) => s !== b.status
                                                            ).map((s) => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => updateStatus(b, s)}
                                                                    className="text-[10px] uppercase tracking-[0.3em] border border-border px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
                                                                    data-testid={`cal-booking-${b.id}-set-${s}`}
                                                                >
                                                                    Set {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
}
