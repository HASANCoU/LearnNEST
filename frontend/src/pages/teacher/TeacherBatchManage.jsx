import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../../api/http";
import TeacherBatchAnnouncements from "./TeacherBatchAnnouncements";
import TeacherBatchAttendance from "./TeacherBatchAttendance";
import TeacherBatchCompletion from "./TeacherBatchCompletion";
import TeacherBatchExams from "./TeacherBatchExams";
import TeacherBatchLive from "./TeacherBatchLive";

function StatusPill({ status }) {
  const cls =
    status === "approved"
      ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
      : status === "rejected"
      ? "bg-rose-900/40 border-rose-700 text-rose-200"
      : "bg-amber-900/40 border-amber-700 text-amber-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${cls}`}>
      {status}
    </span>
  );
}

function PublishedPill({ isPublished }) {
  const cls = isPublished
    ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
    : "bg-amber-900/40 border-amber-700 text-amber-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${cls}`}>
      {isPublished ? "published" : "draft"}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded border border-slate-800 hover:border-slate-700 text-sm ${
        active ? "bg-slate-900" : ""
      }`}
    >
      {children}
    </button>
  );
}

function LessonForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    order: initial?.order ?? 1,
    scheduledAt: initial?.scheduledAt ? String(initial.scheduledAt).slice(0, 16) : "",
    isPublished: !!initial?.isPublished,
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: form.title,
          description: form.description,
          order: Number(form.order),
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          isPublished: !!form.isPublished,
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Title</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            placeholder="Lesson title"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Order</label>
          <input
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => update("order", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          rows={3}
          placeholder="What will be covered in this lesson?"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Scheduled At (optional)</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => update("scheduledAt", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          />
        </div>

        <label className="flex items-center gap-2 mt-6 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => update("isPublished", e.target.checked)}
          />
          Publish
        </label>
      </div>

      <div className="flex gap-2">
        <button
          disabled={submitting}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Saving..." : initial?._id ? "Update Lesson" : "Create Lesson"}
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function MaterialForm({ initial, lessons, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    type: initial?.type || "link",
    url: initial?.url || "",
    note: initial?.note || "",
    lessonId: initial?.lesson?._id || "",
    isPublished: !!initial?.isPublished,
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: form.title,
          type: form.type,
          url: form.url,
          note: form.note,
          lessonId: form.lessonId || null,
          isPublished: !!form.isPublished,
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Title</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            placeholder="Material title"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Type</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          >
            <option value="link">Link</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="note">Note</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">URL (optional for note type)</label>
        <input
          value={form.url}
          onChange={(e) => update("url", e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-xs text-slate-400">Attach to Lesson (optional)</label>
        <select
          value={form.lessonId}
          onChange={(e) => update("lessonId", e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
        >
          <option value="">— None —</option>
          {(lessons || []).map((l) => (
            <option key={l._id} value={l._id}>
              {l.order}. {l.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400">Note (optional)</label>
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          rows={3}
          placeholder="Any additional notes"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => update("isPublished", e.target.checked)}
        />
        Publish
      </label>

      <div className="flex gap-2">
        <button
          disabled={submitting}
          className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Saving..." : initial?._id ? "Update Material" : "Create Material"}
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AssignmentForm({ initial, lessons, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    dueDate: initial?.dueDate ? String(initial.dueDate).slice(0, 16) : "",
    totalMarks: initial?.totalMarks ?? 100,
    lessonId: initial?.lesson?._id || initial?.lesson || "",
    isPublished: !!initial?.isPublished,
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      totalMarks: Number(form.totalMarks || 0),
      lessonId: form.lessonId || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Title *</label>
          <input
            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Assignment title"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Total Marks</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={form.totalMarks}
            onChange={(e) => update("totalMarks", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Due Date</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-500">Leave empty for no deadline.</p>
        </div>

        <div>
          <label className="text-xs text-slate-400">Link to Lesson (optional)</label>
          <select
            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={form.lessonId}
            onChange={(e) => update("lessonId", e.target.value)}
          >
            <option value="">— None —</option>
            {(lessons || []).map((l) => (
              <option key={l._id} value={l._id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Description</label>
        <textarea
          className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          placeholder="Assignment details..."
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => update("isPublished", e.target.checked)}
        />
        Publish now
      </label>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded border border-slate-800 text-sm"
        >
          Cancel
        </button>
        <button
          disabled={submitting}
          className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function GradeForm({ submission, onSubmit, onCancel, submitting }) {
  const [marks, setMarks] = useState(submission?.marks ?? "");
  const [feedback, setFeedback] = useState(submission?.feedback ?? "");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ marks: marks === "" ? null : Number(marks), feedback });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Marks</label>
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Status</label>
          <div className="mt-2">
            <StatusPill status={submission?.status || "submitted"} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Feedback</label>
        <textarea
          className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Feedback for student..."
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded border border-slate-800 text-sm"
        >
          Cancel
        </button>
        <button
          disabled={submitting}
          className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save grade"}
        </button>
      </div>
    </form>
  );
}

export default function TeacherBatchManage() {
  const { batchId } = useParams();
  const [tab, setTab] = useState("enrollments");
  const [msg, setMsg] = useState("");

  // enrollments
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(true);

  // lessons
  const [lessons, setLessons] = useState([]);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  // materials
  const [materials, setMaterials] = useState([]);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialSubmitting, setMaterialSubmitting] = useState(false);

  // assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // submissions (for selected assignment)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

  const headerTitle = useMemo(() => {
    if (tab === "lessons") return "Batch Lessons";
    if (tab === "materials") return "Batch Materials";
    if (tab === "assignments") return "Batch Assignments";
    if (tab === "exams") return "Batch Exams";
    return "Batch Enrollments";
  }, [tab]);

  const loadEnrollments = async () => {
    setEnrollLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/enrollments?batchId=${batchId}`);
      setEnrollments(data.enrollments || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load enrollments");
    } finally {
      setEnrollLoading(false);
    }
  };

  const loadLessons = async () => {
    setLessonLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/lessons/batch/${batchId}`);
      setLessons(data.lessons || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load lessons");
    } finally {
      setLessonLoading(false);
    }
  };

  const loadMaterials = async () => {
    setMaterialLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/materials/batch/${batchId}`);
      setMaterials(data.materials || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load materials");
    } finally {
      setMaterialLoading(false);
    }
  }; // ✅ IMPORTANT: this closing brace was missing in your file

  const loadAssignments = async () => {
    setAssignmentLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/assignments/batch/${batchId}`);
      setAssignments(data.assignments || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load assignments");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    if (!assignmentId) return;
    setSubmissionsLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/submissions?assignmentId=${assignmentId}`);
      setSubmissions(data.submissions || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    if (tab === "lessons") loadLessons();
    if (tab === "materials") {
      loadLessons();
      loadMaterials();
    }
    if (tab === "assignments") {
      loadLessons();
      loadAssignments();
      setSelectedAssignmentId(null);
      setSubmissions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, batchId]);

  const setEnrollmentStatus = async (id, status) => {
    setMsg("");
    try {
      await http.patch(`/api/enrollments/${id}/status`, { status });
      setEnrollments((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update status");
    }
  };

  const openCreateAssignment = () => {
    setEditingAssignment(null);
    setAssignmentFormOpen(true);
  };

  const openEditAssignment = (a) => {
    setEditingAssignment(a);
    setAssignmentFormOpen(true);
  };

  const createOrUpdateAssignment = async (payload) => {
    setAssignmentSubmitting(true);
    setMsg("");
    try {
      if (editingAssignment?._id) {
        const { data } = await http.patch(`/api/assignments/${editingAssignment._id}`, payload);
        const updated = data.assignment;
        setAssignments((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      } else {
        const { data } = await http.post(`/api/assignments/batch/${batchId}`, payload);
        setAssignments((prev) => [data.assignment, ...prev]);
      }
      setAssignmentFormOpen(false);
      setEditingAssignment(null);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save assignment");
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    setMsg("");
    try {
      await http.delete(`/api/assignments/${id}`);
      setAssignments((prev) => prev.filter((x) => x._id !== id));
      if (selectedAssignmentId === id) {
        setSelectedAssignmentId(null);
        setSubmissions([]);
      }
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to delete assignment");
    }
  };

  const selectAssignment = async (id) => {
    setSelectedAssignmentId(id);
    await loadSubmissions(id);
  };

  const openGrade = (s) => setGradingSubmission(s);

  const submitGrade = async ({ marks, feedback }) => {
    if (!gradingSubmission?._id) return;
    setGradingSubmitting(true);
    setMsg("");
    try {
      const { data } = await http.patch(`/api/submissions/${gradingSubmission._id}/grade`, {
        marks,
        feedback,
      });
      const updated = data.submission;
      setSubmissions((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setGradingSubmission(null);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to grade submission");
    } finally {
      setGradingSubmitting(false);
    }
  };

  const createOrUpdateLesson = async (payload) => {
    setLessonSubmitting(true);
    setMsg("");
    try {
      if (editingLesson?._id) {
        const { data } = await http.patch(`/api/lessons/${editingLesson._id}`, payload);
        const updated = data.lesson;
        setLessons((prev) =>
          prev
            .map((l) => (l._id === updated._id ? updated : l))
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );
      } else {
        const { data } = await http.post(`/api/lessons/batch/${batchId}`, payload);
        const created = data.lesson;
        setLessons((prev) =>
          [...prev, created].slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );
      }
      setLessonFormOpen(false);
      setEditingLesson(null);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save lesson");
    } finally {
      setLessonSubmitting(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    const ok = confirm("Delete this lesson?");
    if (!ok) return;
    setMsg("");
    try {
      await http.delete(`/api/lessons/${lessonId}`);
      setLessons((prev) => prev.filter((l) => l._id !== lessonId));
      if (tab === "materials") loadMaterials();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to delete lesson");
    }
  };

  const createOrUpdateMaterial = async (payload) => {
    setMaterialSubmitting(true);
    setMsg("");
    try {
      if (editingMaterial?._id) {
        const { data } = await http.patch(`/api/materials/${editingMaterial._id}`, payload);
        const updated = data.material;
        setMaterials((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      } else {
        const { data } = await http.post(`/api/materials/batch/${batchId}`, payload);
        const created = data.material;
        setMaterials((prev) => [...prev, created]);
      }
      setMaterialFormOpen(false);
      setEditingMaterial(null);
      loadMaterials();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to save material");
    } finally {
      setMaterialSubmitting(false);
    }
  };

  const deleteMaterial = async (materialId) => {
    const ok = confirm("Delete this material?");
    if (!ok) return;
    setMsg("");
    try {
      await http.delete(`/api/materials/${materialId}`);
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to delete material");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">{headerTitle}</h2>
          <p className="text-slate-400 text-sm">Batch ID: {batchId}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
            onClick={() => {
              if (tab === "enrollments") loadEnrollments();
              if (tab === "lessons") loadLessons();
              if (tab === "materials") {
                loadLessons();
                loadMaterials();
              }
              if (tab === "assignments") {
                loadLessons();
                loadAssignments();
              }
            }}
          >
            Refresh
          </button>
          <Link className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" to="/teacher/batches">
            Back
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "enrollments"} onClick={() => setTab("enrollments")}>
          Enrollments
        </TabButton>
        <TabButton active={tab === "lessons"} onClick={() => setTab("lessons")}>
          Lessons
        </TabButton>
        <TabButton active={tab === "materials"} onClick={() => setTab("materials")}>
          Materials
        </TabButton>
        <TabButton active={tab === "assignments"} onClick={() => setTab("assignments")}>
          Assignments
        </TabButton>
        <TabButton active={tab === "exams"} onClick={() => setTab("exams")}>
          Exams
        </TabButton>
        <TabButton active={tab === "live"} onClick={() => setTab("live")}>
          Live Classes
        </TabButton>
        <TabButton active={tab === "attendance"} onClick={() => setTab("attendance")}>
          Attendance
        </TabButton>
        <TabButton active={tab === "announcements"} onClick={() => setTab("announcements")}>
          Announcements
        </TabButton>
        <TabButton active={tab === "completion"} onClick={() => setTab("completion")}>
          Final Completion
        </TabButton>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      {/* ENROLLMENTS */}
      {tab === "enrollments" && (
        <div className="border border-slate-800 rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollLoading ? (
                <tr>
                  <td className="p-3 text-slate-400" colSpan={4}>
                    Loading...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-400" colSpan={4}>
                    No enrollments
                  </td>
                </tr>
              ) : (
                enrollments.map((en) => (
                  <tr key={en._id} className="border-t border-slate-800">
                    <td className="p-3">{en.student?.name || "-"}</td>
                    <td className="p-3">{en.student?.email || "-"}</td>
                    <td className="p-3">
                      <StatusPill status={en.status} />
                    </td>
                    <td className="p-3 flex flex-wrap gap-2">
                      <button
                        className="px-3 py-1.5 rounded bg-emerald-700/40 border border-emerald-700 hover:bg-emerald-700/60"
                        onClick={() => setEnrollmentStatus(en._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                        onClick={() => setEnrollmentStatus(en._id, "rejected")}
                      >
                        Reject
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-amber-700/40 border border-amber-700 hover:bg-amber-700/60"
                        onClick={() => setEnrollmentStatus(en._id, "pending")}
                      >
                        Pending
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LESSONS */}
      {tab === "lessons" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">Tip: students only see **published** lessons.</p>
            <button
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
              onClick={() => {
                setEditingLesson(null);
                setLessonFormOpen(true);
              }}
            >
              + New Lesson
            </button>
          </div>

          {lessonFormOpen && (
            <LessonForm
              initial={editingLesson}
              submitting={lessonSubmitting}
              onCancel={() => {
                setLessonFormOpen(false);
                setEditingLesson(null);
              }}
              onSubmit={createOrUpdateLesson}
            />
          )}

          {lessonLoading ? (
            <p>Loading...</p>
          ) : lessons.length === 0 ? (
            <p className="text-slate-400">No lessons yet.</p>
          ) : (
            lessons
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((l) => (
                <div key={l._id} className="p-4 rounded border border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {l.order}. {l.title}{" "}
                        {l.isPublished ? (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded border border-emerald-700 text-emerald-300">
                            published
                          </span>
                        ) : (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                            draft
                          </span>
                        )}
                      </p>
                      {l.description && <p className="text-slate-400 text-sm mt-1">{l.description}</p>}
                      {l.scheduledAt && (
                        <p className="text-slate-500 text-xs mt-1">
                          Scheduled: {new Date(l.scheduledAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                        onClick={() => {
                          setEditingLesson(l);
                          setLessonFormOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                        onClick={() => deleteLesson(l._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* MATERIALS */}
      {tab === "materials" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">Tip: students only see **published** materials.</p>
            <button
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
              onClick={() => {
                setEditingMaterial(null);
                setMaterialFormOpen(true);
              }}
            >
              + New Material
            </button>
          </div>

          {materialFormOpen && (
            <MaterialForm
              initial={editingMaterial}
              lessons={lessons || []}
              submitting={materialSubmitting}
              onCancel={() => {
                setMaterialFormOpen(false);
                setEditingMaterial(null);
              }}
              onSubmit={createOrUpdateMaterial}
            />
          )}

          {materialLoading ? (
            <p>Loading...</p>
          ) : materials.length === 0 ? (
            <p className="text-slate-400">No materials yet.</p>
          ) : (
            materials.map((m) => (
              <div key={m._id} className="p-4 rounded border border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {m.title} <PublishedPill isPublished={!!m.isPublished} />
                    </p>
                    <p className="text-slate-400 text-sm">
                      Type: {m.type}
                      {m.lesson?.title ? ` • Lesson: ${m.lesson.title}` : ""}
                    </p>
                    {m.url ? (
                      <a
                        className="text-indigo-400 hover:underline break-all text-sm"
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.url}
                      </a>
                    ) : null}
                    {m.note ? <p className="text-slate-400 text-sm">{m.note}</p> : null}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                      onClick={() => {
                        setEditingMaterial(m);
                        setMaterialFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                      onClick={() => deleteMaterial(m._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ASSIGNMENTS */}
      {tab === "assignments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Tip: students can submit only for **published** assignments.
            </p>
            <button
              className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm"
              onClick={openCreateAssignment}
            >
              + Create Assignment
            </button>
          </div>

          {(assignmentFormOpen || gradingSubmission) && (
            <div className="border border-slate-800 rounded p-4 bg-slate-950">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {gradingSubmission
                    ? "Grade Submission"
                    : editingAssignment
                    ? "Edit Assignment"
                    : "Create Assignment"}
                </h3>
                <button
                  className="text-slate-400 hover:text-slate-200"
                  onClick={() => {
                    setAssignmentFormOpen(false);
                    setEditingAssignment(null);
                    setGradingSubmission(null);
                  }}
                >
                  ✕
                </button>
              </div>

              {gradingSubmission ? (
                <GradeForm
                  submission={gradingSubmission}
                  submitting={gradingSubmitting}
                  onCancel={() => setGradingSubmission(null)}
                  onSubmit={submitGrade}
                />
              ) : (
                <AssignmentForm
                  initial={editingAssignment}
                  lessons={lessons}
                  submitting={assignmentSubmitting}
                  onCancel={() => {
                    setAssignmentFormOpen(false);
                    setEditingAssignment(null);
                  }}
                  onSubmit={createOrUpdateAssignment}
                />
              )}
            </div>
          )}

          {assignmentLoading ? (
            <div className="text-slate-400">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-slate-400">No assignments yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {assignments.map((a) => (
                <div key={a._id} className="border border-slate-800 rounded p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{a.title}</h4>
                        <PublishedPill isPublished={!!a.isPublished} />
                        <span className="text-xs text-slate-500">{a.totalMarks ?? 100} marks</span>
                        {a.dueDate && (
                          <span className="text-xs text-slate-500">
                            due: {new Date(a.dueDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {a.lesson && (
                        <div className="text-xs text-slate-500 mt-1">
                          Lesson: {a.lesson?.title || a.lesson}
                        </div>
                      )}
                      {a.description && (
                        <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                          {a.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      <button
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                        onClick={() => openEditAssignment(a)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                        onClick={() => selectAssignment(a._id)}
                      >
                        Submissions
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                        onClick={() => deleteAssignment(a._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {selectedAssignmentId === a._id && (
                    <div className="mt-4 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold">Submissions</h5>
                        <button
                          className="text-xs text-slate-400 hover:text-slate-200"
                          onClick={() => loadSubmissions(a._id)}
                        >
                          Refresh
                        </button>
                      </div>

                      {submissionsLoading ? (
                        <div className="text-slate-400 mt-2">Loading submissions...</div>
                      ) : submissions.length === 0 ? (
                        <div className="text-slate-400 mt-2">No submissions yet.</div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {submissions.map((s) => (
                            <div
                              key={s._id}
                              className="border border-slate-800 rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {s.student?.name || "Student"}{" "}
                                  <span className="text-xs text-slate-500">
                                    {s.student?.email ? `(${s.student.email})` : ""}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  <a
                                    className="underline hover:text-slate-200"
                                    href={s.submissionUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Submission Link
                                  </a>
                                  {" • "}
                                  {new Date(s.createdAt).toLocaleString()}
                                  {s.status === "graded" && s.gradedAt
                                    ? ` • graded: ${new Date(s.gradedAt).toLocaleString()}`
                                    : ""}
                                </div>
                                {s.note && (
                                  <div className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                                    {s.note}
                                  </div>
                                )}
                                {s.status === "graded" && (
                                  <div className="text-sm text-slate-300 mt-2">
                                    <span className="font-semibold">Marks:</span>{" "}
                                    {s.marks ?? "-"}
                                    {s.feedback ? (
                                      <>
                                        {" • "}
                                        <span className="font-semibold">Feedback:</span>{" "}
                                        {s.feedback}
                                      </>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button
                                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                                  onClick={() => openGrade(s)}
                                >
                                  Grade
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "exams" && <TeacherBatchExams batchId={batchId} />}
      {tab === "live" && <TeacherBatchLive batchId={batchId} />}
      {tab === "attendance" && <TeacherBatchAttendance batchId={batchId} />}
      {tab === "announcements" && <TeacherBatchAnnouncements batchId={batchId} />}
      {tab === "completion" && <TeacherBatchCompletion batchId={batchId} />}
    </div>
  );
}
