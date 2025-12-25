import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../api/http";
import { getUser } from "../auth/auth";

export default function CourseDetails() {
  const { slug } = useParams();
  const user = getUser();

  const [state, setState] = useState({
    course: null,
    batches: [],
    msg: "",
    loading: true,
  });

  const load = async (currentSlug) => {
    setState((s) => ({ ...s, msg: "", loading: true }));

    try {
      const cRes = await http.get(`/api/courses/slug/${currentSlug}`);
      const course = cRes.data.course;

      const bRes = await http.get(`/api/batches?courseId=${course._id}`);

      setState((s) => ({
        ...s,
        course,
        batches: bRes.data.batches || [],
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

  const enroll = async (batchId) => {
    setState((s) => ({ ...s, msg: "" }));
    if (!user) return setState((s) => ({ ...s, msg: "Please login to enroll" }));

    try {
      await http.post("/api/enrollments", { batchId });
      setState((s) => ({ ...s, msg: "Enrollment requested ✅ (wait for approval)" }));
    } catch (err) {
      setState((s) => ({
        ...s,
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
        <h2 className="text-2xl font-bold">{state.course.title}</h2>
        <p className="text-slate-300 mt-2">{state.course.description}</p>
        <p className="text-slate-400 text-sm mt-2">
          {state.course.category} • {state.course.level} • {state.course.language}
        </p>
      </div>

      <div className="p-4 rounded border border-slate-800">
        <h3 className="text-xl font-bold mb-3">Available Batches</h3>

        {state.batches.length === 0 && (
          <p className="text-slate-400">No active batches.</p>
        )}

        <div className="space-y-2">
          {state.batches.map((b) => (
            <div
              key={b._id}
              className="flex items-center justify-between border border-slate-800 rounded p-3"
            >
              <div>
                <p className="font-semibold">
                  {b.name} ({b.code})
                </p>
                <p className="text-slate-400 text-sm">
                  Teacher: {b.teacher?.name || "N/A"}
                </p>
              </div>

              <button
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500"
                onClick={() => enroll(b._id)}
              >
                Enroll
              </button>
            </div>
          ))}
        </div>

        {state.msg && <p className="mt-3 text-slate-200">{state.msg}</p>}
      </div>
    </div>
  );
}
