import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Calendar } from "../components/ui/calendar";

export default function BookSession() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [services, setServices] = useState({ packages: [], addons: [], categories: [] });
    const [pkgId, setPkgId] = useState("");
    const [date, setDate] = useState(null);
    const [time, setTime] = useState("10:00");
    const [address, setAddress] = useState("");
    const [suburb, setSuburb] = useState("");
    const [notes, setNotes] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        api.get("/services/active").then((r) => setServices(r.data));
    }, []);

    const pkg = services.packages.find((p) => p.package_id === pkgId);

    const submit = async (e) => {
        e.preventDefault();
        if (!user) {
            nav("/login");
            return;
        }
        if (!pkg || !date) {
            setErr("Please pick a package and date.");
            return;
        }
        setBusy(true);
        setErr("");
        try {
            const payload = {
                package_id: pkg.package_id,
                service_category: pkg.service_category,
                preferred_date: date.toISOString().slice(0, 10),
                preferred_time: time,
                duration_minutes: pkg.duration_minutes,
                location_address: address,
                suburb,
                notes,
            };
            await api.post("/bookings", payload);
            setConfirmed(true);
        } catch (e) {
            setErr(e.response?.data?.detail || "Could not submit booking.");
        } finally {
            setBusy(false);
        }
    };

    if (confirmed) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Request received</p>
                <h1 className="font-display text-6xl tracking-tighter mt-4">Thank you.</h1>
                <p className="mt-6 text-muted-foreground">
                    Your session request has been sent to the studio. We'll confirm by email shortly. You'll
                    also find this booking — and any contract or invoice that follows — in your portal.
                </p>
                <button
                    onClick={() => nav("/dashboard/bookings")}
                    className="mt-10 bg-foreground text-background text-xs uppercase tracking-[0.3em] px-8 py-4"
                    data-testid="booking-go-dashboard"
                >
                    Open my portal
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Booking enquiry</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tighter mt-3 leading-[1]">
                Reserve a session.
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl">
                Prefer a conversation? Open Luma in the bottom right to talk it through. Otherwise, fill in
                the form below.
            </p>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-12" data-testid="booking-form">
                <div className="md:col-span-7 space-y-8">
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Package</label>
                        <div className="mt-3 grid grid-cols-1 gap-3">
                            {services.packages.map((p) => (
                                <button
                                    type="button"
                                    key={p.package_id}
                                    onClick={() => setPkgId(p.package_id)}
                                    className={`text-left border p-4 transition-colors ${
                                        p.package_id === pkgId
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border hover:border-foreground"
                                    }`}
                                    data-testid={`booking-package-${p.package_id}`}
                                >
                                    <p className="font-display text-2xl">{p.package_name}</p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] mt-1 opacity-70">
                                        {p.service_category} · {p.duration_minutes} min · AUD {p.base_price.toFixed(0)}
                                    </p>
                                    <p className="text-sm mt-2 opacity-90">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                Start time (HH:MM)
                            </label>
                            <input
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="14:30"
                                className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                                data-testid="booking-time"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Suburb</label>
                            <input
                                value={suburb}
                                onChange={(e) => setSuburb(e.target.value)}
                                placeholder="Fitzroy"
                                className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                                data-testid="booking-suburb"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            Location / address
                        </label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="14 Brunswick Lane, or 'Studio'"
                            className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                            data-testid="booking-address"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-transparent border border-border p-3 mt-1 focus:outline-none focus:border-foreground"
                            data-testid="booking-notes"
                        />
                    </div>

                    {err && <p className="text-sm text-destructive" data-testid="booking-error">{err}</p>}

                    <button
                        type="submit"
                        disabled={busy}
                        className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-10 py-4 disabled:opacity-50"
                        data-testid="booking-submit"
                    >
                        {busy ? "Sending…" : "Send booking enquiry"}
                    </button>
                </div>

                <div className="md:col-span-5">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Preferred date</label>
                    <div className="border border-border mt-3 p-2 inline-block bg-background">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                            data-testid="booking-calendar"
                        />
                    </div>
                    {pkg && (
                        <div className="mt-8 border border-border p-6">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Summary</p>
                            <p className="font-display text-3xl mt-2">{pkg.package_name}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {pkg.duration_minutes} minutes · AUD {pkg.base_price.toFixed(2)}
                            </p>
                            {date && (
                                <p className="text-sm mt-3">
                                    {date.toDateString()} · {time}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
