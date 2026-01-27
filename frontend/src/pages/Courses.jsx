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
      items.sort((a, b) => {
        const ad = new Date(a.createdAt || 0).getTime();
        const bd = new Date(b.createdAt || 0).getTime();
        return bd - ad;
      });
    }

    return items;
  }, [state.courses, state.category, state.level, state.sort]);

  const resetFilters = () => {
    setState((s) => ({ ...s, category: "all", level: "all", sort: "newest", q: "" }));
    load("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 lg:sticky lg:top-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>

          <div className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Search</label>
              <div className="relative">
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all outline-none text-sm"
                  placeholder="Course name..."
                  value={state.q}
                  onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && load(state.q)}
                />
                <svg
                  className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <FilterSelect
                value={state.category}
                onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
                options={categories.map(c => ({ value: c, label: c === "all" ? "All Categories" : c }))}
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Skill Level</label>
              <FilterSelect
                value={state.level}
                onChange={(e) => setState((s) => ({ ...s, level: e.target.value }))}
                options={levels.map(l => ({ value: l, label: l === "all" ? "All Levels" : l }))}
              />
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sort By</label>
              <FilterSelect
                value={state.sort}
                onChange={(e) => setState((s) => ({ ...s, sort: e.target.value }))}
                options={[
                  { value: "newest", label: "Newest Arrivals" },
                  { value: "title", label: "Alphabetical (A-Z)" }
                ]}
              />
            </div>

            <button
              onClick={resetFilters}
              className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {state.msg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.msg}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {state.loading ? "Loading..." : `${filtered.length} Courses Found`}
          </h1>
        </div>

        {/* Grid */}
        {state.loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-900 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((c) => <CourseCard key={c._id} course={c} />)
            ) : (
              <div className="col-span-full py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-300">No matches found</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  We couldn't find any courses matching your current filters. Try adjusting your search term or category.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative group">
      <select
        className="appearance-none w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 inline-block cursor-pointer transition-all"
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 group-hover:text-slate-300 transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
    >
      <div className="h-40 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 relative overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="absolute bottom-4 left-4">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 text-white shadow-sm">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {course.level}
          </span>
          {course.published && (
            <span className="flex items-center text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              New
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
          {course.title}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
          {course.description || "No description provided for this course."}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
          <span className="text-slate-300 font-medium">View Details</span>
          <svg
            className="w-5 h-5 text-indigo-400 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
