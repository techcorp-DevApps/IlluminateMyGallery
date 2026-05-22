import { useEffect, useState, useCallback } from "react";
import { api, photoUrl } from "../lib/api";

export default function AdminGalleries() {
    const [galleries, setGalleries] = useState([]);
    const [clients, setClients] = useState([]);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [clientId, setClientId] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [active, setActive] = useState(null);

    const refresh = useCallback(async () => {
        const [g, c] = await Promise.all([api.get("/galleries"), api.get("/admin/clients")]);
        setGalleries(g.data);
        setClients(c.data);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!activeId) {
            setActive(null);
            return;
        }
        api.get(`/galleries/${activeId}`).then((r) => setActive(r.data));
    }, [activeId, galleries]);

    const create = async (e) => {
        e.preventDefault();
        if (!title || !clientId) return;
        await api.post("/galleries", { title, description: desc, client_user_id: clientId });
        setTitle("");
        setDesc("");
        setClientId("");
        setCreating(false);
        refresh();
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
        refresh();
        const r = await api.get(`/galleries/${activeId}`);
        setActive(r.data);
    };

    const deletePhoto = async (photoId) => {
        await api.delete(`/galleries/${activeId}/photos/${photoId}`);
        const r = await api.get(`/galleries/${activeId}`);
        setActive(r.data);
        refresh();
    };

    if (active) {
        return (
            <div>
                <button
                    onClick={() => setActiveId(null)}
                    className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
                    data-testid="admin-gallery-back"
                >
                    ← Galleries
                </button>
                <h2 className="font-display text-4xl mt-4">{active.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
                <label
                    className="inline-block mt-6 border border-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] cursor-pointer hover:bg-foreground hover:text-background transition-colors"
                    data-testid="admin-gallery-upload-label"
                >
                    Upload photos
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
                    {active.photos.map((p) => (
                        <div key={p.id} className="relative group">
                            <img
                                src={photoUrl(p.blob_id)}
                                alt={p.filename}
                                className="w-full aspect-square object-cover"
                            />
                            <button
                                onClick={() => deletePhoto(p.id)}
                                className="absolute top-1 right-1 bg-foreground text-background text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100"
                                data-testid={`admin-photo-delete-${p.id}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {galleries.length} galleries
                </p>
                <button
                    onClick={() => setCreating((v) => !v)}
                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                    data-testid="admin-gallery-new-btn"
                >
                    {creating ? "Cancel" : "+ New gallery"}
                </button>
            </div>
            {creating && (
                <form onSubmit={create} className="border border-border p-6 mb-6 space-y-4" data-testid="admin-gallery-form">
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                            required
                            data-testid="admin-gallery-title"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Client</label>
                        <select
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
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
                        <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Description</label>
                        <input
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                            data-testid="admin-gallery-desc"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3"
                        data-testid="admin-gallery-create"
                    >
                        Create gallery
                    </button>
                </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {galleries.map((g) => (
                    <button
                        key={g.id}
                        onClick={() => setActiveId(g.id)}
                        className="text-left group"
                        data-testid={`admin-gallery-card-${g.id}`}
                    >
                        <div className="aspect-[4/5] bg-muted overflow-hidden">
                            {g.cover_blob_id ? (
                                <img
                                    src={photoUrl(g.cover_blob_id)}
                                    alt={g.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                    Empty
                                </div>
                            )}
                        </div>
                        <p className="font-display text-xl mt-3">{g.title}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                            {g.photo_count} photographs
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
