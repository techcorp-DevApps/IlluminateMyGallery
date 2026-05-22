import { useEffect, useState } from "react";
import { api, photoUrl } from "../lib/api";
import { Link } from "react-router-dom";

export default function CustomerGalleries() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        api.get("/galleries/mine").then((r) => setItems(r.data));
    }, []);

    if (!items.length) {
        return (
            <div className="border border-border p-12 text-center" data-testid="galleries-empty">
                <p className="font-display text-3xl">Your delivered galleries will appear here.</p>
                <p className="text-muted-foreground mt-3">The studio uploads your photos when they're ready.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="galleries-grid">
            {items.map((g) => (
                <Link
                    key={g.id}
                    to={`/dashboard/galleries/${g.id}`}
                    className="block group"
                    data-testid={`gallery-card-${g.id}`}
                >
                    <div className="aspect-[4/5] bg-muted overflow-hidden">
                        {g.cover_blob_id ? (
                            <img
                                src={photoUrl(g.cover_blob_id)}
                                alt={g.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-[0.3em]">
                                Pending delivery
                            </div>
                        )}
                    </div>
                    <p className="font-display text-2xl mt-3">{g.title}</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                        {g.photo_count} photographs
                    </p>
                </Link>
            ))}
        </div>
    );
}
