import { Link, Outlet, useLocation } from "react-router-dom";
import { getUser, logout } from "../auth/auth";

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded border border-slate-800 hover:border-slate-700 ${
        active ? "bg-slate-900" : ""
      }`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ links, title }) {
  const user = getUser();

  return (
    <div className="min-h-[calc(100vh-72px)] grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="border border-slate-800 rounded p-4 h-fit">
        <div className="mb-4">
          <p className="text-slate-400 text-sm">Dashboard</p>
          <p className="font-bold text-lg">{title}</p>
          <p className="text-slate-400 text-sm mt-1">
            {user?.name} ({user?.role})
          </p>
        </div>

        <div className="space-y-2">
          {links.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}
        </div>

        <button
          className="mt-6 w-full px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
          onClick={() => {
            logout();
            location.href = "/";
          }}
        >
          Logout
        </button>
      </aside>

      <section>
        <Outlet />
      </section>
    </div>
  );
}
