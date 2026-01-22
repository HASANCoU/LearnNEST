import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../../api/http";

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

export default function AdminBatchManage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      // 1) Get batch info (admin gets all via /api/batches/me)
      const bRes = await http.get("/api/batches/me");
      const all = bRes.data.batches || [];
      const found = all.find((x) => x._id === batchId);
      setBatch(found || null);

      // 2) Get enrollments for this batch
      const eRes = await http.get(`/api/enrollments?batchId=${batchId}`);
      setEnrollments(eRes.data.enrollments || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load batch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [batchId]);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const approved = enrollments.filter((x) => x.status === "approved").length;
    const pending = enrollments.filter((x) => x.status === "pending").length;
    const rejected = enrollments.filter((x) => x.status === "rejected").length;

    const seatLimit = Number(batch?.seatLimit || 0);
    const unlimited = seatLimit === 0;
    const seatsUsed = approved;
    const seatsLeft = unlimited ? null : Math.max(seatLimit - seatsUsed, 0);

    return { total, approved, pending, rejected, unlimited, seatLimit, seatsUsed, seatsLeft };
  }, [enrollments, batch]);

  const setStatus = async (id, status) => {
    setMsg("");
    try {
      await http.patch(`/api/enrollments/${id}/status`, { status });
      setEnrollments((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update status");
    }
  };

  const toggleActive = async () => {
    if (!batch) return;
    setToggling(true);
    setMsg("");
    try {
      const next = !batch.isActive;
      const { data } = await http.patch(`/api/batches/${batch._id}`, { isActive: next });
      // backend returns {message, batch} (not populated) - keep local simple
      setBatch((prev) => (prev ? { ...prev, isActive: data.batch?.isActive ?? next } : prev));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update batch active status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Batch Management</h2>
          <p className="text-slate-400 text-sm">Batch ID: {batchId}</p>
          {batch && (
            <p className="text-slate-300 text-sm mt-1">
              <span className="font-semibold">{batch.name}</span>{" "}
              <span className="text-slate-400">({batch.code})</span>
              {" • "}
              <span className="text-slate-400">{batch.course?.title || "Course"}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
            Refresh
          </button>
          <Link className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" to="/admin/batches">
            Back
          </Link>
        </div>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      {loading ? (
        <div className="border border-slate-800 rounded p-4 text-slate-400">Loading...</div>
      ) : !batch ? (
        <div className="border border-slate-800 rounded p-4 text-slate-400">
          Batch not found. Try Refresh or go back.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid md:grid-cols-4 gap-3">
            <div className="border border-slate-800 rounded p-4">
              <p className="text-slate-400 text-xs">Total requests</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="border border-slate-800 rounded p-4">
              <p className="text-slate-400 text-xs">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
            <div className="border border-slate-800 rounded p-4">
              <p className="text-slate-400 text-xs">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="border border-slate-800 rounded p-4">
              <p className="text-slate-400 text-xs">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>

          {/* Seat + Active */}
          <div className="border border-slate-800 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-sm">
              <p>
                <span className="text-slate-400">Seats: </span>
                {stats.unlimited ? (
                  <span>Unlimited</span>
                ) : (
                  <span>
                    {stats.seatsUsed}/{stats.seatLimit}{" "}
                    <span className="text-slate-400">
                      (left: {stats.seatsLeft})
                    </span>
                  </span>
                )}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Note: seat usage is counted from approved enrollments.
              </p>
            </div>

            <button
              disabled={toggling}
              onClick={toggleActive}
              className={`px-3 py-2 rounded border border-slate-800 hover:border-slate-700 ${
                batch.isActive ? "bg-emerald-900/20" : "bg-rose-900/20"
              } disabled:opacity-60`}
            >
              {batch.isActive ? "Deactivate Batch" : "Activate Batch"}
            </button>
          </div>

          {/* Enrollments */}
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
                {enrollments.length === 0 ? (
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
                          onClick={() => setStatus(en._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="px-3 py-1.5 rounded bg-rose-700/40 border border-rose-700 hover:bg-rose-700/60"
                          onClick={() => setStatus(en._id, "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="px-3 py-1.5 rounded bg-amber-700/40 border border-amber-700 hover:bg-amber-700/60"
                          onClick={() => setStatus(en._id, "pending")}
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
        </>
      )}
    </div>
  );
}
