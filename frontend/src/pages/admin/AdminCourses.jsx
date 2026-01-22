import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

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
        <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>Refresh</button>
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
                    <button className="px-3 py-1.5 rounded bg-emerald-700/40 border border-emerald-700 hover:bg-emerald-700/60"
                      onClick={() => setCourseStatus(c._id, "approved")}>
                      Approve
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
    </div>
  );
}
