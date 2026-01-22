import DashboardLayout from "../../layouts/DashboardLayout";

export default function StudentShell() {
  const links = [
    { to: "/student", label: "Home" },
    { to: "/student/enrollments", label: "My Enrollments" },
    { to: "/student/notifications", label: "Notifications" },
  ];

  return <DashboardLayout links={links} title="Student" />;
}
