import { Outlet, Link } from "react-router-dom";
import { getUser, logout } from "../auth/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  const user = getUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-screen-2xl mx-auto px-4 md:px-6 py-12 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
