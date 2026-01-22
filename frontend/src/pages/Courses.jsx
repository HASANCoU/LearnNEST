import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";

export default function Courses() {
  const [state, setState] = useState({
    courses: [],
    q: "",
    msg: "",
    loading: false,
    category: "all",
    level: "all",
    sort: "newest", // newest | title
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
      if (!alive) return;
      await load("");
    })();

    return () => {
      alive = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  const categories = useMemo(() => {
    const set = new Set((state.courses || []).map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [state.courses]);

  const levels = useMemo(() => {
    const set = new Set((state.courses || []).map((c) => c.level).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [state.courses]);

  const filtered = useMemo(() => {
    let items = [...(state.courses || [])];

    if (state.category !== "all") {
      items = items.filter((c) => c.category === state.category);
    }
    if (state.level !== "all") {
      items = items.filter((c) => c.level === state.level);
    }

    if (state.sort === "title") {
      items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    } else {
      // newest first (best-effort)
      items.sort((a, b) => {
        const ad = new Date(a.createdAt || 0).getTime();
        const bd = new Date(b.createdAt || 0).getTime();
        return bd - ad;
      });
    }

    return items;
  }, [state.courses, state.category, state.level, state.sort]);

  const resetFilters = () => {
    setState((s) => ({ ...s, category: "all", level: "all", sort: "newest" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Courses</h2>
          <p className="text-sm text-slate-400">
            Browse published courses and enroll in available batches.
          </p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-12">
        <div className="md:col-span-6 flex gap-2">
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

        <div className="md:col-span-6 flex gap-2 flex-wrap md:justify-end">
          <select
            className="p-2 rounded bg-slate-900 border border-slate-800"
            value={state.category}
            onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <select
            className="p-2 rounded bg-slate-900 border border-slate-800"
            value={state.level}
            onChange={(e) => setState((s) => ({ ...s, level: e.target.value }))}
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {l === "all" ? "All levels" : l}
              </option>
            ))}
          </select>

          <select
            className="p-2 rounded bg-slate-900 border border-slate-800"
            value={state.sort}
            onChange={(e) => setState((s) => ({ ...s, sort: e.target.value }))}
          >
            <option value="newest">Newest</option>
            <option value="title">Title A→Z</option>
          </select>

          <button
            className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800"
            onClick={resetFilters}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      {state.msg && <p className="text-red-400">{state.msg}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <Link
            key={c._id}
            to={`/courses/${c.slug}`}
            className="p-4 rounded border border-slate-800 hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-lg">{c.title}</h3>
              {c.published ? (
                <span className="text-xs px-2 py-1 rounded border border-emerald-700 text-emerald-300">
                  Published
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300">
                  Draft
                </span>
              )}
            </div>

            <p className="text-slate-300 text-sm mt-1">
              {c.category} • {c.level}
            </p>
            <p className="text-slate-400 text-sm mt-2 line-clamp-2">
              {c.description}
            </p>
          </Link>
        ))}
      </div>

      {!state.loading && filtered.length === 0 && (
        <p className="text-slate-400">No courses found.</p>
      )}
    </div>
  );
}
