import { Link } from "react-router-dom";

export default function StudentHome() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">Student Dashboard</h2>
      <p className="text-slate-300">
        From here you can manage your enrollments and access batch content.
      </p>
      <Link
        to="/student/enrollments"
        className="inline-block px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
      >
        My Enrollments
      </Link>
    </div>
  );
}
