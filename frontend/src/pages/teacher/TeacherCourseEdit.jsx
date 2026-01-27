import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../../api/http";
import { getUser } from "../../auth/auth";

export default function TeacherCourseEdit() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = getUser();

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/courses/${courseId}`);
      setCourse(data.course);
      setForm({
        title: data.course.title || "",
        description: data.course.description || "",
        price: data.course.price || 0,

        thumbnailUrl: data.course.thumbnailUrl || "",
        teacher: data.course.teacher?._id || data.course.teacher,
        // Preserving defaults for hidden fields
        category: "General",
        level: "beginner",
        language: "Bangla",
      });
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      http.get("/api/users/teachers").then(({ data }) => setTeachers(data.teachers || []));
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [courseId]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const { data } = await http.patch(`/api/courses/${courseId}`, form);
      setCourse(data.course);
      setMsg("Saved. (Course may go back to pending & unpublished after edit.)");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Edit Course</h2>
          <p className="text-slate-400 text-sm">
            {course?.title} • status: {course?.status} • published:{" "}
            {String(course?.isPublished)}
          </p>
        </div>
        <button
          className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
          onClick={() => nav(user?.role === "admin" ? "/admin/courses" : "/teacher/courses")}
        >
          ← Back
        </button>
      </div>

      {msg && (
        <div className="border border-slate-800 rounded p-3 text-slate-200">
          {msg}
        </div>
      )}

      {!form ? null : (
        <form onSubmit={save} className="grid gap-3 border border-slate-800 rounded p-5">
          <input
            className="w-full p-2 rounded bg-slate-900 border border-slate-800"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            className="w-full p-2 rounded bg-slate-900 border border-slate-800"
            placeholder="Description"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {/* Removed Category, Level, Language inputs as per request */}

          {user?.role === "admin" && (
            <div>
              <label className="text-xs text-slate-400">Teacher (Admin Assign)</label>
              <select
                className="w-full p-2 rounded bg-slate-900 border border-slate-800"
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              >
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="number"
              className="w-full p-2 rounded bg-slate-900 border border-slate-800"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })}
            />
            <input
              className="w-full p-2 rounded bg-slate-900 border border-slate-800"
              placeholder="Thumbnail URL"
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <button
              disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
