import { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";

export default function Courses() {
  const [state, setState] = useState({
    courses: [],
    q: "",
    msg: "",
    loading: false,
  });

  const load = async (query = "") => {
    setState((s) => ({ ...s, msg: "", loading: true }));
    try {
      const { data } = await http.get(
        `/api/courses${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      setState((s) => ({
        ...s,
        courses: data.courses || [],
        loading: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        msg: err?.response?.data?.message || "Failed to load courses",
        loading: false,
      }));
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      // only run if still mounted
      if (!alive) return;
      await load("");
    })();

    return () => {
      alive = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Courses</h2>

      <div className="flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-slate-900 border border-slate-800"
          placeholder="Search by title/category..."
          value={state.q}
          onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
        />
        <button
          className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
          onClick={() => load(state.q)}
          disabled={state.loading}
        >
          {state.loading ? "Loading..." : "Search"}
        </button>
      </div>

      {state.msg && <p className="text-red-400">{state.msg}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {state.courses.map((c) => (
          <Link
            key={c._id}
            to={`/courses/${c.slug}`}
            className="p-4 rounded border border-slate-800 hover:border-slate-700"
          >
            <h3 className="font-bold text-lg">{c.title}</h3>
            <p className="text-slate-300 text-sm mt-1">
              {c.category} • {c.level}
            </p>
            <p className="text-slate-400 text-sm mt-2 line-clamp-2">
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
