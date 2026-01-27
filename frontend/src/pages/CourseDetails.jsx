import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../api/http";
import { getUser } from "../auth/auth";

export default function CourseDetails() {
  const { slug } = useParams();
  const user = getUser();

  const [state, setState] = useState({
    course: null,
    batches: [],
    enrollments: [], // my enrollments (if logged in)
    msg: "",
    loading: true,
    enrollingBatchId: null,
  });

  const load = async (currentSlug) => {
    setState((s) => ({ ...s, msg: "", loading: true }));

    try {
      const cRes = await http.get(`/api/courses/slug/${currentSlug}`);
      const course = cRes.data.course;

      const bRes = await http.get(`/api/batches?courseId=${course?._id}`);

      let enrollments = [];
      if (user) {
        try {
          const eRes = await http.get("/api/enrollments/me");
          enrollments = eRes.data.enrollments || [];
        } catch {
          // ignore silently
        }
      }

      setState((s) => ({
        ...s,
        course,
        batches: bRes.data.batches || [],
        enrollments,
        loading: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        msg: err?.response?.data?.message || "Failed to load",
        loading: false,
      }));
    }
  };

  const myEnrollmentByBatchId = useMemo(() => {
    const map = new Map();
    for (const e of state.enrollments || []) {
      if (e?.batch?._id) map.set(e.batch._id, e);
    }
    return map;
  }, [state.enrollments]);

  const enroll = async (batchId) => {
    setState((s) => ({ ...s, msg: "" }));

    if (!user) {
      return setState((s) => ({
        ...s,
        msg: "Please login to enroll",
      }));
    }

    if (myEnrollmentByBatchId.get(batchId)) {
      return setState((s) => ({
        ...s,
        msg: "You already have an enrollment request for this batch.",
      }));
    }

    try {
      setState((s) => ({ ...s, enrollingBatchId: batchId }));
      await http.post("/api/enrollments", { batchId });

      const eRes = await http.get("/api/enrollments/me");
      setState((s) => ({
        ...s,
        enrollments: eRes.data.enrollments || [],
        enrollingBatchId: null,
        msg: "Enrollment requested ✅ (wait for approval)",
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        enrollingBatchId: null,
        msg: err?.response?.data?.message || "Enrollment failed",
      }));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load(slug);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (state.loading && !state.course) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!state.course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-slate-700">Course Not Found</h2>
        <p className="text-slate-500 mt-2">{state.msg || "The course you are looking for does not exist."}</p>
        <Link to="/courses" className="mt-6 inline-block px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500">
          Browse Courses
        </Link>
      </div>
    );
  }

  const { course } = state;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const thumbnailSrc = course?.thumbnailUrl
    ? course.thumbnailUrl.startsWith("http")
      ? course.thumbnailUrl
      : `${apiBase}${course.thumbnailUrl}`
    : "https://via.placeholder.com/1200x600?text=No+Preview";

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>
        <div className="absolute inset-0 z-0">
          <img src={thumbnailSrc} alt={course.title} className="w-full h-full object-cover opacity-30" />
        </div>

        <div className="relative z-20 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              {course.published && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  New Course
                </span>
              )}
              {/* Categories/Levels are hidden per user request, but we can show 'Language' if relevant, or just keep it clean */}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 text-slate-300 text-sm md:text-base">
              {course.teacher && (
                <div className="flex items-center gap-2 bg-slate-800/50 pr-4 rounded-full border border-slate-700/50 backdrop-blur-sm">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {course.teacher.name?.[0] || "T"}
                  </div>
                  <span>{course.teacher.name}</span>
                </div>
              )}
              {/* Optional: Add duration or other stats here if available */}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-300">
              {course.price > 0 ? `৳${course.price.toLocaleString()}` : "Free"}
            </div>
            <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Course Price
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Description */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-1 rounded-full bg-indigo-500"></span>
              About This Course
            </h3>
            <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed">
              <p>{course.description}</p>
            </div>
          </section>
        </div>

        {/* Right Column: Enrollment Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-indigo-500/5">
            <h3 className="text-xl font-bold text-white mb-6">Available Batches</h3>

            {state.batches.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                <p className="text-slate-500">No batches currently open for enrollment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.batches.map((b) => {
                  const myE = myEnrollmentByBatchId.get(b._id);
                  const status = myE?.status;
                  const isFull = b.seatLimit > 0 && false; // We'd need seat count from API to really know, assuming open for now unless blocked by backend

                  return (
                    <div key={b._id} className="group relative bg-slate-950 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-white text-lg">{b.name}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-1">{b.code}</p>
                        </div>
                        {status === "approved" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Enrolled</span>
                        ) : status === "pending" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                        ) : null}
                      </div>

                      <div className="space-y-2 mb-4">
                        {b.startDate && (
                          <div className="flex items-center text-xs text-slate-400">
                            <span className="w-4 h-4 mr-2 text-slate-600">📅</span>
                            Starts: {new Date(b.startDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-slate-400">
                          <span className="w-4 h-4 mr-2 text-slate-600">👨‍🏫</span>
                          Teacher: {b.teacher?.name || "Assigned Teacher"}
                        </div>
                      </div>

                      {status === "approved" ? (
                        <Link
                          to={`/student/batch/${b._id}`}
                          className="block w-full text-center py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          Access Course
                        </Link>
                      ) : (
                        <button
                          onClick={() => enroll(b._id)}
                          disabled={!!myE || state.enrollingBatchId === b._id}
                          className={`w-full py-2.5 rounded-lg font-semibold transition-all shadow-lg ${myE
                              ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40"
                            }`}
                        >
                          {state.enrollingBatchId === b._id ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Processing...
                            </span>
                          ) : myE ? (
                            status === "rejected" ? "Enrollment Rejected" : "Request Pending"
                          ) : (
                            "Enroll Now"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!user && (
              <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                <p className="text-slate-400 text-sm mb-3">New to LearnNEST?</p>
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold hover:underline">
                  Log in to enroll in this course
                </Link>
              </div>
            )}

            {state.msg && (
              <div className={`mt-4 p-3 rounded-lg text-sm border ${state.msg.includes("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                {state.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
