import { Navigate } from "react-router-dom";
import { getUser } from "../auth/auth";

export default function DashboardRedirect() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}
