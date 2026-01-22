import { Outlet, Link } from "react-router-dom";
import { getUser, logout } from "../auth/auth";

export default function MainLayout() {
  const user = getUser();

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to="/" className="font-bold text-xl">LearnNEST</Link>

        <div className="flex items-center gap-4">
          <Link to="/courses" className="hover:underline">Courses</Link>

          {!user ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <>
              <span className="text-slate-300 text-sm">
                {user.name} ({user.role})
              </span>
              <button
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
                onClick={() => { logout(); location.href = "/"; }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
