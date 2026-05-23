import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const HERO_IMAGES = [
    "https://images.unsplash.com/photo-1648046016726-9260b555902b",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
    "https://images.unsplash.com/photo-1541519481457-763224276691",
];

export default function Landing() {
    const [items, setItems] = useState([]);
    const { user, checked } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If a signed-in admin or client lands on '/', send them straight to their portal.
        // This also handles the "page refresh while logged in" case.
        if (!checked || !user || user === false) return;
        if (user.role === "admin") navigate("/admin", { replace: true });
        else if (user.role === "user") navigate("/dashboard", { replace: true });
    }, [user, checked, navigate]);

    useEffect(() => {
        api.get("/portfolio").then((r) => setItems(r.data)).catch(() => {});
    }, []);

    return (
        <div className="bg-background">
            {/* Editorial hero */}
            <section className="relative max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-12 md:pt-20 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-end">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="md:col-span-7"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
                            Vol. XII · An editorial photography studio · Melbourne
                        </p>
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-[7.5rem] leading-[0.95] tracking-tighter">
                            Photographs<br />
                            <em className="font-light not-italic">for the people</em><br />
                            who collect them.
                        </h1>
                        <p className="mt-10 max-w-xl text-base leading-relaxed text-muted-foreground">
                            Illuminate Studios is the working diary of photographer Marlowe Vance — portrait,
                            wedding, and editorial assignments shot on medium format and delivered as printed
                            archives. New session enquiries are open for the autumn season.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-10">
                            <Link
                                to="/book"
                                className="text-xs uppercase tracking-[0.3em] bg-foreground text-background px-6 py-4 hover:opacity-90 transition-opacity"
                                data-testid="hero-book-btn"
                            >
                                Book a session →
                            </Link>
                            <Link
                                to="/portfolio"
                                className="text-xs uppercase tracking-[0.3em] border border-foreground px-6 py-4 hover:bg-foreground hover:text-background transition-colors"
                                data-testid="hero-portfolio-btn"
                            >
                                See the portfolio
                            </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        className="md:col-span-5"
                    >
                        <img
                            src={HERO_IMAGES[0]}
                            alt="Hero editorial"
                            className="w-full aspect-[3/4] object-cover"
                            data-testid="hero-image"
                        />
                        <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                            "Adele in Autumn" — assignment for an independent label
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Editorial rule */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                <div className="rule" />
            </div>

            {/* Index spread */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-20">
                <div className="flex items-baseline justify-between mb-12">
                    <h2 className="font-display text-4xl sm:text-5xl tracking-tighter">The current portfolio</h2>
                    <Link
                        to="/portfolio"
                        className="text-[10px] uppercase tracking-[0.3em] hover:opacity-60"
                        data-testid="portfolio-all-link"
                    >
                        Full index →
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
                    {items.slice(0, 3).map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                            viewport={{ once: true }}
                            className={i === 1 ? "md:col-span-5 md:col-start-2" : i === 0 ? "md:col-span-4" : "md:col-span-5 md:col-start-8 md:-mt-24"}
                            data-testid={`portfolio-card-${i}`}
                        >
                            <Link to="/portfolio" className="block group">
                                <img src={item.cover_image_url} alt={item.title} className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                                <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    {item.category} · Plate {String(i + 1).padStart(2, "0")}
                                </p>
                                <h3 className="font-display text-2xl mt-1">{item.title}</h3>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* The process */}
            <section className="bg-muted">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
                    <div className="md:col-span-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">§ Process</p>
                        <h2 className="font-display text-4xl sm:text-5xl tracking-tighter mt-4">
                            From enquiry,<br />to print.
                        </h2>
                    </div>
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-10">
                        {[
                            ["01", "Conversation", "Talk to Luma in the chat, or write directly. We sketch a session around what matters to you."],
                            ["02", "Booking", "A studio date is reserved and a contract is sent to your portal for review and signature."],
                            ["03", "The day", "Whether studio or on location, the day moves slowly. Phones away. Time to be looked at."],
                            ["04", "Delivery", "Your private gallery opens in a few weeks. Download, print, or order a hand-bound archive."],
                        ].map(([n, t, d]) => (
                            <div key={n} className="border-t border-border pt-4">
                                <p className="font-mono-ui text-xs text-muted-foreground">{n}</p>
                                <h3 className="font-display text-2xl mt-2">{t}</h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Luma highlight */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-24 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
                <div className="md:col-span-7">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">An assistant, not a form</p>
                    <h2 className="font-display text-4xl sm:text-6xl tracking-tighter mt-4 leading-[1]">
                        Meet <em className="font-light">Luma</em> — the studio's<br />booking assistant.
                    </h2>
                    <p className="mt-6 text-muted-foreground max-w-xl">
                        Luma is a quiet AI concierge built into the chat. Tell her what you're after in your own
                        words — date, location, the feel you're chasing — and she'll find the right package,
                        check availability, and send a tentative booking to the studio for confirmation.
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground italic">
                        Look for the "Ask Luma" tab at the bottom-right.
                    </p>
                </div>
                <div className="md:col-span-5">
                    <img
                        src={HERO_IMAGES[2]}
                        alt="Portrait"
                        className="w-full aspect-[4/5] object-cover grayscale"
                    />
                </div>
            </section>
        </div>
    );
}
