import { Link, useLocation } from "react-router-dom";
import { getUser, logout } from "../auth/auth";
import { useState, useEffect, useRef } from "react";
import { http } from "../api/http";

export default function Navbar() {
    const location = useLocation();
    const [user, setUserState] = useState(getUser());
    const [isOpen, setIsOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    // Synchronize user state with localStorage on route changes
    useEffect(() => {
        setUserState(getUser());
    }, [location.pathname]);

    const hideOnRoutes = ["/login", "/register"];

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await http.get("/api/notifications/me?unreadOnly=0");
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await http.patch("/api/notifications/read-all");
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const markOneRead = async (id) => {
        try {
            await http.patch(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark individual notification as read", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper for active link style
    const NavLink = ({ to, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
            >
                {children}
            </Link>
        );
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/courses" className="flex-shrink-0">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                LearnNEST
                            </span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 space-x-6">
                            {!user ? (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-medium text-white">
                                            {user.name}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize">
                                            {user.role}
                                        </span>
                                    </div>

                                    {/* Notifications Dropdown */}
                                    <div className="relative" ref={notifRef}>
                                        <button
                                            onClick={() => setNotifOpen(!notifOpen)}
                                            className="relative p-2 text-slate-400 hover:text-white transition-colors"
                                            title="Notifications"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                                    {unreadCount > 9 ? "9+" : unreadCount}
                                                </span>
                                            )}
                                        </button>

                                        {notifOpen && (
                                            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50 overflow-hidden">
                                                <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                                                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllAsRead}
                                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="max-h-96 overflow-y-auto">
                                                    {notifications.length === 0 ? (
                                                        <div className="px-4 py-6 text-center text-slate-500 text-sm">
                                                            No notifications yet
                                                        </div>
                                                    ) : (
                                                        notifications.slice(0, 10).map((n) => (
                                                            <div
                                                                key={n._id}
                                                                className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.isRead ? "bg-indigo-500/5" : ""
                                                                    }`}
                                                                onClick={() => {
                                                                    if (!n.isRead) markOneRead(n._id);
                                                                    if (n.link) window.location.href = n.link;
                                                                }}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${n.type === "exam" ? "bg-orange-500/20 text-orange-400" :
                                                                        n.type === "assignment" ? "bg-blue-500/20 text-blue-400" :
                                                                            n.type === "announcement" ? "bg-purple-500/20 text-purple-400" :
                                                                                "bg-emerald-500/20 text-emerald-400"
                                                                        }`}>
                                                                        {n.type}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500">
                                                                        {new Date(n.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <h4 className={`text-xs font-semibold mb-0.5 ${!n.isRead ? "text-white" : "text-slate-300"}`}>
                                                                    {n.title}
                                                                </h4>
                                                                <p className="text-[11px] text-slate-400 line-clamp-2">
                                                                    {n.message}
                                                                </p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                {notifications.length > 0 && (
                                                    <Link
                                                        to={`/${user.role}/notifications`}
                                                        onClick={() => setNotifOpen(false)}
                                                        className="block w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border-t border-slate-800 mt-1"
                                                    >
                                                        View All Notifications
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        to={
                                            user.role === "student"
                                                ? "/student"
                                                : user.role === "teacher"
                                                    ? "/teacher"
                                                    : "/admin"
                                        }
                                        className="p-2 text-slate-400 hover:text-white"
                                        title="Dashboard"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect width="7" height="9" x="3" y="3" rx="1" />
                                            <rect width="7" height="5" x="14" y="3" rx="1" />
                                            <rect width="7" height="9" x="14" y="12" rx="1" />
                                            <rect width="7" height="5" x="3" y="16" rx="1" />
                                        </svg>
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="p-2 text-slate-400 hover:text-white"
                                        title="Profile"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M20 21a8 8 0 0 0-16 0" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            window.location.href = "/login";
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                        title="Logout"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" x2="9" y1="12" y2="12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {
                isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        </div>
                        <div className="pt-4 pb-3 border-t border-slate-700">
                            {!user ? (
                                <div className="flex items-center px-5 space-x-4">
                                    <Link
                                        to="/login"
                                        className="text-base font-medium text-slate-300 hover:text-white"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            ) : (
                                <div className="px-5">
                                    <div className="flex items-center">
                                        <div className="ml-3">
                                            <div className="text-base font-medium leading-none text-white">
                                                {user.name}
                                            </div>
                                            <div className="text-sm font-medium leading-none text-slate-400 mt-1">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <Link
                                            to={
                                                user.role === "student"
                                                    ? "/student"
                                                    : user.role === "teacher"
                                                        ? "/teacher"
                                                        : "/admin"
                                            }
                                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                window.location.href = "/login";
                                            }}
                                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
