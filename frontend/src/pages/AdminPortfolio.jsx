import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

export default function AdminPortfolio() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({
        title: "",
        category: "",
        cover_image_url: "",
        description: "",
        images: "",
    });

    const refresh = useCallback(() => api.get("/portfolio").then((r) => setItems(r.data)), []);
    useEffect(() => {
        refresh();
    }, [refresh]);

    const save = async (e) => {
        e.preventDefault();
        await api.post("/portfolio", {
            ...form,
            images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
        });
        setForm({ title: "", category: "", cover_image_url: "", description: "", images: "" });
        setAdding(false);
        refresh();
    };

    const del = async (id) => {
        await api.delete(`/portfolio/${id}`);
        refresh();
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{items.length} items</p>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2"
                    data-testid="admin-port-new-btn"
                >
                    {adding ? "Cancel" : "+ Add work"}
                </button>
            </div>
            {adding && (
                <form onSubmit={save} className="border border-border p-6 mb-6 space-y-4" data-testid="admin-port-form">
                    {[
                        ["title", "Title", "input"],
                        ["category", "Category", "input"],
                        ["cover_image_url", "Cover image URL", "input"],
                        ["description", "Description", "input"],
                        ["images", "Additional image URLs (one per line)", "textarea"],
                    ].map(([key, label, kind]) => (
                        <div key={key}>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</label>
                            {kind === "input" ? (
                                <input
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    className="w-full bg-transparent border-b border-foreground py-2 mt-1 focus:outline-none"
                                    data-testid={`admin-port-${key}`}
                                />
                            ) : (
                                <textarea
                                    rows={4}
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    className="w-full bg-transparent border border-border p-2 mt-1 focus:outline-none"
                                    data-testid={`admin-port-${key}`}
                                />
                            )}
                        </div>
                    ))}
                    <button
                        type="submit"
                        className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3"
                        data-testid="admin-port-create"
                    >
                        Publish
                    </button>
                </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((it) => (
                    <div key={it.id} className="border border-border p-4">
                        <img src={it.cover_image_url} alt={it.title} className="w-full aspect-[4/5] object-cover" />
                        <p className="font-display text-xl mt-3">{it.title}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                            {it.category} · {it.images.length} plates
                        </p>
                        <button
                            onClick={() => del(it.id)}
                            className="mt-3 text-[10px] uppercase tracking-[0.3em] text-destructive"
                            data-testid={`admin-port-del-${it.id}`}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
