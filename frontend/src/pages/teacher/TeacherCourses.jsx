import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../../api/http";

function StatusPill({ status, isPublished }) {
  const text = isPublished ? "published" : status || "unknown";
  const cls =
    text === "published"
      ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
      : text === "approved"
      ? "bg-sky-900/40 border-sky-700 text-sky-200"
      : text === "rejected"
      ? "bg-rose-900/40 border-rose-700 text-rose-200"
      : "bg-amber-900/40 border-amber-700 text-amber-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${cls}`}>
      {text}
    </span>
  );
}

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    level: "beginner",
    language: "Bangla",
    price: 0,
    thumbnailUrl: "",
  });

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return courses;
    return courses.filter((c) => (c.title || "").toLowerCase().includes(qq));
  }, [courses, q]);

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await http.get("/api/courses/me");
      setCourses(data.courses || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg("");
    try {
      const { data } = await http.post("/api/courses", form);
      setCourses((prev) => [data.course, ...prev]);
      setOpen(false);
      setForm({
        title: "",
        description: "",
        category: "General",
        level: "beginner",
        language: "Bangla",
        price: 0,
        thumbnailUrl: "",
      });
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-slate-400 text-sm">
            Create courses and edit details. Admin must approve & publish.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
            onClick={load}
          >
            Refresh
          </button>
          <button
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
            onClick={() => setOpen(true)}
          >
            + Create Course
          </button>
        </div>
      </div>

      {msg && (
        <div className="border border-rose-700 bg-rose-900/20 rounded p-3 text-rose-200">
          {msg}
        </div>
      )}

      <input
        className="w-full p-2 rounded bg-slate-900 border border-slate-800"
        placeholder="Search by title..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={5}>
                  No courses found
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c._id} className="border-t border-slate-800">
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.category}</td>
                  <td className="p-3">৳{c.price}</td>
                  <td className="p-3">
                    <StatusPill status={c.status} isPublished={c.isPublished} />
                  </td>
                  <td className="p-3">
                    <Link
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 inline-block"
                      to={`/teacher/courses/${c._id}`}
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl border border-slate-800 rounded bg-slate-950 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Create Course</h3>
              <button
                className="px-2 py-1 rounded hover:bg-slate-900"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createCourse} className="mt-4 grid gap-3">
              <input
                className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <textarea
                className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                placeholder="Description"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
                <select
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <input
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                  placeholder="Language"
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="number"
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value || 0) })
                  }
                />
                <input
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                  placeholder="Thumbnail URL"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm({ ...form, thumbnailUrl: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={creating}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
