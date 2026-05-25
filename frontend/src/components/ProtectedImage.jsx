import { useEffect, useRef } from "react";

/**
 * <ProtectedImage> renders an <img> that resists casual right-click /
 * long-press / drag-to-save behaviour. This is *not* DRM — a determined
 * user can still capture the bytes — but it removes the easy vectors so
 * preview galleries don't get casually saved when digital downloads
 * weren't part of the package.
 */
export default function ProtectedImage({ src, alt = "", className = "", testId, ...rest }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Block context menu and dragstart at the DOM level — React's onContextMenu
        // is enough for desktop, but iOS Safari long-press needs the native binding.
        const stop = (e) => {
            e.preventDefault();
            return false;
        };
        el.addEventListener("contextmenu", stop);
        el.addEventListener("dragstart", stop);
        // Touch long-press (iOS Safari)
        let touchTimer = null;
        const onTouchStart = () => {
            touchTimer = setTimeout(() => {
                /* swallow long-press */
            }, 0);
        };
        const onTouchEnd = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd);
        return () => {
            el.removeEventListener("contextmenu", stop);
            el.removeEventListener("dragstart", stop);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, []);

    return (
        <img
            ref={ref}
            src={src}
            alt={alt}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className={`select-none pointer-events-auto ${className}`}
            style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
            }}
            data-testid={testId}
            {...rest}
        />
    );
}
