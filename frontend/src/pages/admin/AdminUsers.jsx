import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await http.get("/api/admin/users");
      setUsers(data.users || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const okQ =
        !qq ||
        (u.name || "").toLowerCase().includes(qq) ||
        (u.email || "").toLowerCase().includes(qq);
      const okRole = !role || u.role === role;
      return okQ && okRole;
    });
  }, [users, q, role]);

  const setUserRole = async (id, nextRole) => {
    setMsg("");
    try {
      await http.patch(`/api/admin/users/${id}/role`, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: nextRole } : u)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update role");
    }
  };

  const setStatus = async (id, isActive) => {
    setMsg("");
    try {
      await http.patch(`/api/admin/users/${id}/status`, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive } : u)));
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-slate-400 text-sm">Manage roles and active status.</p>
        </div>
        <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={load}>
          Refresh
        </button>
      </div>

      {msg && <div className="border border-slate-800 rounded p-3">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-3">
        <input
          className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Search name/email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="student">student</option>
          <option value="teacher">teacher</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={5}>No users</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u._id} className="border-t border-slate-800">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.isActive === false ? "No" : "Yes"}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <select
                      className="p-2 rounded bg-slate-900 border border-slate-800"
                      value={u.role}
                      onChange={(e) => setUserRole(u._id, e.target.value)}
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
                      onClick={() => setStatus(u._id, !(u.isActive === false))}
                    >
                      {u.isActive === false ? "Activate" : "Deactivate"}
                    </button>
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
