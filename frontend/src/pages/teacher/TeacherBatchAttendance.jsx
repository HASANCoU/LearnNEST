import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

function isoDate(d) {
  // YYYY-MM-DD (local)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TeacherBatchAttendance({ batchId }) {
  const [date, setDate] = useState(() => isoDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [students, setStudents] = useState([]); // approved enrollments
  const [existing, setExisting] = useState([]); // attendance records for date
  const [draft, setDraft] = useState({}); // studentId -> {status,note}

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const [enRes, atRes] = await Promise.all([
        http.get(`/api/enrollments?batchId=${batchId}`),
        http.get(`/api/attendance/batch/${batchId}?date=${date}`),
      ]);

      const enrollments = enRes.data.enrollments || [];
      const approved = enrollments.filter((e) => e.status === "approved" && e.student?._id);
      setStudents(approved.map((e) => e.student));

      const records = atRes.data.records || [];
      setExisting(records);

      // Build draft from existing
      const next = {};
      for (const r of records) {
        const sid = r.student?._id || r.student; // populated or id
        if (!sid) continue;
        next[sid] = { status: r.status, note: r.note || "" };
      }
      // Ensure every approved student has something (default absent)
      for (const s of approved.map((e) => e.student)) {
        if (!next[s._id]) next[s._id] = { status: "absent", note: "" };
      }
      setDraft(next);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setMsg(e?.response?.data?.message || "Failed to load attendance");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, date]);

  const list = useMemo(() => {
    const arr = [...students];
    arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return arr;
  }, [students]);

  const setOne = (studentId, patch) => {
    setDraft((s) => ({
      ...s,
      [studentId]: { ...(s[studentId] || { status: "absent", note: "" }), ...patch },
    }));
  };

  const onSave = async () => {
    const records = Object.entries(draft).map(([studentId, v]) => ({
      studentId,
      status: v.status,
      note: v.note || "",
    }));

    try {
      await http.post(`/api/attendance/batch/${batchId}/mark`, { date, records });
      await load();
      alert("Attendance saved");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save attendance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-sm text-slate-400">Mark attendance for approved students, date-wise.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-slate-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            />
          </div>

          <button
            onClick={load}
            className="px-3 py-2 rounded border border-slate-800 hover:border-slate-700 text-sm h-[42px]"
          >
            Refresh
          </button>

          <button
            onClick={onSave}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm h-[42px]"
            disabled={loading || !list.length}
          >
            Save
          </button>
        </div>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : !list.length ? (
        <div className="text-slate-400">No approved students found for this batch.</div>
      ) : (
        <div className="overflow-auto rounded border border-slate-800">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-950">
              <tr className="text-left">
                <th className="p-3 border-b border-slate-800">Student</th>
                <th className="p-3 border-b border-slate-800">Email</th>
                <th className="p-3 border-b border-slate-800">Status</th>
                <th className="p-3 border-b border-slate-800">Note</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const v = draft[s._id] || { status: "absent", note: "" };
                return (
                  <tr key={s._id} className="border-b border-slate-800/60">
                    <td className="p-3">{s.name || "—"}</td>
                    <td className="p-3 text-slate-400">{s.email || "—"}</td>
                    <td className="p-3">
                      <select
                        value={v.status}
                        onChange={(e) => setOne(s._id, { status: e.target.value })}
                        className="px-3 py-2 rounded bg-slate-950 border border-slate-800"
                      >
                        <option value="present">present</option>
                        <option value="absent">absent</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        value={v.note || ""}
                        onChange={(e) => setOne(s._id, { note: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800"
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-slate-500">
        Tip: If you don’t mark a student explicitly, they default to <b>absent</b> for the selected date.
      </div>
    </div>
  );
}
