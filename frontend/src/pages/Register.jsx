import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { setToken, setUser } from "../auth/auth";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await http.post("/api/auth/register", form);
      setToken(data.token);
      setUser(data.user);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="max-w-md mx-auto border border-slate-800 rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {msg && <p className="mb-3 text-red-400">{msg}</p>}
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" className="w-full p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500">
          Create Account
        </button>
      </form>
    </div>
  );
}
