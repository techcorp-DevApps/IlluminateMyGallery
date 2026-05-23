import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGalleryStore } from "../store/galleryStore";
import { useEffect } from "react";

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const lightsOut = useGalleryStore((s) => s.lightsOut);

    useEffect(() => {
        if (lightsOut) document.body.classList.add("lights-out-active");
        else document.body.classList.remove("lights-out-active");
        return () => document.body.classList.remove("lights-out-active");
    }, [lightsOut]);

    if (lightsOut) {
        return <div className="min-h-screen">{children}</div>;
    }

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b border-border bg-background">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-5 flex items-center justify-between">
                    <Link
                        to={user && user !== false ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"}
                        className="flex items-center gap-3"
                        data-testid="brand-link"
                    >
                        <span className="font-display text-3xl tracking-tighter leading-none">Illuminate</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-l border-border pl-3">
                            Studios
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 text-sm">
                        <NavLink to="/portfolio" className="hover:opacity-60 transition-opacity" data-testid="nav-portfolio">
                            Portfolio
                        </NavLink>
                        <NavLink to="/book" className="hover:opacity-60 transition-opacity" data-testid="nav-book">
                            Book a session
                        </NavLink>
                        {user && user.role === "user" && (
                            <NavLink to="/dashboard" className="hover:opacity-60 transition-opacity" data-testid="nav-dashboard">
                                Client portal
                            </NavLink>
                        )}
                        {user && user.role === "admin" && (
                            <NavLink to="/admin" className="hover:opacity-60 transition-opacity" data-testid="nav-admin">
                                Studio
                            </NavLink>
                        )}
                    </nav>
                    <div className="flex items-center gap-3">
                        {user && user.email ? (
                            <>
                                <span className="text-xs text-muted-foreground hidden sm:block" data-testid="user-email">
                                    {user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs uppercase tracking-[0.2em] border border-border px-3 py-2 hover:bg-foreground hover:text-background transition-colors"
                                    data-testid="logout-button"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-xs uppercase tracking-[0.2em] hover:opacity-60 transition-opacity"
                                    data-testid="login-link"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-xs uppercase tracking-[0.2em] bg-foreground text-background px-4 py-2 hover:opacity-80 transition-opacity"
                                    data-testid="register-link"
                                >
                                    Become a client
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border mt-24">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div>
                        <p className="font-display text-2xl tracking-tighter">Illuminate Studios</p>
                        <p className="mt-3 text-muted-foreground max-w-xs">
                            Editorial portrait & wedding photography. Working across Melbourne and on assignment.
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
                        <p className="mt-2">14 Brunswick Lane, Collingwood VIC</p>
                        <p className="text-muted-foreground">studio@illuminatestudios.com</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Hours</p>
                        <p className="mt-2">Tues — Sat, 9:00 — 17:00</p>
                        <p className="text-muted-foreground">By appointment only</p>
                    </div>
                </div>
                <div className="border-t border-border">
                    <p className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        © {new Date().getFullYear()} Illuminate Studios — All works held in copyright
                    </p>
                </div>
            </footer>
        </div>
    );
}
