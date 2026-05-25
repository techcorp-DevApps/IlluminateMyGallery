import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { X, Plus, Pencil } from "lucide-react";

const EMPTY_PACKAGE = {
    package_name: "",
    service_category: "",
    base_price: 0,
    duration_minutes: 60,
    description: "",
    is_active: true,
    addon_ids: [],
};

const EMPTY_ADDON = { name: "", price: 0 };

function PackageForm({ initial, allAddons, onCancel, onSave }) {
    const [form, setForm] = useState({ ...EMPTY_PACKAGE, ...initial });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
            await onSave({
                ...form,
                base_price: parseFloat(form.base_price) || 0,
                duration_minutes: parseInt(form.duration_minutes, 10) || 0,
            });
        } catch (ex) {
            setErr(ex.response?.data?.detail || "Could not save package");
        } finally {
            setBusy(false);
        }
    };

    const toggleAddon = (id) => {
        setForm((f) => ({
            ...f,
            addon_ids: f.addon_ids.includes(id)
                ? f.addon_ids.filter((x) => x !== id)
                : [...f.addon_ids, id],
        }));
    };

    return (
        <form
            onSubmit={submit}
            className="border border-foreground p-6 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4 bg-muted/20"
            data-testid="admin-package-form"
        >
            <div className="md:col-span-6">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Package name</label>
                <input
                    value={form.package_name}
                    onChange={(e) => setForm({ ...form, package_name: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-package-name"
                />
            </div>
            <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Category</label>
                <input
                    value={form.service_category}
                    onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                    required
                    placeholder="e.g. Wedding"
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-package-category"
                />
            </div>
            <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Base price (AUD)</label>
                <input
                    type="number"
                    step="0.01"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-package-price"
                />
            </div>
            <div className="md:col-span-3">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Duration (min)</label>
                <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-package-duration"
                />
            </div>
            <div className="md:col-span-9 flex items-center gap-3 pt-6">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        data-testid="admin-package-active"
                    />
                    Active (visible to Luma & booking flow)
                </label>
            </div>
            <div className="md:col-span-12">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Description</label>
                <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-transparent border border-border p-2 mt-1"
                    data-testid="admin-package-description"
                />
            </div>
            {allAddons.length > 0 && (
                <div className="md:col-span-12">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                        Available add-ons for this package
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {allAddons.map((a) => {
                            const checked = form.addon_ids.includes(a.addon_id);
                            return (
                                <button
                                    key={a.addon_id}
                                    type="button"
                                    onClick={() => toggleAddon(a.addon_id)}
                                    className={`text-[10px] uppercase tracking-[0.3em] border px-3 py-1.5 ${
                                        checked
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border"
                                    }`}
                                    data-testid={`admin-package-addon-${a.addon_id}`}
                                >
                                    {a.name} · ${a.price.toFixed(0)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {err && (
                <p className="md:col-span-12 text-sm text-destructive" data-testid="admin-package-error">
                    {err}
                </p>
            )}
            <div className="md:col-span-12 flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-3 disabled:opacity-50"
                    data-testid="admin-package-save"
                >
                    {busy ? "Saving…" : "Save package"}
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

function AddonForm({ initial, onCancel, onSave }) {
    const [form, setForm] = useState({ ...EMPTY_ADDON, ...initial });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await onSave({ ...form, price: parseFloat(form.price) || 0 });
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="border border-foreground p-5 mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 bg-muted/20"
            data-testid="admin-addon-form"
        >
            <div className="md:col-span-8">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Add-on name</label>
                <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-addon-name"
                />
            </div>
            <div className="md:col-span-4">
                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Price (AUD)</label>
                <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-foreground py-2 mt-1"
                    data-testid="admin-addon-price"
                />
            </div>
            <div className="md:col-span-12 flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="bg-foreground text-background text-xs uppercase tracking-[0.3em] px-6 py-2"
                    data-testid="admin-addon-save"
                >
                    {busy ? "Saving…" : "Save add-on"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs uppercase tracking-[0.3em] border border-border px-6 py-2"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function AdminServices() {
    const [data, setData] = useState({ packages: [], addons: [] });
    const [pkgEditing, setPkgEditing] = useState(null); // null | "new" | pkgId
    const [addonEditing, setAddonEditing] = useState(null); // null | "new"

    const refresh = useCallback(
        () => api.get("/services/active").then((r) => setData(r.data)),
        []
    );
    useEffect(() => {
        refresh();
    }, [refresh]);

    const savePackage = async (payload) => {
        if (pkgEditing === "new") {
            await api.post("/services/packages", payload);
        } else {
            await api.put(`/services/packages/${pkgEditing}`, {
                ...payload,
                package_id: pkgEditing,
            });
        }
        setPkgEditing(null);
        await refresh();
    };

    const delPkg = async (id) => {
        if (!window.confirm("Remove this package? Bookings already on it will keep their snapshot.")) return;
        await api.delete(`/services/packages/${id}`);
        refresh();
    };

    const saveAddon = async (payload) => {
        await api.post("/services/addons", payload);
        setAddonEditing(null);
        await refresh();
    };

    const delAddon = async (id) => {
        await api.delete(`/services/addons/${id}`);
        refresh();
    };

    const editingPkg =
        pkgEditing && pkgEditing !== "new"
            ? data.packages.find((p) => p.package_id === pkgEditing)
            : null;

    return (
        <div className="space-y-14">
            <section data-testid="admin-services-packages">
                <div className="flex items-end justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="font-display text-3xl">Packages</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Edit pricing, duration, and what Luma quotes. Changes go live instantly.
                        </p>
                    </div>
                    {pkgEditing === null && (
                        <button
                            onClick={() => setPkgEditing("new")}
                            className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2 inline-flex items-center gap-2"
                            data-testid="admin-package-new-btn"
                        >
                            <Plus size={14} strokeWidth={1.5} /> New package
                        </button>
                    )}
                </div>

                {pkgEditing === "new" && (
                    <div className="mt-6">
                        <PackageForm
                            initial={EMPTY_PACKAGE}
                            allAddons={data.addons}
                            onCancel={() => setPkgEditing(null)}
                            onSave={savePackage}
                        />
                    </div>
                )}

                {editingPkg && (
                    <div className="mt-6">
                        <PackageForm
                            initial={editingPkg}
                            allAddons={data.addons}
                            onCancel={() => setPkgEditing(null)}
                            onSave={savePackage}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {data.packages.map((p) => (
                        <div
                            key={p.package_id}
                            className={`border p-5 ${
                                p.is_active === false ? "border-dashed opacity-60" : "border-border"
                            }`}
                            data-testid={`admin-package-card-${p.package_id}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-display text-2xl">{p.package_name}</p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                        {p.service_category} · {p.duration_minutes} min · AUD {p.base_price.toFixed(2)}
                                    </p>
                                </div>
                                {p.is_active === false && (
                                    <span className="text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-0.5">
                                        Hidden
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-3">{p.description}</p>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setPkgEditing(p.package_id)}
                                    className="text-[10px] uppercase tracking-[0.3em] border border-foreground px-3 py-1.5 hover:bg-foreground hover:text-background inline-flex items-center gap-2"
                                    data-testid={`admin-pkg-edit-${p.package_id}`}
                                >
                                    <Pencil size={12} strokeWidth={1.5} /> Edit
                                </button>
                                <button
                                    onClick={() => delPkg(p.package_id)}
                                    className="text-[10px] uppercase tracking-[0.3em] text-destructive"
                                    data-testid={`admin-pkg-del-${p.package_id}`}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section data-testid="admin-services-addons">
                <div className="flex items-end justify-between flex-wrap gap-2">
                    <h2 className="font-display text-3xl">Add-ons</h2>
                    {addonEditing === null && (
                        <button
                            onClick={() => setAddonEditing("new")}
                            className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-5 py-2 inline-flex items-center gap-2"
                            data-testid="admin-addon-new-btn"
                        >
                            <Plus size={14} strokeWidth={1.5} /> New add-on
                        </button>
                    )}
                </div>

                {addonEditing === "new" && (
                    <div className="mt-6">
                        <AddonForm
                            initial={EMPTY_ADDON}
                            onCancel={() => setAddonEditing(null)}
                            onSave={saveAddon}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {data.addons.map((a) => (
                        <div
                            key={a.addon_id}
                            className="border border-border p-4 flex items-center justify-between"
                            data-testid={`admin-addon-card-${a.addon_id}`}
                        >
                            <div>
                                <p className="font-display text-xl">{a.name}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    AUD {a.price.toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={() => delAddon(a.addon_id)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Remove"
                                data-testid={`admin-addon-del-${a.addon_id}`}
                            >
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
