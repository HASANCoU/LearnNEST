import DashboardLayout from "../../layouts/DashboardLayout";

export default function TeacherShell() {
  const links = [
    { to: "/teacher", label: "Home" },
    { to: "/teacher/courses", label: "My Courses" },
    { to: "/teacher/batches", label: "My Batches" },
    { to: "/teacher/notifications", label: "Notifications" },
  ];

  return <DashboardLayout links={links} title="Teacher" />;
}
