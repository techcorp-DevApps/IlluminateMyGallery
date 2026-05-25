import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api, photoUrl } from "../lib/api";
import { Plus, ChevronLeft, X } from "lucide-react";
import ProtectedImage from "../components/ProtectedImage";

const EMPTY_FORM = {
    title: "",
    description: "",
    client_user_id: "",
    booking_id: "",
    allow_downloads: false,
};

function GalleryForm({ initial, clients, bookingsByClient, onCancel, onSave }) {
    const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
            await onSave({ ...form, booking_id: form.booking_id || null });
        } catch (ex) {
            setErr(ex.response?.data?.detail || "Could not save gallery");
        } finally {
            setBusy(false);
        }
    };

    const bookings = form.client_user_id ? bookingsByClient[form.client_user_id] || [] : [];

    return (
        <form
            onSubmit={submit}
            className="border border-foreground p-6 mb-6 space-y-4 bg-muted/20"
            data-testid="admin-gallery-form"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Title
                    </label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                        required
                        data-testid="admin-gallery-title"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Client
                    </label>
                    <select
                        value={form.client_user_id}
                        onChange={(e) =>
                            setForm({ ...form, client_user_id: e.target.value, booking_id: "" })
                        }
                        required
                        className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                        data-testid="admin-gallery-client"
                    >
                        <option value="">Select a client…</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name || c.email}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Linked booking (optional — auto-fills package & date)
                    </label>
                    <select
                        value={form.booking_id}
                        onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                        disabled={!form.client_user_id || bookings.length === 0}
                        className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none disabled:opacity-50"
                        data-testid="admin-gallery-booking"
                    >
                        <option value="">No booking linked</option>
                        {bookings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.preferred_date} · {b.package_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <label className="text-xs flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.allow_downloads}
                            onChange={(e) =>
                                setForm({ ...form, allow_downloads: e.target.checked })
                            }
                            data-testid="admin-gallery-allow-downloads"
                        />
                        <span>
                            Allow client downloads
                            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">
                                Enable when digital files are part of the package
                            </span>
                        </span>
                    </label>
                </div>
            </div>
            <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Description
                </label>
                <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                    data-testid="admin-gallery-desc"
                />
            </div>
            {err && (
                <p className="text-sm text-destructive" data-testid="admin-gallery-error">
                    {err}
                </p>
            )}
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3 disabled:opacity-50"
                    data-testid="admin-gallery-save"
                >
                    {busy ? "Saving…" : "Save gallery"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs uppercase tracking-[0.3em] border border-border px-6 py-3"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function GalleryCard({ g, onOpen }) {
    return (
        <button
            type="button"
            onClick={() => onOpen(g.id)}
            className="text-left group"
            data-testid={`admin-gallery-card-${g.id}`}
        >
            <div className="aspect-[4/5] bg-muted overflow-hidden relative">
                {g.cover_blob_id ? (
                    <ProtectedImage
                        src={photoUrl(g.cover_blob_id)}
                        alt={g.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Empty
                    </div>
                )}
                {g.allow_downloads ? (
                    <span className="absolute top-2 right-2 text-[9px] uppercase tracking-[0.3em] bg-foreground text-background px-2 py-1">
                        Downloads on
                    </span>
                ) : null}
            </div>
            <p className="font-display text-xl mt-3">{g.title}</p>
            <div className="mt-1 space-y-0.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                <p>{g.photo_count} photographs</p>
                {g.client_name && <p>For · {g.client_name}</p>}
                {g.package_name && <p>{g.package_name}</p>}
                {g.booking_date && <p>Session · {g.booking_date}</p>}
                {g.invoice_reference && <p>Invoice · {g.invoice_reference}</p>}
            </div>
        </button>
    );
}

export default function AdminGalleries() {
    const [galleries, setGalleries] = useState([]);
    const [clients, setClients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [creating, setCreating] = useState(false);
    const [editingMeta, setEditingMeta] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [active, setActive] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const refresh = useCallback(async () => {
        const [g, c, b] = await Promise.all([
            api.get("/galleries"),
            api.get("/admin/clients"),
            api.get("/bookings"),
        ]);
        setGalleries(g.data);
        setClients(c.data);
        setBookings(b.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const fromUrl = searchParams.get("gallery");
        if (fromUrl && fromUrl !== activeId) setActiveId(fromUrl);
    }, [searchParams, activeId]);

    useEffect(() => {
        if (!activeId) {
            setActive(null);
            return;
        }
        api.get(`/galleries/${activeId}`).then((r) => setActive(r.data));
    }, [activeId, galleries]);

    const bookingsByClient = bookings.reduce((acc, b) => {
        (acc[b.user_id] = acc[b.user_id] || []).push(b);
        return acc;
    }, {});

    const createGallery = async (payload) => {
        const { data } = await api.post("/galleries", payload);
        setCreating(false);
        await refresh();
        setActiveId(data.id);
    };

    const updateGalleryMeta = async (payload) => {
        await api.patch(`/galleries/${activeId}`, payload);
        setEditingMeta(false);
        await refresh();
        const r = await api.get(`/galleries/${activeId}`);
        setActive(r.data);
    };

    const upload = async (e) => {
        const files = Array.from(e.target.files || []);
        for (const f of files) {
            const fd = new FormData();
            fd.append("file", f);
            await api.post(`/galleries/${activeId}/photos`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        e.target.value = "";
        await refresh();
        const r = await api.get(`/galleries/${activeId}`);
        setActive(r.data);
    };

    const deletePhoto = async (photoId) => {
        await api.delete(`/galleries/${activeId}/photos/${photoId}`);
        const r = await api.get(`/galleries/${activeId}`);
        setActive(r.data);
        refresh();
    };

    const deleteGallery = async () => {
        if (!window.confirm("Delete this gallery and all its photos? This cannot be undone.")) return;
        await api.delete(`/galleries/${activeId}`);
        setActiveId(null);
        refresh();
    };

    // ---- Detail view ----
    if (active) {
        return (
            <div>
                <button
                    onClick={() => {
                        setActiveId(null);
                        setEditingMeta(false);
                        if (searchParams.get("gallery")) setSearchParams({});
                    }}
                    className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                    data-testid="admin-gallery-back"
                >
                    <ChevronLeft size={14} strokeWidth={1.25} /> Galleries
                </button>

                <div className="flex flex-wrap items-end justify-between mt-4 gap-4">
                    <div>
                        <h2 className="font-display text-4xl">{active.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            {active.client_name && <span>For · {active.client_name}</span>}
                            {active.package_name && <span>{active.package_name}</span>}
                            {active.booking_date && <span>Session · {active.booking_date}</span>}
                            {active.invoice_reference && (
                                <span>Invoice · {active.invoice_reference}</span>
                            )}
                            <span
                                className={`border px-2 py-0.5 ${
                                    active.allow_downloads
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-border"
                                }`}
                            >
                                Downloads {active.allow_downloads ? "on" : "off"}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditingMeta((v) => !v)}
                            className="text-xs uppercase tracking-[0.3em] border border-border px-4 py-2"
                            data-testid="admin-gallery-edit-meta"
                        >
                            {editingMeta ? "Cancel" : "Edit details"}
                        </button>
                        <button
                            onClick={deleteGallery}
                            className="text-xs uppercase tracking-[0.3em] text-destructive border border-destructive px-4 py-2"
                            data-testid="admin-gallery-delete"
                        >
                            Delete gallery
                        </button>
                    </div>
                </div>

                {editingMeta && (
                    <div className="mt-6">
                        <GalleryForm
                            initial={{
                                title: active.title,
                                description: active.description || "",
                                client_user_id: active.client_user_id,
                                booking_id: active.booking_id || "",
                                allow_downloads: active.allow_downloads,
                            }}
                            clients={clients}
                            bookingsByClient={bookingsByClient}
                            onCancel={() => setEditingMeta(false)}
                            onSave={updateGalleryMeta}
                        />
                    </div>
                )}

                <label
                    className="inline-block mt-6 border border-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] cursor-pointer hover:bg-foreground hover:text-background transition-colors"
                    data-testid="admin-gallery-upload-label"
                >
                    + Upload photos
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={upload}
                        data-testid="admin-gallery-upload-input"
                    />
                </label>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-8">
                    {(active.photos || []).map((p) => (
                        <div key={p.id} className="relative group">
                            <ProtectedImage
                                src={photoUrl(p.blob_id)}
                                alt={p.filename}
                                className="w-full aspect-square object-cover"
                            />
                            <button
                                onClick={() => deletePhoto(p.id)}
                                className="absolute top-1 right-1 bg-foreground text-background text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100"
                                data-testid={`admin-photo-delete-${p.id}`}
                                aria-label="Delete photo"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ---- List view ----
    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {galleries.length} galleries
                </p>
                {!creating && (
                    <button
                        onClick={() => setCreating(true)}
                        className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2 inline-flex items-center gap-2"
                        data-testid="admin-gallery-new-btn"
                    >
                        <Plus size={14} strokeWidth={1.5} /> New gallery
                    </button>
                )}
            </div>

            {creating && (
                <GalleryForm
                    initial={EMPTY_FORM}
                    clients={clients}
                    bookingsByClient={bookingsByClient}
                    onCancel={() => setCreating(false)}
                    onSave={createGallery}
                />
            )}

            {galleries.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No galleries yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {galleries.map((g) => (
                        <GalleryCard key={g.id} g={g} onOpen={setActiveId} />
                    ))}
                </div>
            )}
        </div>
    );
}
