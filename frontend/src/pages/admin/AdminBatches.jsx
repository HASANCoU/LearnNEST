import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../../api/http";

function toISODateInput(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // batch or null
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    courseId: "",
    name: "",
    code: "",
    teacherId: "",
    startDate: "",
    endDate: "",
    seatLimit: 0,
    isActive: true,
  };

  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const [bRes, cRes, uRes] = await Promise.all([
        http.get("/api/batches/me"), // admin gets all
        http.get("/api/admin/courses"),
        http.get("/api/admin/users"),
      ]);

      setBatches(bRes.data.batches || []);
      setCourses(cRes.data.courses || []);
      const allUsers = uRes.data.users || [];
      setTeachers(allUsers.filter((u) => u.role === "teacher"));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return batches;
    return batches.filter((b) => {
      return (
        (b.name || "").toLowerCase().includes(qq) ||
        (b.code || "").toLowerCase().includes(qq) ||
        (b.course?.title || "").toLowerCase().includes(qq) ||
        (b.teacher?.name || "").toLowerCase().includes(qq)
      );
    });
  }, [batches, q]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      courseId: b.course?._id || "",
      name: b.name || "",
      code: b.code || "",
      teacherId: b.teacher?._id || b.teacher || "",
      startDate: toISODateInput(b.startDate),
      endDate: toISODateInput(b.endDate),
      seatLimit: Number(b.seatLimit || 0),
      isActive: b.isActive !== false,
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      if (!form.courseId || !form.name || !form.code || !form.teacherId) {
        setMsg("course, name, code, teacher are required");
        setSaving(false);
        return;
      }

      const payload = {
        courseId: form.courseId,
        name: form.name,
        code: form.code,
        teacherId: form.teacherId,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        seatLimit: Number(form.seatLimit || 0),
        isActive: !!form.isActive,
      };

      if (!editing) {
        const { data } = await http.post("/api/batches", payload);
        setBatches((prev) => [data.batch, ...prev]);
      } else {
        const updates = {
          name: payload.name,
          code: payload.code,
          teacher: payload.teacherId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          seatLimit: payload.seatLimit,
          isActive: payload.isActive,
        };
        const { data } = await http.patch(`/api/batches/${editing._id}`, updates);

        // We need to re-fetch to populate course/teacher fields consistently
        await load();
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete batch? This cannot be undone.")) return;
    try {
      await http.delete(`/api/batches/${id}`);
      setBatches((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert("Failed to delete batch");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batches</h2>
          <p className="text-slate-400 text-sm">
            Create batches, assign teachers, set dates and seat limits.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
            Refresh
          </button>
          <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onClick={openCreate}>
            + Create Batch
          </button>
        </div>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      <input
        className="w-full p-2 rounded bg-slate-900 border border-slate-800"
        placeholder="Search batch/course/teacher..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-3">Batch</th>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Course</th>
              <th className="text-left p-3">Teacher</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Seats</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-slate-400" colSpan={7}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={7}>No batches</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id} className="border-t border-slate-800">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3">{b.code}</td>
                  <td className="p-3">{b.course?.title || "-"}</td>
                  <td className="p-3">{b.teacher?.name || "-"}</td>
                  <td className="p-3">{b.isActive ? "Yes" : "No"}</td>
                  <td className="p-3">{Number(b.seatLimit || 0) === 0 ? "Unlimited" : b.seatLimit}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500" to={`/admin/batches/${b._id}`}>
                        Manage
                      </Link>
                      <button className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700" onClick={() => openEdit(b)}>
                        Edit
                      </button>
                      <button className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60" onClick={() => deleteBatch(b._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl border border-slate-800 rounded bg-slate-950 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{editing ? "Edit Batch" : "Create Batch"}</h3>
              <button className="px-2 py-1 rounded hover:bg-slate-900" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={submit} className="mt-4 grid gap-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Course *</label>
                  <select
                    disabled={!!editing}
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800 disabled:opacity-60"
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.status}{c.isPublished ? ", published" : ""})
                      </option>
                    ))}
                  </select>
                  {editing && (
                    <p className="text-xs text-slate-500 mt-1">
                      Course cannot be changed after batch creation.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400">Teacher *</label>
                  <select
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Batch Name *</label>
                  <input
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    placeholder="Batch-1"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Batch Code *</label>
                  <input
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    placeholder="MERN-B1-2026"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Start Date</label>
                  <input
                    type="date"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">End Date</label>
                  <input
                    type="date"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Seat Limit</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                    value={form.seatLimit}
                    onChange={(e) => setForm({ ...form, seatLimit: Number(e.target.value || 0) })}
                  />
                  <p className="text-xs text-slate-500 mt-1">0 = unlimited</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
