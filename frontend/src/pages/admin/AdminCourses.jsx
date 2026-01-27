import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";
import { Link } from "react-router-dom";

function Pill({ text }) {
  const cls =
    text === "published"
      ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
      : text === "approved"
        ? "bg-sky-900/40 border-sky-700 text-sky-200"
        : text === "rejected"
          ? "bg-rose-900/40 border-rose-700 text-rose-200"
          : "bg-amber-900/40 border-amber-700 text-amber-200";
  return <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${cls}`}>{text}</span>;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [published, setPublished] = useState("");


  // Create Modal State
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
  });

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (published) params.set("published", published);
      const { data } = await http.get(`/api/admin/courses?${params.toString()}`);
      setCourses(data.courses || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      // Defaults
      formData.append("category", "General");
      formData.append("level", "beginner");
      formData.append("language", "Bangla");

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const { data } = await http.post("/api/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCourses((prev) => [data.course, ...prev]);
      setOpen(false);
      setForm({ title: "", description: "", price: 0 });
      setThumbnailFile(null);
      setThumbnailPreview("");
      alert("Course created! It is pending approval.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await http.delete(`/api/courses/${id}`);
      setCourses(courses.filter((c) => c._id !== id));
    } catch (e) {
      alert("Failed to delete course");
    }
  };

  const setCourseStatus = async (id, nextStatus) => {
    setMsg("");
    try {
      await http.patch(`/api/courses/${id}/status`, { status: nextStatus });
      setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, status: nextStatus, isPublished: nextStatus !== "approved" ? false : c.isPublished } : c)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update status");
    }
  };

  const setPublish = async (id, isPublished) => {
    setMsg("");
    try {
      await http.patch(`/api/courses/${id}/publish`, { isPublished });
      setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, isPublished } : c)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update publish");
    }
  };

  const viewStatus = (c) => (c.isPublished ? "published" : c.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Courses</h2>
          <p className="text-slate-400 text-sm">Approve/reject and publish courses.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>Refresh</button>
          <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onClick={() => setOpen(true)}>+ Create Course</button>
        </div>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      <div className="grid md:grid-cols-3 gap-3">
        <input className="w-full p-2 rounded bg-slate-900 border border-slate-800" placeholder="Search..."
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
        <select className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          value={published} onChange={(e) => setPublished(e.target.value)}>
          <option value="">All publish</option>
          <option value="true">published</option>
          <option value="false">unpublished</option>
        </select>
      </div>

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Teacher</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Publish</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>No courses</td></tr>
            ) : (
              courses.map((c) => (
                <tr key={c._id} className="border-t border-slate-800">
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.teacher?.name || "-"}</td>
                  <td className="p-3"><Pill text={viewStatus(c)} /></td>
                  <td className="p-3">{c.isPublished ? "Yes" : "No"}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <Link
                      to={`/admin/courses/${c._id}/edit`}
                      className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
                    >
                      Edit
                    </Link>
                    <button className="px-3 py-1.5 rounded bg-emerald-700/40 border border-emerald-700 hover:bg-emerald-700/60"
                      onClick={() => setCourseStatus(c._id, "approved")}>
                      Approve
                    </button>
                    <button className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                      onClick={() => deleteCourse(c._id)}>
                      Delete
                    </button>

                    <button className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                      onClick={() => setCourseStatus(c._id, "rejected")}>
                      Reject
                    </button>
                    <button className="px-3 py-1.5 rounded bg-amber-700/40 border border-amber-700 hover:bg-amber-700/60"
                      onClick={() => setCourseStatus(c._id, "pending")}>
                      Pending
                    </button>

                    <button
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                      disabled={c.status !== "approved"}
                      onClick={() => setPublish(c._id, !c.isPublished)}
                      title={c.status !== "approved" ? "Approve first" : ""}
                    >
                      {c.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Create modal */}
      {
        open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl border border-slate-800 rounded bg-slate-950 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Create Course (Admin)</h3>
                <button className="px-2 py-1 rounded hover:bg-slate-900" onClick={() => setOpen(false)}>✕</button>
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
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })}
                  />
                  <div>
                    <label className="text-xs text-slate-400">Thumbnail Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-2 rounded bg-slate-900 border border-slate-800 file:mr-3 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-sm file:text-slate-300"
                      onChange={handleThumbnailChange}
                    />
                  </div>
                </div>

                {thumbnailPreview && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Preview:</p>
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="h-24 rounded object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button type="button" className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button disabled={creating} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60">
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
