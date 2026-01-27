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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900/50 border border-slate-800 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Explore Courses</h1>
          <p className="text-slate-300 max-w-2xl">
            Discover a wide range of courses designed to help you master new skills
            and advance your career. Join thousands of learners today.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm sticky top-4 z-10 shadow-xl shadow-black/20">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 transition-all outline-none"
              placeholder="Search courses..."
              value={state.q}
              onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && load(state.q)}
            />
            <svg
              className="absolute left-3 top-3 h-5 w-5 text-slate-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex gap-2 text-sm overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <FilterSelect
              value={state.category}
              onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
              options={categories.map(c => ({ value: c, label: c === "all" ? "All Categories" : c }))}
            />
            <FilterSelect
              value={state.level}
              onChange={(e) => setState((s) => ({ ...s, level: e.target.value }))}
              options={levels.map(l => ({ value: l, label: l === "all" ? "All Levels" : l }))}
            />
            <FilterSelect
              value={state.sort}
              onChange={(e) => setState((s) => ({ ...s, sort: e.target.value }))}
              options={[
                { value: "newest", label: "Newest" },
                { value: "title", label: "Title (A-Z)" }
              ]}
            />
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {state.msg && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {state.msg}
        </div>
      )}

      {/* Grid */}
      {state.loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-900 animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length > 0 ? (
            filtered.map((c) => <CourseCard key={c._id} course={c} />)
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              <svg
                className="mx-auto h-12 w-12 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No courses found matching your criteria.</p>
              <button
                onClick={resetFilters}
                className="mt-4 text-indigo-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
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
