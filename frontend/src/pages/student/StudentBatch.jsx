import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../../api/http";

const tabs = [
  { key: "lessons", label: "Lessons" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "live", label: "Live Classes" },
  { key: "attendance", label: "Attendance" },
  { key: "exams", label: "Exams" },
  { key: "results", label: "Results" },
];

export default function StudentBatch() {
  const { batchId } = useParams();
  const [active, setActive] = useState("lessons");
  const [state, setState] = useState({ loading: true, data: [], msg: "" });

  const title = useMemo(() => `Batch: ${batchId}`, [batchId]);

  const load = async (tab) => {
    setState({ loading: true, data: [], msg: "" });
    try {
      if (tab === "lessons") {
        const { data } = await http.get(`/api/lessons/batch/${batchId}`);
        return setState({ loading: false, data: data.lessons || [], msg: "" });
      }
      if (tab === "materials") {
        const { data } = await http.get(`/api/materials/batch/${batchId}`);
        return setState({ loading: false, data: data.materials || [], msg: "" });
      }
      if (tab === "assignments") {
        const { data } = await http.get(`/api/assignments/batch/${batchId}`);
        return setState({ loading: false, data: data.assignments || [], msg: "" });
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

  useEffect(() => {
    load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, batchId]);

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
            onClick={() => setActive(t.key)}
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
              state.data.map((a) => (
                <div key={a._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{a.description}</p>
                  <p className="text-slate-400 text-sm">
                    Total: {a.totalMarks} • Due: {a.dueDate ? new Date(a.dueDate).toLocaleString() : "N/A"}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Submission UI will be added next (student submit).
                  </p>
                </div>
              ))
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
                  <a className="text-indigo-400 hover:underline break-all" href={c.meetingUrl} target="_blank" rel="noreferrer">
                    Join Link
                  </a>
                  {c.recordingUrl && (
                    <div className="mt-2">
                      <a className="text-green-400 hover:underline break-all" href={c.recordingUrl} target="_blank" rel="noreferrer">
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
                <div key={idx} className="p-4 rounded border border-slate-800 flex justify-between">
                  <p>
                    {new Date(r.date).toLocaleDateString()} —{" "}
                    <span className={r.status === "present" ? "text-green-300" : "text-red-300"}>
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
                    Exam UI (start/submit) will be added next.
                  </p>
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
    </div>
  );
}
