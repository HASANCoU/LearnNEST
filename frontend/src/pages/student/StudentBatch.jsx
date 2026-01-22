import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { http } from "../../api/http";
import StudentBatchAnnouncements from "./StudentBatchAnnouncements";
import StudentBatchCompletion from "./StudentBatchCompletion";

const tabs = [
  { key: "announcements", label: "Announcements" },
  { key: "lessons", label: "Lessons" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "live", label: "Live Classes" },
  { key: "attendance", label: "Attendance" },
  { key: "exams", label: "Exams" },
  { key: "results", label: "Results" },
  { key: "completion", label: "Completion" },
];

export default function StudentBatch() {
  const { batchId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "announcements";
  const [active, setActive] = useState(initialTab);
  const [state, setState] = useState({ loading: true, data: [], msg: "" });

  // exams attempt
  const [attempting, setAttempting] = useState(null); // exam
  const [qState, setQState] = useState({ loading: false, questions: [], msg: "" });
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [submittingExam, setSubmittingExam] = useState(false);

  const [mySubs, setMySubs] = useState([]);
  const [submitFor, setSubmitFor] = useState(null);
  const [subForm, setSubForm] = useState({ submissionUrl: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => `Batch: ${batchId}`, [batchId]);

  const setTab = (k) => {
    setActive(k);
    setSearchParams({ tab: k });
  };

  const mySubByAssignment = useMemo(() => {
    const map = new Map();
    (mySubs || []).forEach((s) => {
      const id = s.assignment?._id || s.assignment;
      if (id) map.set(String(id), s);
    });
    return map;
  }, [mySubs]);

  const load = async (tab) => {
    setState({ loading: true, data: [], msg: "" });
    try {
      if (tab === "announcements") {
        // handled by component (no-op here)
        return setState({ loading: false, data: [], msg: "" });
      }
      if (tab === "completion") {
        // handled by component
        return setState({ loading: false, data: [], msg: "" });
      }
      if (tab === "lessons") {
        const { data } = await http.get(`/api/lessons/batch/${batchId}`);
        return setState({ loading: false, data: data.lessons || [], msg: "" });
      }
      if (tab === "materials") {
        const { data } = await http.get(`/api/materials/batch/${batchId}`);
        return setState({ loading: false, data: data.materials || [], msg: "" });
      }
      if (tab === "assignments") {
        const [aRes, sRes] = await Promise.all([
          http.get(`/api/assignments/batch/${batchId}`),
          http.get(`/api/submissions/me?batchId=${batchId}`),
        ]);
        setMySubs(sRes.data.submissions || []);
        return setState({ loading: false, data: aRes.data.assignments || [], msg: "" });
      }
      if (tab === "live") {
        const { data } = await http.get(`/api/live-classes/batch/${batchId}`);
        return setState({ loading: false, data: data.liveClasses || [], msg: "" });
      }
      if (tab === "attendance") {
        const { data } = await http.get(`/api/attendance/me?batchId=${batchId}`);
        return setState({ loading: false, data: data.records || [], msg: "" });
      }
      if (tab === "exams") {
        const { data } = await http.get(`/api/exams/batch/${batchId}`);
        return setState({ loading: false, data: data.exams || [], msg: "" });
      }
      if (tab === "results") {
        const { data } = await http.get(`/api/attempts/me?batchId=${batchId}`);
        return setState({ loading: false, data: data.results || [], msg: "" });
      }
      setState({ loading: false, data: [], msg: "Unknown tab" });
    } catch (err) {
      setState({
        loading: false,
        data: [],
        msg: err?.response?.data?.message || "Failed to load",
      });
    }
  };

  const closeAttempt = () => {
    setAttempting(null);
    setQState({ loading: false, questions: [], msg: "" });
    setAnswers({});
    setTimeLeft(null);
    setSubmittingExam(false);
  };

  const startExamFlow = async (exam) => {
    if (!exam?._id) return;
    setAttempting(exam);
    setAnswers({});
    setQState({ loading: true, questions: [], msg: "" });

    try {
      // start attempt (backend enforces published + window + enrolled)
      try {
        await http.post(`/api/attempts/exam/${exam._id}/start`);
      } catch (err) {
        // 409 = already started/submitted → still allow opening questions
        if (err?.response?.status !== 409) throw err;
      }

      const { data } = await http.get(`/api/questions/exam/${exam._id}`);
      const qs = data.questions || [];
      setQState({ loading: false, questions: qs, msg: "" });

      // start local timer (best-effort; backend is source of truth)
      const minutes = Number(exam.durationMinutes || 30);
      setTimeLeft(Math.max(1, minutes * 60));
    } catch (err) {
      setQState({
        loading: false,
        questions: [],
        msg: err?.response?.data?.message || "Failed to start exam",
      });
    }
  };

  const submitExam = async () => {
    if (!attempting?._id) return;
    setSubmittingExam(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
      };
      await http.post(`/api/attempts/exam/${attempting._id}/submit`, payload);
      closeAttempt();
      // refresh results tab data in background
      if (active === "results") load("results");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit exam");
    } finally {
      setSubmittingExam(false);
    }
  };

  // (removed older duplicate attempt helpers)

  const openSubmit = (assignment) => {
    setSubmitFor(assignment);
    setSubForm({ submissionUrl: "", note: "" });
  };

  const closeSubmit = () => {
    setSubmitFor(null);
    setSubForm({ submissionUrl: "", note: "" });
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!submitFor?._id) return;
    setSubmitting(true);
    try {
      const { data } = await http.post("/api/submissions", {
        assignmentId: submitFor._id,
        submissionUrl: subForm.submissionUrl,
        note: subForm.note,
      });
      setMySubs((prev) => [data.submission, ...(prev || [])]);
      closeSubmit();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, batchId]);

  useEffect(() => {
    if (!attempting || timeLeft === null) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [attempting, timeLeft]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded border border-slate-800">
        <h2 className="text-2xl font-bold">Student Batch Workspace</h2>
        <p className="text-slate-400 text-sm">{title}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded border border-slate-800 hover:border-slate-700 ${
              active === t.key ? "bg-slate-900" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.loading && <p>Loading...</p>}
      {state.msg && <p className="text-red-400">{state.msg}</p>}

      {!state.loading && !state.msg && (
        <div className="space-y-3">
          {active === "announcements" && <StudentBatchAnnouncements batchId={batchId} />}
          {active === "completion" && <StudentBatchCompletion batchId={batchId} />}

          {active === "lessons" &&
            (state.data.length ? (
              state.data.map((l) => (
                <div key={l._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">
                    {l.order}. {l.title}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">{l.description}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No lessons yet.</p>
            ))}

          {active === "materials" &&
            (state.data.length ? (
              state.data.map((m) => (
                <div key={m._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-slate-400 text-sm">
                    Type: {m.type} {m.lesson?.title ? `• Lesson: ${m.lesson.title}` : ""}
                  </p>
                  <a
                    className="text-indigo-400 hover:underline break-all"
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {m.url}
                  </a>
                  {m.note && <p className="text-slate-400 text-sm mt-1">{m.note}</p>}
                </div>
              ))
            ) : (
              <p className="text-slate-400">No materials yet.</p>
            ))}

          {active === "assignments" &&
            (state.data.length ? (
              state.data.map((a) => {
                const sub = mySubByAssignment.get(String(a._id));
                const canSubmit = a.isPublished && !sub;
                return (
                  <div key={a._id} className="p-4 rounded border border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{a.title}</p>
                        {a.description ? (
                          <p className="text-slate-400 text-sm mt-1 whitespace-pre-wrap">
                            {a.description}
                          </p>
                        ) : null}
                        <p className="text-slate-400 text-sm mt-2">
                          Total: {a.totalMarks ?? 100} • Due:{" "}
                          {a.dueDate ? new Date(a.dueDate).toLocaleString() : "N/A"}
                        </p>

                        {sub ? (
                          <div className="mt-3 text-sm">
                            <p className="text-slate-300">
                              ✅ Submitted:{" "}
                              <a
                                className="underline"
                                href={sub.submissionUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                link
                              </a>{" "}
                              <span className="text-slate-500 text-xs">
                                ({new Date(sub.createdAt).toLocaleString()})
                              </span>
                            </p>

                            {sub.status === "graded" ? (
                              <div className="mt-2 text-slate-300">
                                <span className="font-semibold">Marks:</span>{" "}
                                {sub.marks ?? "-"}
                                {sub.feedback ? (
                                  <>
                                    {" • "}
                                    <span className="font-semibold">Feedback:</span>{" "}
                                    {sub.feedback}
                                  </>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-2 text-slate-500 text-xs">Not graded yet.</p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 text-slate-500 text-xs">
                            {a.isPublished
                              ? "No submission yet."
                              : "This assignment is not published yet."}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          disabled={!canSubmit}
                          onClick={() => openSubmit(a)}
                          className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-50"
                          title={
                            canSubmit
                              ? "Submit your work"
                              : sub
                              ? "Already submitted"
                              : "Assignment not published"
                          }
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400">No assignments yet.</p>
            ))}

          {active === "live" &&
            (state.data.length ? (
              state.data.map((c) => (
                <div key={c._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-slate-400 text-sm">
                    Scheduled: {new Date(c.scheduledAt).toLocaleString()} • {c.durationMinutes} min
                  </p>
                  <a
                    className="text-indigo-400 hover:underline break-all"
                    href={c.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join Link
                  </a>
                  {c.recordingUrl && (
                    <div className="mt-2">
                      <a
                        className="text-green-400 hover:underline break-all"
                        href={c.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Recording Link
                      </a>
                    </div>
                  )}
                  {c.note && <p className="text-slate-400 text-sm mt-1">{c.note}</p>}
                </div>
              ))
            ) : (
              <p className="text-slate-400">No live classes yet.</p>
            ))}

          {active === "attendance" &&
            (state.data.length ? (
              state.data.map((r, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded border border-slate-800 flex justify-between"
                >
                  <p>
                    {new Date(r.date).toLocaleDateString()} —{" "}
                    <span
                      className={r.status === "present" ? "text-green-300" : "text-red-300"}
                    >
                      {r.status}
                    </span>
                  </p>
                  {r.note && <p className="text-slate-400 text-sm">{r.note}</p>}
                </div>
              ))
            ) : (
              <p className="text-slate-400">No attendance records yet.</p>
            ))}

          {active === "exams" &&
            (state.data.length ? (
              state.data.map((e) => (
                <div key={e._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-slate-400 text-sm">
                    Duration: {e.durationMinutes} min • Total: {e.totalMarks}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    {e.startAt
                      ? `Start: ${new Date(e.startAt).toLocaleString()}`
                      : "Start: (anytime)"}{" "}
                    •{" "}
                    {e.endAt ? `End: ${new Date(e.endAt).toLocaleString()}` : "End: (no limit)"}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => startExamFlow(e)}
                      className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm"
                    >
                      Start / Continue
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No exams yet.</p>
            ))}

          {active === "results" &&
            (state.data.length ? (
              state.data.map((r) => (
                <div key={r._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{r.exam?.title || "Exam"}</p>
                  <p className="text-slate-400 text-sm">
                    Score: {r.score} • Correct: {r.correctCount} • Wrong: {r.wrongCount}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No results yet.</p>
            ))}
        </div>
      )}

      {attempting && (
        <div className="border border-slate-800 rounded p-4 bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Exam: {attempting.title}</h3>
              <p className="text-slate-400 text-sm">
                Time left:{" "}
                {timeLeft !== null
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
                  : "—"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Note: Timer is for UX. Backend enforces the real deadline from your start time.
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-200" onClick={closeAttempt}>
              ✕
            </button>
          </div>

          {qState.msg && (
            <div className="mt-3 p-3 rounded border border-red-800 text-red-300 text-sm">
              {qState.msg}
            </div>
          )}

          {qState.loading ? (
            <p className="text-slate-400 mt-3">Loading questions…</p>
          ) : qState.questions.length ? (
            <div className="mt-4 space-y-4">
              {qState.questions.map((q, idx) => (
                <div key={q._id} className="p-3 rounded border border-slate-800">
                  <p className="font-medium">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="mt-3 space-y-2">
                    {(q.options || []).map((opt, oi) => {
                      const checked = answers[q._id] === oi;
                      return (
                        <label
                          key={oi}
                          className={`flex gap-2 items-start p-2 rounded border border-slate-800 cursor-pointer ${
                            checked ? "bg-slate-900" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}`}
                            checked={checked}
                            onChange={() => setAnswers((p) => ({ ...p, [q._id]: oi }))}
                          />
                          <span className="text-sm">
                            <span className="text-slate-400 mr-2">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Marks: {q.marks} • Negative: {q.negativeMarks}
                  </p>
                </div>
              ))}

              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-2 rounded border border-slate-800 text-sm"
                  onClick={closeAttempt}
                  disabled={submittingExam}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-50"
                  onClick={submitExam}
                  disabled={submittingExam}
                >
                  {submittingExam ? "Submitting…" : "Submit Exam"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 mt-3">No questions found for this exam.</p>
          )}
        </div>
      )}

      {submitFor && (
        <div className="border border-slate-800 rounded p-4 bg-slate-950">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Submit Assignment</h3>
            <button className="text-slate-400 hover:text-slate-200" onClick={closeSubmit}>
              ✕
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">{submitFor.title}</p>

          <form onSubmit={submitAssignment} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400">Submission URL *</label>
              <input
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={subForm.submissionUrl}
                onChange={(e) => setSubForm((p) => ({ ...p, submissionUrl: e.target.value }))}
                placeholder="Google Drive / GitHub / Any link"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Note (optional)</label>
              <textarea
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={subForm.note}
                onChange={(e) => setSubForm((p) => ({ ...p, note: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeSubmit}
                className="px-3 py-2 rounded border border-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
