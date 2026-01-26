import { Outlet, Link } from "react-router-dom";
import { getUser, logout } from "../auth/auth";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  const user = getUser();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
