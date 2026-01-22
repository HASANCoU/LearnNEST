import { useEffect, useState } from "react";
import { http } from "../../api/http";

function PublishedPill({ isPublished }) {
  const cls = isPublished
    ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
    : "bg-amber-900/40 border-amber-700 text-amber-200";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs ${cls}`}>
      {isPublished ? "published" : "draft"}
    </span>
  );
}

export default function TeacherBatchAnnouncements({ batchId }) {
  const [state, setState] = useState({ loading: true, items: [], msg: "" });
  const [modal, setModal] = useState(null); // {mode:'create'|'edit', item}
  const [saving, setSaving] = useState(false);

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

  const openCreate = () =>
    setModal({ mode: "create", item: { title: "", body: "", isPinned: false, isPublished: true } });

  const openEdit = (item) =>
    setModal({
      mode: "edit",
      item: {
        _id: item._id,
        title: item.title || "",
        body: item.body || "",
        isPinned: !!item.isPinned,
        isPublished: !!item.isPublished,
      },
    });

  const save = async () => {
    if (!modal?.item?.title || !modal?.item?.body) return;
    setSaving(true);
    try {
      if (modal.mode === "create") {
        await http.post(`/api/announcements/batch/${batchId}`, modal.item);
      } else {
        await http.patch(`/api/announcements/${modal.item._id}`, modal.item);
      }
      setModal(null);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await http.delete(`/api/announcements/${id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">Announcements</h3>
          <p className="text-slate-400 text-sm">
            Post updates for students in this batch. Publishing sends notifications to approved students.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
            Refresh
          </button>
          <button className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600" onClick={openCreate}>
            + New
          </button>
        </div>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{a.title}</h4>
                    <PublishedPill isPublished={a.isPublished} />
                    {a.isPinned ? (
                      <span className="text-xs px-2 py-0.5 rounded border border-slate-700">pinned</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    by {a.createdBy?.name || "Unknown"} • {new Date(a.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{a.body}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm" onClick={() => openEdit(a)}>
                    Edit
                  </button>
                  <button className="px-3 py-2 rounded bg-rose-700 hover:bg-rose-600 text-sm" onClick={() => del(a._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded border border-slate-700 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">{modal.mode === "create" ? "New Announcement" : "Edit Announcement"}</h4>
              <button className="px-2 py-1 rounded bg-slate-800" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Title</label>
              <input
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800"
                value={modal.item.title}
                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, title: e.target.value } }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Body</label>
              <textarea
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 min-h-[140px]"
                value={modal.item.body}
                onChange={(e) => setModal((m) => ({ ...m, item: { ...m.item, body: e.target.value } }))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={modal.item.isPublished}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, item: { ...m.item, isPublished: e.target.checked } }))
                  }
                />
                Published
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={modal.item.isPinned}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, item: { ...m.item, isPinned: e.target.checked } }))
                  }
                />
                Pin to top
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                onClick={save}
                disabled={saving || !modal.item.title || !modal.item.body}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
