import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useGalleryStore } from "../store/galleryStore";

export default function Portfolio() {
    const [items, setItems] = useState([]);
    const openViewer = useGalleryStore((s) => s.openViewer);

    useEffect(() => {
        api.get("/portfolio").then((r) => setItems(r.data)).catch(() => {});
    }, []);

    const openSet = (item, idx) => {
        const photos = item.images.map((url, i) => ({ id: `${item.id}-${i}`, url, filename: item.title }));
        openViewer(photos, idx);
    };

    return (
        <div className="bg-background">
            <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-12 md:pt-20 pb-12">
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Index</p>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter mt-4 leading-[0.95]">
                    Selected work,<br />by assignment.
                </h1>
                <p className="mt-6 max-w-2xl text-muted-foreground">
                    Each plate below opens into a quiet, full-screen viewer. Tap a frame.
                </p>
            </section>

            <div className="rule max-w-[1400px] mx-auto mx-6 md:mx-12 lg:mx-16" />

            <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16 space-y-24">
                {items.map((item, idx) => (
                    <article key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
                        <div className="md:col-span-3">
                            <p className="font-mono-ui text-xs text-muted-foreground">
                                Plate {String(idx + 1).padStart(2, "0")}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.3em] mt-1">{item.category}</p>
                            <h2 className="font-display text-3xl mt-4 leading-tight">{item.title}</h2>
                            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                        <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {item.images.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => openSet(item, i)}
                                    className="group block overflow-hidden bg-muted"
                                    data-testid={`portfolio-image-${item.id}-${i}`}
                                >
                                    <img
                                        src={url}
                                        alt={`${item.title} ${i + 1}`}
                                        className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                    />
                                </button>
                            ))}
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
}
