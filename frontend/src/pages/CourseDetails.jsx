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

      const bRes = await http.get(`/api/batches?courseId=${course._id}`);

      let enrollments = [];
      if (user) {
        try {
          const eRes = await http.get("/api/enrollments/me");
          enrollments = eRes.data.enrollments || [];
        } catch {
          // ignore silently (token might be expired etc.)
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

    // already requested/approved
    if (myEnrollmentByBatchId.get(batchId)) {
      return setState((s) => ({
        ...s,
        msg: "You already have an enrollment request for this batch.",
      }));
    }

    try {
      setState((s) => ({ ...s, enrollingBatchId: batchId }));
      await http.post("/api/enrollments", { batchId });

      // refresh enrollments
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

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.loading && !state.course) return <p>Loading...</p>;
  if (!state.course) return <p className="text-red-400">{state.msg || "Not found"}</p>;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold">{state.course.title}</h2>
          {state.course.published ? (
            <span className="text-xs px-2 py-1 rounded border border-emerald-700 text-emerald-300">
              Published
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300">
              Draft
            </span>
          )}
        </div>

        <p className="text-slate-300 mt-2">{state.course.description}</p>
        <p className="text-slate-400 text-sm mt-2">
          {state.course.category} • {state.course.level} • {state.course.language}
        </p>

        {!user ? (
          <div className="mt-4 p-3 rounded border border-slate-800 bg-slate-900/40">
            <p className="text-slate-200 text-sm">
              To enroll, please <Link className="underline" to="/login">login</Link>.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <Link className="text-sm underline text-slate-200" to="/student/enrollments">
              View my enrollments
            </Link>
          </div>
        )}
      </div>

      <div className="p-4 rounded border border-slate-800">
        <h3 className="text-xl font-bold mb-3">Available Batches</h3>

        {state.batches.length === 0 && (
          <p className="text-slate-400">No active batches.</p>
        )}

        <div className="space-y-2">
          {state.batches.map((b) => {
            const myE = myEnrollmentByBatchId.get(b._id);
            const status = myE?.status;

            const statusPill =
              status === "approved" ? (
                <span className="px-2 py-1 rounded text-xs border border-emerald-600 text-emerald-300">
                  approved
                </span>
              ) : status === "rejected" ? (
                <span className="px-2 py-1 rounded text-xs border border-rose-600 text-rose-300">
                  rejected
                </span>
              ) : status === "pending" ? (
                <span className="px-2 py-1 rounded text-xs border border-amber-600 text-amber-300">
                  pending
                </span>
              ) : null;

            return (
              <div
                key={b._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-800 rounded p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">
                      {b.name} ({b.code})
                    </p>
                    {statusPill}
                  </div>

                  <p className="text-slate-400 text-sm">
                    Teacher: {b.teacher?.name || "N/A"}
                  </p>

                  <div className="text-slate-400 text-xs flex gap-3 flex-wrap">
                    {typeof b.seatLimit === "number" && <span>Seats: {b.seatLimit}</span>}
                    {b.startDate && <span>Start: {String(b.startDate).slice(0, 10)}</span>}
                    {b.endDate && <span>End: {String(b.endDate).slice(0, 10)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === "approved" && b?._id ? (
                    <Link
                      to={`/student/batch/${b._id}`}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
                    >
                      Open Batch
                    </Link>
                  ) : (
                    <button
                      className={`px-4 py-2 rounded ${
                        myE ? "bg-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                      }`}
                      onClick={() => enroll(b._id)}
                      disabled={!!myE || state.enrollingBatchId === b._id}
                    >
                      {state.enrollingBatchId === b._id ? "Requesting..." : myE ? "Requested" : "Enroll"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {state.msg && <p className="mt-3 text-slate-200">{state.msg}</p>}
      </div>
    </div>
  );
}
