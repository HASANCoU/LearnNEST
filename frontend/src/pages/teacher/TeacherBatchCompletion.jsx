import { useEffect, useState } from "react";
import { http } from "../../api/http";

function YesNo({ v }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded border text-xs ${
        v ? "bg-emerald-900/40 border-emerald-700 text-emerald-200" : "bg-slate-900/40 border-slate-700 text-slate-200"
      }`}
    >
      {v ? "Yes" : "No"}
    </span>
  );
}

export default function TeacherBatchCompletion({ batchId }) {
  const [state, setState] = useState({ loading: true, items: [], msg: "" });
  const [savingId, setSavingId] = useState("");

  const load = async () => {
    setState({ loading: true, items: [], msg: "" });
    try {
      const { data } = await http.get(`/api/completions/batch/${batchId}`);
      setState({ loading: false, items: data.items || [], msg: "" });
    } catch (err) {
      setState({
        loading: false,
        items: [],
        msg: err?.response?.data?.message || "Failed to load completion data",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const mark = async (studentId, isCompleted) => {
    setSavingId(studentId);
    try {
      await http.post(`/api/completions/batch/${batchId}/mark`, { studentId, isCompleted });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update completion");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">Final Completion</h3>
          <p className="text-slate-400 text-sm">
            Review student progress stats and mark them as completed to issue a certificate serial.
          </p>
        </div>
        <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
          Refresh
        </button>
      </div>

      {state.loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : state.msg ? (
        <p className="text-rose-300">{state.msg}</p>
      ) : state.items.length === 0 ? (
        <p className="text-slate-400">No approved students in this batch.</p>
      ) : (
        <div className="overflow-auto rounded border border-slate-800">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="text-left p-3 border-b border-slate-800">Student</th>
                <th className="text-left p-3 border-b border-slate-800">Attendance</th>
                <th className="text-left p-3 border-b border-slate-800">Submissions</th>
                <th className="text-left p-3 border-b border-slate-800">Exams</th>
                <th className="text-left p-3 border-b border-slate-800">Completed</th>
                <th className="text-left p-3 border-b border-slate-800">Certificate</th>
                <th className="text-left p-3 border-b border-slate-800">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((row) => {
                const s = row.student;
                const stats = row.stats || {};
                const comp = row.completion;
                const completed = !!comp?.isCompleted;
                return (
                  <tr key={s._id} className="border-b border-slate-800">
                    <td className="p-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </td>
                    <td className="p-3">
                      <div>{stats.attendancePct}%</div>
                      <div className="text-xs text-slate-400">
                        {stats.attendancePresent}/{stats.attendanceTotal} present
                      </div>
                    </td>
                    <td className="p-3">{stats.submissionsCount}</td>
                    <td className="p-3">
                      <div>Attempts: {stats.attemptsCount}</div>
                      <div className="text-xs text-slate-400">Best: {stats.bestExamScore}</div>
                    </td>
                    <td className="p-3">
                      <YesNo v={completed} />
                    </td>
                    <td className="p-3">
                      {completed ? (
                        <span className="text-xs px-2 py-1 rounded border border-slate-700">
                          {comp.certificateSerial || "—"}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {completed ? (
                        <button
                          className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                          onClick={() => mark(s._id, false)}
                          disabled={savingId === s._id}
                        >
                          Unmark
                        </button>
                      ) : (
                        <button
                          className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                          onClick={() => mark(s._id, true)}
                          disabled={savingId === s._id}
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
