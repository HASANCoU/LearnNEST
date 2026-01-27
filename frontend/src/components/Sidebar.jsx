import { Link, useLocation } from "react-router-dom";
import { getUser, logout } from "../auth/auth";

export default function Sidebar({ links, title }) {
    const { pathname } = useLocation();
    const user = getUser();

    const NavItem = ({ to, label }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
            <Link
                to={to}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${active
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
            >
                <span className="text-sm font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <aside className="h-full bg-slate-900 border-r border-slate-800 flex flex-col w-64 fixed md:relative z-20 hidden md:flex">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Dashboard
                </p>
            </div>

            {/* User Info */}
            <div className="px-6 py-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
                {links.map((l) => (
                    <NavItem key={l.to} to={l.to} label={l.label} />
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => {
                        logout();
                        window.location.href = "/login";
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
