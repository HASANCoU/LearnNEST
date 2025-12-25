import { useEffect, useState } from "react";
import { http } from "../../api/http";
import { Link } from "react-router-dom";

export default function MyEnrollments() {
  const [state, setState] = useState({
    items: [],
    loading: true,
    msg: "",
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, msg: "" }));
    try {
      const { data } = await http.get("/api/enrollments/me");
      setState((s) => ({
        ...s,
        items: data.enrollments || [],
        loading: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        items: [],
        loading: false,
        msg: err?.response?.data?.message || "Failed to load enrollments",
      }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // If component unmounts during async call, we stop updating state
      if (cancelled) return;
      await load();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.loading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Enrollments</h2>
      {state.msg && <p className="text-red-400">{state.msg}</p>}

      <div className="space-y-3">
        {state.items.map((e) => {
          const batch = e.batch;
          const course = batch?.course;

          return (
            <div key={e._id} className="p-4 rounded border border-slate-800 bg-slate-900/40">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {course?.title || "Course"} — {batch?.name} ({batch?.code})
                  </p>
                  <p className="text-slate-400 text-sm">
                    Teacher: {batch?.teacher?.name || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-sm border ${
                      e.status === "approved"
                        ? "border-emerald-600 text-emerald-300"
                        : e.status === "rejected"
                        ? "border-rose-600 text-rose-300"
                        : "border-amber-600 text-amber-300"
                    }`}
                  >
                    {e.status}
                  </span>

                  {e.status === "approved" && batch?._id && (
                    <Link
                      to={`/student/batch/${batch._id}`}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500"
                    >
                      Open Batch
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {state.items.length === 0 && (
          <p className="text-slate-400">No enrollments yet.</p>
        )}
      </div>
    </div>
  );
}
