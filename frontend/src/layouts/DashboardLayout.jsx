import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ links, title }) {

  return (
    <div className="min-h-[calc(100vh-72px)] grid md:grid-cols-[260px_1fr] gap-6">
      <Sidebar links={links} title={title} />

      <section>
        <Outlet />
      </section>
    </div>
  );
}
