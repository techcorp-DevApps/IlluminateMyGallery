import { useEffect } from "react";
import { useGalleryStore } from "../store/galleryStore";
import { photoUrl, photoDownloadUrl } from "../lib/api";
import { X, ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";
import ProtectedImage from "./ProtectedImage";

export default function LightsOutViewer() {
    const { lightsOut, activePhoto, photos, allowDownloads, next, prev, closeViewer } =
        useGalleryStore();

    useEffect(() => {
        if (!lightsOut) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeViewer();
            else if (e.key === "ArrowRight") next();
            else if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightsOut, next, prev, closeViewer]);

    if (!lightsOut || !activePhoto) return null;

    const isUrlPhoto = !!activePhoto.url;
    const src = isUrlPhoto ? activePhoto.url : photoUrl(activePhoto.blob_id);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500"
            style={{ background: "#050505" }}
            onContextMenu={(e) => e.preventDefault()}
            data-testid="lights-out-viewer"
        >
            <button
                onClick={closeViewer}
                className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
                aria-label="Close"
                data-testid="lights-out-close"
            >
                <X size={28} strokeWidth={1.25} />
            </button>

            {!isUrlPhoto && allowDownloads && (
                <a
                    href={photoDownloadUrl(activePhoto.blob_id)}
                    className="absolute top-6 left-6 text-white/70 hover:text-white p-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em]"
                    download
                    data-testid="lights-out-download"
                >
                    <Download size={20} strokeWidth={1.25} /> Download
                </a>
            )}

            {!isUrlPhoto && !allowDownloads && (
                <div
                    className="absolute top-6 left-6 text-white/40 p-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]"
                    data-testid="lights-out-no-download"
                >
                    <Lock size={14} strokeWidth={1.25} /> Preview only
                </div>
            )}

            <button
                onClick={prev}
                className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2"
                aria-label="Previous"
                data-testid="lights-out-prev"
            >
                <ChevronLeft size={36} strokeWidth={1.25} />
            </button>

            <ProtectedImage
                src={src}
                alt={activePhoto.filename || ""}
                className="max-h-[88vh] max-w-[90vw] object-contain"
                testId="lights-out-image"
            />

            <button
                onClick={next}
                className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2"
                aria-label="Next"
                data-testid="lights-out-next"
            >
                <ChevronRight size={36} strokeWidth={1.25} />
            </button>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center text-[10px] tracking-[0.3em] uppercase text-white/40">
                {photos.findIndex((p) => p.id === activePhoto.id) + 1} / {photos.length}
            </div>
        </div>
    );
}
