import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const res = await register(name, email, password);
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        nav("/dashboard");
    };

    return (
        <div className="max-w-md mx-auto px-6 py-20">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Open a portal</p>
            <h1 className="font-display text-5xl tracking-tighter mt-3">Become a client.</h1>
            <form onSubmit={submit} className="mt-10 space-y-6" data-testid="register-form">
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Full name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                        required
                        data-testid="register-name"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                        required
                        data-testid="register-email"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                        required
                        minLength={6}
                        data-testid="register-password"
                    />
                </div>
                {error && (
                    <p className="text-sm text-destructive" data-testid="register-error">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.3em] disabled:opacity-50 hover:opacity-90 transition-opacity"
                    data-testid="register-submit"
                >
                    {busy ? "Creating…" : "Create my portal"}
                </button>
                <p className="text-sm text-muted-foreground text-center">
                    Already have one?{" "}
                    <Link to="/login" className="underline" data-testid="link-login">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
