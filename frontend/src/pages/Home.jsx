import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Welcome to LearnNEST</h1>
      <p className="text-slate-300">Online Coaching Platform (MERN)</p>
      <Link className="inline-block px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500" to="/courses">
        Browse Courses
      </Link>
    </div>
  );
}
