import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

export default function AdminServices() {
    const [data, setData] = useState({ packages: [], addons: [] });
    const refresh = useCallback(() => api.get("/services/active").then((r) => setData(r.data)), []);
    useEffect(() => {
        refresh();
    }, [refresh]);

    const delPkg = async (id) => {
        await api.delete(`/services/packages/${id}`);
        refresh();
    };
    const delAddon = async (id) => {
        await api.delete(`/services/addons/${id}`);
        refresh();
    };

    return (
        <div className="space-y-12">
            <section>
                <h2 className="font-display text-3xl">Packages</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    These are the packages Luma quotes from. Anything here is fair game for the chat assistant.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {data.packages.map((p) => (
                        <div key={p.package_id} className="border border-border p-5">
                            <p className="font-display text-2xl">{p.package_name}</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                {p.service_category} · {p.duration_minutes} min · AUD {p.base_price.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                            <button
                                onClick={() => delPkg(p.package_id)}
                                className="mt-3 text-[10px] uppercase tracking-[0.3em] text-destructive"
                                data-testid={`admin-pkg-del-${p.package_id}`}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="font-display text-3xl">Add-ons</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {data.addons.map((a) => (
                        <div key={a.addon_id} className="border border-border p-4 flex items-center justify-between">
                            <div>
                                <p className="font-display text-xl">{a.name}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    AUD {a.price.toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={() => delAddon(a.addon_id)}
                                className="text-[10px] uppercase tracking-[0.3em] text-destructive"
                                data-testid={`admin-addon-del-${a.addon_id}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
