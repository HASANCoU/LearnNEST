import DashboardLayout from "../../layouts/DashboardLayout";

export default function AdminShell() {
  const links = [
    { to: "/admin", label: "Home" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/courses", label: "Courses" },
    { to: "/admin/batches", label: "Batches" },
    { to: "/admin/notifications", label: "Notifications" },
  ];

  return <DashboardLayout links={links} title="Admin" />;
}
