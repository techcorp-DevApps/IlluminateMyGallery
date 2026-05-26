import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({
    baseURL: API,
    withCredentials: true,
});

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export function photoUrl(blobId) {
    return `${API}/galleries/photo/${blobId}`;
}

export function photoDownloadUrl(blobId) {
    return `${API}/galleries/photo/${blobId}/download`;
}
