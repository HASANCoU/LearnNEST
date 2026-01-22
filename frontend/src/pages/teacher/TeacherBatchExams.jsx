import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

function Pill({ children, tone = "slate" }) {
  const map = {
    green: "bg-green-600/20 text-green-300 border-green-700/50",
    red: "bg-red-600/20 text-red-300 border-red-700/50",
    amber: "bg-amber-600/20 text-amber-300 border-amber-700/50",
    slate: "bg-slate-600/20 text-slate-300 border-slate-700/50",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="border border-slate-800 rounded p-4 bg-slate-950">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function TeacherBatchExams({ batchId }) {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [exams, setExams] = useState([]);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null); // exam

  const [viewingResults, setViewingResults] = useState(null); // exam
  const [resultsLoading, setResultsLoading] = useState(false);
  const [results, setResults] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 30,
    startAt: "",
    endAt: "",
    isPublished: true,
  });

  const [qLoading, setQLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qFormOpen, setQFormOpen] = useState(false);
  const [qForm, setQForm] = useState({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    marks: 1,
    negativeMarks: 0,
    order: 1,
  });

  const resetExamForm = () =>
    setForm({ title: "", description: "", durationMinutes: 30, startAt: "", endAt: "", isPublished: true });

  const loadExams = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await http.get(`/api/exams/batch/${batchId}`);
      setExams(data.exams || []);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    resetExamForm();
    setCreating(true);
  };

  const openEdit = (exam) => {
    setEditing(exam);
    setForm({
      title: exam.title || "",
      description: exam.description || "",
      durationMinutes: exam.durationMinutes ?? 30,
      startAt: exam.startAt ? new Date(exam.startAt).toISOString().slice(0, 16) : "",
      endAt: exam.endAt ? new Date(exam.endAt).toISOString().slice(0, 16) : "",
      isPublished: Boolean(exam.isPublished),
    });
  };

  const saveCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes || 30),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      };
      const { data } = await http.post(`/api/exams/batch/${batchId}`, payload);
      setExams((prev) => [data.exam, ...(prev || [])]);
      setCreating(false);
      resetExamForm();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create exam");
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes || 30),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      };
      const { data } = await http.patch(`/api/exams/${editing._id}`, payload);
      setExams((prev) => (prev || []).map((x) => (x._id === editing._id ? data.exam : x)));
      setEditing(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update exam");
    }
  };

  const togglePublish = async (exam) => {
    try {
      const { data } = await http.patch(`/api/exams/${exam._id}`, { isPublished: !exam.isPublished });
      setExams((prev) => (prev || []).map((x) => (x._id === exam._id ? data.exam : x)));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update publish state");
    }
  };

  const deleteExam = async (exam) => {
    if (!confirm("Delete this exam? (Questions will be removed too)")) return;
    try {
      await http.delete(`/api/exams/${exam._id}`);
      setExams((prev) => (prev || []).filter((x) => x._id !== exam._id));
      if (managing?._id === exam._id) {
        setManaging(null);
        setQuestions([]);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete exam");
    }
  };

  const loadQuestions = async (examId) => {
    setQLoading(true);
    try {
      const { data } = await http.get(`/api/questions/exam/${examId}`);
      setQuestions(data.questions || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load questions");
    } finally {
      setQLoading(false);
    }
  };

  const openManage = async (exam) => {
    setManaging(exam);
    setQuestions([]);
    await loadQuestions(exam._id);
  };

  const loadResults = async (examId) => {
    setResultsLoading(true);
    try {
      const { data } = await http.get(`/api/attempts?examId=${examId}`);
      setResults(data.results || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load results");
    } finally {
      setResultsLoading(false);
    }
  };

  const openResults = async (exam) => {
    setViewingResults(exam);
    setResults([]);
    await loadResults(exam._id);
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    if (!managing?._id) return;
    try {
      const payload = {
        text: qForm.text,
        options: qForm.options.filter((x) => x.trim().length > 0),
        correctIndex: Number(qForm.correctIndex),
        marks: Number(qForm.marks || 1),
        negativeMarks: Number(qForm.negativeMarks || 0),
        order: Number(qForm.order || 1),
      };
      const { data } = await http.post(`/api/questions/exam/${managing._id}`, payload);
      setQuestions((prev) => [...(prev || []), data.question]);
      setQFormOpen(false);
      setQForm({ text: "", options: ["", "", "", ""], correctIndex: 0, marks: 1, negativeMarks: 0, order: 1 });
      // refresh exam list to reflect totalMarks updates
      loadExams();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add question");
    }
  };

  const deleteQuestion = async (q) => {
    if (!confirm("Delete this question?")) return;
    try {
      await http.delete(`/api/questions/${q._id}`);
      setQuestions((prev) => (prev || []).filter((x) => x._id !== q._id));
      loadExams();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete question");
    }
  };

  const statusPill = useMemo(() => {
    return (exam) => {
      if (exam.isPublished) return <Pill tone="green">Published</Pill>;
      return <Pill tone="amber">Unpublished</Pill>;
    };
  }, []);

  useEffect(() => {
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exams</h3>
          <p className="text-slate-400 text-sm">Create exams, add questions, and publish/unpublish.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadExams} className="px-3 py-2 rounded border border-slate-800 text-sm">
            Refresh
          </button>
          <button onClick={openCreate} className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm">
            + New Exam
          </button>
        </div>
      </div>

      {msg && <div className="p-3 rounded border border-red-800 text-red-300 text-sm">{msg}</div>}

      {loading ? (
        <p className="text-slate-400">Loading exams…</p>
      ) : exams.length ? (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="p-4 rounded border border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold break-words">{exam.title}</p>
                    {statusPill(exam)}
                    <Pill tone="slate">{exam.durationMinutes} min</Pill>
                    <Pill tone="slate">Total: {exam.totalMarks || 0}</Pill>
                  </div>
                  {exam.description && <p className="text-slate-400 text-sm mt-1">{exam.description}</p>}
                  <p className="text-slate-500 text-xs mt-2">
                    {exam.startAt ? `Start: ${new Date(exam.startAt).toLocaleString()}` : "Start: (anytime)"} • {" "}
                    {exam.endAt ? `End: ${new Date(exam.endAt).toLocaleString()}` : "End: (no limit)"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => openManage(exam)}
                    className="px-3 py-2 rounded border border-slate-800 text-sm"
                  >
                    Questions
                  </button>
                  <button
                    onClick={() => openResults(exam)}
                    className="px-3 py-2 rounded border border-slate-800 text-sm"
                  >
                    Results
                  </button>
                  <button
                    onClick={() => togglePublish(exam)}
                    className="px-3 py-2 rounded border border-slate-800 text-sm"
                  >
                    {exam.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => openEdit(exam)} className="px-3 py-2 rounded border border-slate-800 text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => deleteExam(exam)}
                    className="px-3 py-2 rounded border border-red-900 text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No exams yet.</p>
      )}

      {(creating || editing) && (
        <ModalShell title={creating ? "Create Exam" : "Edit Exam"} onClose={() => (creating ? setCreating(false) : setEditing(null))}>
          <form onSubmit={creating ? saveCreate : saveEdit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Title *</label>
              <input
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Description</label>
              <textarea
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Start At (optional)</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={form.startAt}
                  onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">End At (optional)</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  value={form.endAt}
                  onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published (students can see & start)
            </label>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => (creating ? setCreating(false) : setEditing(null))}
                className="px-3 py-2 rounded border border-slate-800 text-sm"
              >
                Cancel
              </button>
              <button className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm">
                Save
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {managing && (
        <ModalShell
          title={`Questions — ${managing.title}`}
          onClose={() => {
            setManaging(null);
            setQuestions([]);
            setQFormOpen(false);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-slate-400 text-sm">Total questions: {questions.length}</p>
            <div className="flex gap-2">
              <button
                onClick={() => loadQuestions(managing._id)}
                className="px-3 py-2 rounded border border-slate-800 text-sm"
              >
                Refresh
              </button>
              <button
                onClick={() => setQFormOpen(true)}
                className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm"
              >
                + Add Question
              </button>
            </div>
          </div>

          {qLoading ? (
            <p className="text-slate-400 mt-3">Loading questions…</p>
          ) : questions.length ? (
            <div className="mt-3 space-y-3">
              {questions
                .slice()
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((q) => (
                  <div key={q._id} className="p-3 rounded border border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {q.order}. {q.text}
                        </p>
                        <div className="mt-2 space-y-1">
                          {(q.options || []).map((opt, idx) => (
                            <div
                              key={idx}
                              className={`text-sm px-2 py-1 rounded border border-slate-800 ${
                                idx === q.correctIndex ? "bg-green-600/10" : ""
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}. {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                          Marks: {q.marks} • Negative: {q.negativeMarks}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteQuestion(q)}
                        className="px-3 py-2 rounded border border-red-900 text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-slate-400 mt-3">No questions yet.</p>
          )}

          {qFormOpen && (
            <div className="mt-4 p-3 rounded border border-slate-800">
              <h4 className="font-semibold">Add Question</h4>
              <form onSubmit={addQuestion} className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Question text *</label>
                  <textarea
                    className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                    rows={3}
                    value={qForm.text}
                    onChange={(e) => setQForm((p) => ({ ...p, text: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qForm.options.map((opt, idx) => (
                    <div key={idx}>
                      <label className="text-xs text-slate-400">Option {String.fromCharCode(65 + idx)} *</label>
                      <input
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        value={opt}
                        onChange={(e) =>
                          setQForm((p) => {
                            const next = [...p.options];
                            next[idx] = e.target.value;
                            return { ...p, options: next };
                          })
                        }
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Correct Index</label>
                    <select
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      value={qForm.correctIndex}
                      onChange={(e) => setQForm((p) => ({ ...p, correctIndex: e.target.value }))}
                    >
                      {qForm.options.map((_, idx) => (
                        <option key={idx} value={idx}>
                          {String.fromCharCode(65 + idx)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Marks</label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      value={qForm.marks}
                      onChange={(e) => setQForm((p) => ({ ...p, marks: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Negative Marks</label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      value={qForm.negativeMarks}
                      onChange={(e) => setQForm((p) => ({ ...p, negativeMarks: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Order</label>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      value={qForm.order}
                      onChange={(e) => setQForm((p) => ({ ...p, order: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setQFormOpen(false)}
                    className="px-3 py-2 rounded border border-slate-800 text-sm"
                  >
                    Cancel
                  </button>
                  <button className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm">Add</button>
                </div>
              </form>
            </div>
          )}
        </ModalShell>
      )}

      {viewingResults && (
        <ModalShell
          title={`Results — ${viewingResults.title}`}
          onClose={() => {
            setViewingResults(null);
            setResults([]);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-slate-400 text-sm">Submitted: {results.length}</p>
            <button
              onClick={() => loadResults(viewingResults._id)}
              className="px-3 py-2 rounded border border-slate-800 text-sm"
            >
              Refresh
            </button>
          </div>

          {resultsLoading ? (
            <p className="text-slate-400 mt-3">Loading results…</p>
          ) : results.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="text-left p-3">Student</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Score</th>
                    <th className="text-left p-3">Correct</th>
                    <th className="text-left p-3">Wrong</th>
                    <th className="text-left p-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} className="border-t border-slate-800">
                      <td className="p-3">{r.student?.name || "Student"}</td>
                      <td className="p-3 text-slate-400">{r.student?.email || "—"}</td>
                      <td className="p-3">{r.score}</td>
                      <td className="p-3">{r.correctCount}</td>
                      <td className="p-3">{r.wrongCount}</td>
                      <td className="p-3 text-slate-400">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 mt-3">No submissions yet.</p>
          )}
        </ModalShell>
      )}
    </div>
  );
}
