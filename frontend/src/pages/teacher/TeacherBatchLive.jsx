import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

function fmtLocalInput(iso) {
  if (!iso) return "";
  try {
    return String(iso).slice(0, 16);
  } catch {
    return "";
  }
}

function Pill({ ok, a, b }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded border text-xs ${
        ok ? a : b
      }`}
    >
      {ok ? "published" : "draft"}
    </span>
  );
}

function LiveClassForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    scheduledAt: initial?.scheduledAt ? fmtLocalInput(initial.scheduledAt) : "",
    durationMinutes: initial?.durationMinutes ?? 60,
    meetingUrl: initial?.meetingUrl || "",
    recordingUrl: initial?.recordingUrl || "",
    note: initial?.note || "",
    isPublished: initial?.isPublished ?? true,
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: form.title,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          durationMinutes: Number(form.durationMinutes),
          meetingUrl: form.meetingUrl,
          recordingUrl: form.recordingUrl || "",
          note: form.note || "",
          isPublished: !!form.isPublished,
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Title *</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            placeholder="Live Class 01"
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Scheduled At *</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => update("scheduledAt", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            required
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Duration (minutes)</label>
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => update("durationMinutes", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
            />
            Publish
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400">Meeting URL *</label>
          <input
            value={form.meetingUrl}
            onChange={(e) => update("meetingUrl", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            placeholder="https://meet.google.com/...."
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400">Recording URL (optional)</label>
          <input
            value={form.recordingUrl}
            onChange={(e) => update("recordingUrl", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            placeholder="https://drive.google.com/...."
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-400">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded bg-slate-950 border border-slate-800"
            rows={3}
            placeholder="Topics, instructions, etc."
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={submitting}
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded border border-slate-800 hover:border-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TeacherBatchLive({ batchId }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ loading: true, msg: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setState({ loading: true, msg: "" });
    try {
      const { data } = await http.get(`/api/live-classes/batch/${batchId}`);
      setItems(data.liveClasses || []);
      setState({ loading: false, msg: "" });
    } catch (e) {
      setState({ loading: false, msg: e?.response?.data?.message || "Failed to load live classes" });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    return arr;
  }, [items]);

  const onCreate = async (payload) => {
    setSaving(true);
    try {
      await http.post(`/api/live-classes/batch/${batchId}`, payload);
      setCreating(false);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create live class");
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async (id, payload) => {
    setSaving(true);
    try {
      await http.patch(`/api/live-classes/${id}`, payload);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update live class");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this live class?")) return;
    try {
      await http.delete(`/api/live-classes/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete live class");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Live Classes</h3>
          <p className="text-sm text-slate-400">Schedule Zoom/Meet links. Students see only published classes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded border border-slate-800 hover:border-slate-700 text-sm"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-sm"
          >
            + New Live Class
          </button>
        </div>
      </div>

      {state.msg && <div className="border border-slate-800 rounded p-3">{state.msg}</div>}

      {creating && (
        <LiveClassForm
          submitting={saving}
          onSubmit={onCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {editing && (
        <LiveClassForm
          initial={editing}
          submitting={saving}
          onSubmit={(payload) => onUpdate(editing._id, payload)}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="space-y-3">
        {state.loading ? (
          <div className="text-slate-400">Loading...</div>
        ) : sorted.length ? (
          sorted.map((c) => (
            <div key={c._id} className="p-4 rounded border border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{c.title}</p>
                    <Pill
                      ok={!!c.isPublished}
                      a="bg-emerald-900/40 border-emerald-700 text-emerald-200"
                      b="bg-amber-900/40 border-amber-700 text-amber-200"
                    />
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(c.scheduledAt).toLocaleString()} • {c.durationMinutes || 60} min
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    className="px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm"
                    href={c.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Meeting
                  </a>
                  {c.recordingUrl ? (
                    <a
                      className="px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm"
                      href={c.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Recording
                    </a>
                  ) : null}
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(c);
                    }}
                    className="px-3 py-2 rounded border border-slate-800 hover:border-slate-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(c._id)}
                    className="px-3 py-2 rounded border border-rose-800 text-rose-200 hover:border-rose-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {c.note ? <p className="mt-3 text-sm text-slate-300">{c.note}</p> : null}
            </div>
          ))
        ) : (
          <div className="text-slate-400">No live classes yet.</div>
        )}
      </div>
    </div>
  );
}
