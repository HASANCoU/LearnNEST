import { useEffect, useMemo, useState } from "react";
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
      if (!alive) return;
      await load("");
    })();
    return () => {
      alive = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);



  const filtered = useMemo(() => {
    let items = [...(state.courses || [])];
    // Sort by newest (default)
    items.sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
    return items;
  }, [state.courses]);

  const resetSearch = () => {
    setState((s) => ({ ...s, q: "" }));
    load("");
  };

  return (

    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3 items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-black/20">
        <div className="flex-1 relative">
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all outline-none text-sm"
            placeholder="Search courses..."
            value={state.q}
            onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && load(state.q)}
          />
          <svg className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors flex items-center gap-2"
          onClick={() => load(state.q)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      {state.msg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.msg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {state.loading ? "Loading..." : `${filtered.length} Courses Found`}
          </h1>
        </div>

        {/* Grid */}
        {state.loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-900 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  onClick={resetSearch}
                  className="mt-6 px-6 py-2.5 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all font-semibold"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }) {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
  const thumbnailSrc = course?.thumbnailUrl
    ? course.thumbnailUrl.startsWith("http")
      ? course.thumbnailUrl
      : `${apiBase}${course.thumbnailUrl}`
    : "";

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
    >
      {/* Thumbnail Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {thumbnailSrc ? (
          <>
            <img
              src={thumbnailSrc}
              alt={`${course.title || "Course"} thumbnail`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-60"></div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Published Badge */}
        {course.published && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Live
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
          {course.title}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
          {course.description || "Explore this course to learn something new and exciting!"}
        </p>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Explore Course
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
            <svg
              className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
