import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

const STORAGE_KEY = "luma_session_id_v1";

export default function LumaChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "Hi — I'm Luma, the studio's booking assistant. I can walk you through booking a session, or just answer a few questions first. What brings you in today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [sessionId, setSessionId] = useState(() => localStorage.getItem(STORAGE_KEY));
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open]);

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setMessages((m) => [...m, { role: "user", content: text }]);
        setInput("");
        setSending(true);
        try {
            const { data } = await api.post("/luma/chat", { session_id: sessionId, message: text });
            if (data.session_id && data.session_id !== sessionId) {
                setSessionId(data.session_id);
                localStorage.setItem(STORAGE_KEY, data.session_id);
            }
            const events = (data.tool_events || [])
                .filter((e) => e.name !== "get_active_services")
                .map((e) => {
                    if (e.name === "check_availability") {
                        return e.result?.available
                            ? "✓ slot available — held briefly"
                            : "× slot unavailable — alternatives suggested";
                    }
                    if (e.name === "create_booking" && e.result?.ok) {
                        return "✓ Booking sent to the studio for confirmation.";
                    }
                    if (e.name === "handoff_to_human") {
                        return "→ Handed over to a team member.";
                    }
                    return null;
                })
                .filter(Boolean);
            setMessages((m) => [
                ...m,
                ...events.map((t) => ({ role: "event", content: t })),
                ...(data.reply ? [{ role: "assistant", content: data.reply }] : []),
            ]);
        } catch (e) {
            setMessages((m) => [
                ...m,
                { role: "assistant", content: "Something went wrong reaching the studio. Try again in a moment." },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen((v) => !v)}
                className="fixed bottom-6 right-6 z-[80] bg-foreground text-background px-5 py-3 flex items-center gap-2 shadow-[0_0_0_1px_hsl(var(--border))] hover:opacity-90 transition-opacity"
                data-testid="luma-toggle"
            >
                {open ? (
                    <X size={18} strokeWidth={1.25} />
                ) : (
                    <>
                        <Sparkles size={16} strokeWidth={1.25} />
                        <span className="text-xs uppercase tracking-[0.3em]">Ask Luma</span>
                    </>
                )}
            </button>

            {open && (
                <div
                    className="fixed bottom-24 left-6 z-[80] w-[92vw] sm:w-[420px] h-[560px] bg-background border border-border flex flex-col animate-fade-in"
                    data-testid="luma-window"
                >
                    <div className="border-b border-border px-5 py-4">
                        <p className="font-display text-2xl tracking-tighter leading-none">Luma</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                            Illuminate Studios · booking assistant
                        </p>
                    </div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">
                        {messages.map((m, i) => {
                            if (m.role === "event") {
                                return (
                                    <p
                                        key={i}
                                        className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center border-y border-border py-2"
                                        data-testid="luma-event"
                                    >
                                        {m.content}
                                    </p>
                                );
                            }
                            const me = m.role === "user";
                            return (
                                <div key={i} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[80%] px-3 py-2 leading-relaxed ${
                                            me
                                                ? "bg-foreground text-background"
                                                : "bg-muted text-foreground border border-border"
                                        }`}
                                        data-testid={me ? "luma-msg-user" : "luma-msg-assistant"}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            );
                        })}
                        {sending && (
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Luma is typing…</p>
                        )}
                    </div>
                    <div className="border-t border-border p-3 flex items-center gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            placeholder="Tell Luma about your session…"
                            className="flex-1 bg-transparent text-sm px-2 py-2 focus:outline-none border-b border-border"
                            data-testid="luma-input"
                        />
                        <button
                            onClick={send}
                            disabled={sending}
                            className="p-2 bg-foreground text-background hover:opacity-90 disabled:opacity-40"
                            data-testid="luma-send"
                            aria-label="Send"
                        >
                            <Send size={16} strokeWidth={1.25} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
