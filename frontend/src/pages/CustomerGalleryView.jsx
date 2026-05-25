import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, photoUrl, photoDownloadUrl } from "../lib/api";
import { useGalleryStore } from "../store/galleryStore";
import { ChevronLeft, Lock } from "lucide-react";
import ProtectedImage from "../components/ProtectedImage";

export default function CustomerGalleryView() {
    const { id } = useParams();
    const [gallery, setGallery] = useState(null);
    const openViewer = useGalleryStore((s) => s.openViewer);

    useEffect(() => {
        api.get(`/galleries/${id}`).then((r) => setGallery(r.data));
    }, [id]);

    if (!gallery) {
        return <p className="text-center py-20 text-muted-foreground">Loading…</p>;
    }

    const photos = gallery.photos || [];
    const canDownload = !!gallery.allow_downloads;

    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-12">
            <Link
                to="/dashboard/galleries"
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                data-testid="gallery-back"
            >
                <ChevronLeft size={14} strokeWidth={1.25} /> All galleries
            </Link>
            <div className="flex items-end justify-between mt-6 flex-wrap gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                        Private delivery
                    </p>
                    <h1 className="font-display text-5xl tracking-tighter mt-3">{gallery.title}</h1>
                    <p className="text-sm text-muted-foreground mt-3">{gallery.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {gallery.package_name && <span>{gallery.package_name}</span>}
                        {gallery.booking_date && <span>Session · {gallery.booking_date}</span>}
                        {gallery.invoice_reference && (
                            <span>Invoice · {gallery.invoice_reference}</span>
                        )}
                    </div>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {photos.length} photographs
                </p>
            </div>

            {!canDownload && photos.length > 0 && (
                <div
                    className="mt-6 border border-border p-4 text-xs flex items-center gap-3 text-muted-foreground"
                    data-testid="gallery-download-disabled-notice"
                >
                    <Lock size={14} strokeWidth={1.25} />
                    <p>
                        Preview gallery — image saving is disabled. If your package includes digital
                        downloads, please ask the studio to unlock this gallery.
                    </p>
                </div>
            )}

            {photos.length === 0 ? (
                <p className="mt-16 text-center text-muted-foreground">
                    No photos in this gallery yet.
                </p>
            ) : (
                <div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-10"
                    data-testid="gallery-photo-grid"
                >
                    {photos.map((p, i) => (
                        <div key={p.id} className="group relative">
                            <button
                                onClick={() =>
                                    openViewer(photos, i, { allowDownloads: canDownload })
                                }
                                className="block w-full bg-muted overflow-hidden"
                                data-testid={`photo-thumb-${p.id}`}
                            >
                                <ProtectedImage
                                    src={photoUrl(p.blob_id)}
                                    alt={p.filename}
                                    className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            </button>
                            {canDownload && (
                                <a
                                    href={photoDownloadUrl(p.blob_id)}
                                    className="absolute top-2 right-2 bg-foreground text-background text-[10px] uppercase tracking-[0.2em] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    download
                                    data-testid={`photo-download-${p.id}`}
                                >
                                    Download
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
