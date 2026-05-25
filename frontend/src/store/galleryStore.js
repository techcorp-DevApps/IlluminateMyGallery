import { create } from "zustand";

export const useGalleryStore = create((set) => ({
    lightsOut: false,
    activePhoto: null, // { id, blob_id, filename, ... }
    photos: [], // current viewing context
    allowDownloads: false,
    openViewer: (photos, idx, opts = {}) =>
        set({
            lightsOut: true,
            photos,
            activePhoto: photos[idx] || null,
            allowDownloads: !!opts.allowDownloads,
        }),
    closeViewer: () =>
        set({ lightsOut: false, activePhoto: null, photos: [], allowDownloads: false }),
    next: () =>
        set((s) => {
            if (!s.photos.length || !s.activePhoto) return s;
            const i = s.photos.findIndex((p) => p.id === s.activePhoto.id);
            const ni = (i + 1) % s.photos.length;
            return { activePhoto: s.photos[ni] };
        }),
    prev: () =>
        set((s) => {
            if (!s.photos.length || !s.activePhoto) return s;
            const i = s.photos.findIndex((p) => p.id === s.activePhoto.id);
            const ni = (i - 1 + s.photos.length) % s.photos.length;
            return { activePhoto: s.photos[ni] };
        }),
}));
