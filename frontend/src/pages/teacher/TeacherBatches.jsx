import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../../api/http";

export default function TeacherBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await http.get("/api/batches/me");
      setBatches(data.batches || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Batches</h2>
          <p className="text-slate-400 text-sm">
            Manage enrollments for your batches.
          </p>
        </div>
        <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
          Refresh
        </button>
      </div>

      {msg && <div className="border border-rose-700 bg-rose-900/20 rounded p-3 text-rose-200">{msg}</div>}

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-3">Batch</th>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Course</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>Loading...</td></tr>
            ) : batches.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>No batches yet</td></tr>
            ) : (
              batches.map((b) => (
                <tr key={b._id} className="border-t border-slate-800">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3">{b.code}</td>
                  <td className="p-3">{b.course?.title || "-"}</td>
                  <td className="p-3">{b.isActive ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <Link className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 inline-block" to={`/teacher/batches/${b._id}`}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
