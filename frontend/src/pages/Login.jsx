import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login, user, checked } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!checked || !user || user === false) return;
        nav(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }, [user, checked, nav]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        const res = await login(email, password);
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        nav(res.user.role === "admin" ? "/admin" : "/dashboard");
    };

    return (
        <div className="max-w-md mx-auto px-6 py-20">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Studio Sign-in</p>
            <h1 className="font-display text-5xl tracking-tighter mt-3">Welcome back.</h1>
            <form onSubmit={submit} className="mt-10 space-y-6" data-testid="login-form">
                <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-foreground py-3 mt-1 focus:outline-none"
                        required
                        data-testid="login-email"
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
                        data-testid="login-password"
                    />
                </div>
                {error && (
                    <p className="text-sm text-destructive" data-testid="login-error">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.3em] disabled:opacity-50 hover:opacity-90 transition-opacity"
                    data-testid="login-submit"
                >
                    {busy ? "Signing in…" : "Sign in"}
                </button>
                <p className="text-sm text-muted-foreground text-center">
                    No account yet?{" "}
                    <Link to="/register" className="underline" data-testid="link-register">
                        Become a client
                    </Link>
                </p>
            </form>
        </div>
    );
}
