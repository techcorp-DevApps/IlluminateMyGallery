import { NavLink, Outlet } from "react-router-dom";

const TABS = [
    ["overview", "Overview"],
    ["calendar", "Calendar"],
    ["bookings", "Bookings"],
    ["clients", "Clients"],
    ["galleries", "Galleries"],
    ["documents", "Documents"],
    ["invoices", "Invoices"],
    ["portfolio", "Portfolio"],
    ["services", "Services"],
];

export default function AdminDashboard() {
    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-12">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Studio control</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tighter mt-3 leading-[1]">
                The newsroom.
            </h1>

            <div className="border-t border-border mt-12 flex flex-wrap gap-x-8 gap-y-2 pt-4">
                {TABS.map(([k, label]) => (
                    <NavLink
                        key={k}
                        to={`/admin/${k}`}
                        className={({ isActive }) =>
                            `text-xs uppercase tracking-[0.3em] py-2 border-b-2 ${
                                isActive
                                    ? "border-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`
                        }
                        data-testid={`admin-tab-${k}`}
                    >
                        {label}
                    </NavLink>
                ))}
            </div>

            <div className="mt-10">
                <Outlet />
            </div>
        </div>
    );
}
