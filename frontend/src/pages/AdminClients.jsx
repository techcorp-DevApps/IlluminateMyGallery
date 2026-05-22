import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    useEffect(() => {
        api.get("/admin/clients").then((r) => setClients(r.data));
    }, []);

    if (!clients.length) {
        return <p className="text-muted-foreground text-center py-12">No clients yet.</p>;
    }

    return (
        <div className="border border-border divide-y divide-border" data-testid="admin-clients-list">
            {clients.map((c) => (
                <div key={c.id} className="p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                        <p className="font-display text-xl">{c.name || c.email}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="md:col-span-4 text-sm text-muted-foreground">
                        {c.phone || "—"}
                        {c.is_lead && (
                            <span className="ml-2 text-[10px] uppercase tracking-[0.3em] border border-border px-2 py-0.5">
                                Lead
                            </span>
                        )}
                    </div>
                    <div className="md:col-span-3 text-right font-mono-ui text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
