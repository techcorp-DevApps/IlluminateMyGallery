import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function CustomerDocuments() {
    const [docs, setDocs] = useState([]);
    const [active, setActive] = useState(null);
    const [sig, setSig] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const refresh = () =>
        api.get("/documents/mine").then((r) => {
            setDocs(r.data);
            if (active) {
                const updated = r.data.find((d) => d.id === active.id);
                if (updated) setActive(updated);
            }
        });

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sign = async () => {
        if (!sig.trim()) {
            setErr("Type your full name to sign.");
            return;
        }
        setBusy(true);
        setErr("");
        try {
            await api.post(`/documents/${active.id}/sign`, { signature_name: sig });
            setSig("");
            await refresh();
        } catch (e) {
            setErr(e.response?.data?.detail || "Could not sign.");
        } finally {
            setBusy(false);
        }
    };

    if (active) {
        return (
            <div className="bg-muted -mx-6 md:-mx-12 lg:-mx-16 py-12 min-h-[80vh]">
                <div className="max-w-3xl mx-auto px-6">
                    <button
                        onClick={() => setActive(null)}
                        className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
                        data-testid="doc-back"
                    >
                        ← All documents
                    </button>
                    <div className="bg-white mt-6 px-12 py-16 border border-border" data-testid="doc-paper">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            Illuminate Studios · Contract
                        </p>
                        <h1 className="font-display text-5xl tracking-tighter mt-4 leading-[1]">{active.title}</h1>
                        <div className="rule mt-8" />
                        <div className="mt-8 whitespace-pre-line font-display text-lg leading-relaxed">
                            {active.body}
                        </div>
                        <div className="rule mt-12" />
                        {active.signed ? (
                            <div className="mt-10" data-testid="doc-signed">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Signed by</p>
                                <p className="font-signature text-4xl mt-2">{active.signature_name}</p>
                                <p className="font-mono-ui text-xs text-muted-foreground mt-2">
                                    {new Date(active.signed_at).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-10">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    Type your full name to sign
                                </label>
                                <input
                                    value={sig}
                                    onChange={(e) => setSig(e.target.value)}
                                    className="block w-full bg-transparent border-b border-foreground py-3 mt-2 font-signature text-3xl"
                                    placeholder="Your name"
                                    data-testid="doc-sign-input"
                                />
                                {err && <p className="text-sm text-destructive mt-3">{err}</p>}
                                <button
                                    onClick={sign}
                                    disabled={busy}
                                    className="mt-6 bg-foreground text-background text-xs uppercase tracking-[0.3em] px-8 py-4 disabled:opacity-50"
                                    data-testid="doc-sign-submit"
                                >
                                    {busy ? "Signing…" : "Sign & return"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!docs.length) {
        return (
            <div className="border border-border p-12 text-center" data-testid="docs-empty">
                <p className="font-display text-3xl">No documents yet.</p>
                <p className="text-muted-foreground mt-3">When the studio sends a contract it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-border border border-border" data-testid="docs-list">
            {docs.map((d) => (
                <button
                    key={d.id}
                    onClick={() => setActive(d)}
                    className="w-full text-left flex items-center justify-between p-6 hover:bg-muted/40"
                    data-testid={`doc-row-${d.id}`}
                >
                    <div>
                        <p className="font-display text-2xl">{d.title}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
                            {new Date(d.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <span
                        className={`text-[10px] uppercase tracking-[0.3em] px-3 py-1 border ${
                            d.signed ? "border-foreground bg-foreground text-background" : "border-border"
                        }`}
                    >
                        {d.signed ? "Signed" : "Awaiting signature"}
                    </span>
                </button>
            ))}
        </div>
    );
}
