import { useEffect, useState } from "react";
import { http } from "../../api/http";

export default function StudentBatchAnnouncements({ batchId }) {
  const [state, setState] = useState({ loading: true, items: [], msg: "" });

  const load = async () => {
    setState({ loading: true, items: [], msg: "" });
    try {
      const { data } = await http.get(`/api/announcements/batch/${batchId}`);
      setState({ loading: false, items: data.announcements || [], msg: "" });
    } catch (err) {
      setState({
        loading: false,
        items: [],
        msg: err?.response?.data?.message || "Failed to load announcements",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Announcements</h3>
          <p className="text-slate-400 text-sm">Updates from your teacher.</p>
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
        <p className="text-slate-400">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {state.items.map((a) => (
            <div key={a._id} className="rounded border border-slate-800 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold">{a.title}</h4>
                {a.isPinned ? (
                  <span className="text-xs px-2 py-0.5 rounded border border-slate-700">pinned</span>
                ) : null}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(a.createdAt).toLocaleString()} • {a.createdBy?.name || "Teacher"}
              </p>
              <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
