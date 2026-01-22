import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

function Pill({ ok, children }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded border text-xs ${
        ok ? "bg-emerald-900/40 border-emerald-700 text-emerald-200" : "bg-slate-900/40 border-slate-700 text-slate-200"
      }`}
    >
      {children}
    </span>
  );
}

export default function StudentBatchCompletion({ batchId }) {
  const [state, setState] = useState({ loading: true, stats: null, completion: null, msg: "" });

  const load = async () => {
    setState({ loading: true, stats: null, completion: null, msg: "" });
    try {
      const { data } = await http.get(`/api/completions/me?batchId=${batchId}`);
      setState({ loading: false, stats: data.stats || null, completion: data.completion || null, msg: "" });
    } catch (err) {
      setState({
        loading: false,
        stats: null,
        completion: null,
        msg: err?.response?.data?.message || "Failed to load completion status",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const completed = !!state.completion?.isCompleted;
  const cert = state.completion?.certificateSerial || "";

  const summary = useMemo(() => {
    const s = state.stats || {};
    return [
      { label: "Attendance", value: `${s.attendancePct || 0}%`, sub: `${s.attendancePresent || 0}/${s.attendanceTotal || 0} present` },
      { label: "Submissions", value: String(s.submissionsCount || 0), sub: "Assignments submitted" },
      { label: "Exams", value: String(s.attemptsCount || 0), sub: `Best score: ${s.bestExamScore || 0}` },
    ];
  }, [state.stats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">Completion & Certificate</h3>
          <p className="text-slate-400 text-sm">Your progress summary and certificate status.</p>
        </div>
        <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
          Refresh
        </button>
      </div>

      {state.loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : state.msg ? (
        <p className="text-rose-300">{state.msg}</p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-3">
            {summary.map((x) => (
              <div key={x.label} className="rounded border border-slate-800 p-4">
                <p className="text-slate-400 text-sm">{x.label}</p>
                <p className="text-xl font-bold mt-1">{x.value}</p>
                <p className="text-xs text-slate-500 mt-1">{x.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded border border-slate-800 p-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Certificate</h4>
                <Pill ok={completed}>{completed ? "Issued" : "Not issued"}</Pill>
              </div>
              {completed ? (
                <p className="text-sm text-slate-300">
                  Certificate serial: <span className="font-mono">{cert}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Your teacher will issue the certificate after final review.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
