import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";
import { getUser } from "../auth/auth";

function Pill({ children }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded border border-slate-700 text-xs text-slate-200">
      {children}
    </span>
  );
}

export default function Notifications() {
  const user = getUser();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [state, setState] = useState({ loading: true, items: [], msg: "", unreadCount: 0 });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, msg: "" }));
    try {
      const { data } = await http.get(`/api/notifications/me?unreadOnly=${unreadOnly ? 1 : 0}`);
      setState({
        loading: false,
        items: data.notifications || [],
        msg: "",
        unreadCount: data.unreadCount || 0,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        msg: err?.response?.data?.message || "Failed to load notifications",
      }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  const hasUnread = useMemo(() => (state.items || []).some((n) => !n.isRead), [state.items]);

  const markAll = async () => {
    await http.patch("/api/notifications/read-all");
    load();
  };

  const markOne = async (id) => {
    await http.patch(`/api/notifications/${id}/read`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Notifications</h2>
          <p className="text-slate-400 text-sm">
            {user?.name} • Unread: <span className="font-semibold">{state.unreadCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
          <button
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={load}
          >
            Refresh
          </button>
          <button
            className="px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-sm disabled:opacity-50"
            onClick={markAll}
            disabled={!hasUnread}
          >
            Mark all read
          </button>
        </div>
      </div>

      {state.loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : state.msg ? (
        <p className="text-rose-300">{state.msg}</p>
      ) : state.items.length === 0 ? (
        <p className="text-slate-400">No notifications.</p>
      ) : (
        <div className="space-y-3">
          {state.items.map((n) => (
            <div
              key={n._id}
              className={`rounded border border-slate-800 p-4 ${n.isRead ? "opacity-80" : "bg-slate-900/40"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{n.title}</h3>
                    <Pill>{n.type}</Pill>
                    {!n.isRead && <Pill>unread</Pill>}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{n.message}</p>
                  {n.link ? (
                    <Link className="text-sm underline text-slate-200" to={n.link}>
                      Open
                    </Link>
                  ) : null}
                </div>

                {!n.isRead ? (
                  <button
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm"
                    onClick={() => markOne(n._id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
