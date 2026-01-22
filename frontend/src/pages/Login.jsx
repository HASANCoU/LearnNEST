import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { setToken, setUser } from "../auth/auth";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await http.post("/api/auth/login", form);
      setToken(data.token);
      setUser(data.user);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto border border-slate-800 rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {msg && <p className="mb-3 text-red-400">{msg}</p>}
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500">
          Login
        </button>
      </form>
    </div>
  );
}
