import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { http } from "../../api/http";
import StudentBatchAnnouncements from "./StudentBatchAnnouncements";
import StudentBatchCompletion from "./StudentBatchCompletion";

const tabs = [
  { key: "announcements", label: "Announcements" },
  { key: "lessons", label: "Lessons" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "live", label: "Live Classes" },
  { key: "attendance", label: "Attendance" },
  { key: "exams", label: "Exams" },
  { key: "results", label: "Results" },
  { key: "completion", label: "Completion" },
];

function VideoPlayerModal({ video, onClose }) {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect width="15" height="14" x="1" y="5" rx="2" ry="2" /></svg>
              </span>
              {video.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-widest">
              {video.duration || "Video Lesson"} • LearnNEST Player
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        {/* Video Area */}
        <div className="aspect-video bg-black flex items-center justify-center">
          {video.url ? (
            <iframe
              src={video.url.includes("youtube.com") || video.url.includes("youtu.be")
                ? video.url.replace("watch?v=", "embed/").split("&")[0]
                : video.url.includes("vimeo.com")
                  ? `https://player.vimeo.com/video/${video.url.split('/').pop()}`
                  : video.url}
              className="w-full h-full border-0"
              allowFullScreen
              title={video.title}
            ></iframe>
          ) : (
            <video
              className="w-full h-full"
              controls
              autoPlay
              controlsList="nodownload"
              src={video.fileUrl ? (
                video.module ? `/api/lessons/${video._id}/view` : `/api/materials/${video._id}/view`
              ) : ""}
            ></video>
          )}
        </div>

        {/* Modal Footer / Progress Info */}
        <div className="p-6 bg-slate-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                LN
              </div>
              <div>
                <p className="text-sm font-semibold text-white">LearnNEST Academy</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Course Resource</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic">"Focus on the process, and the results will follow."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentBatch() {
  const { batchId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "announcements";
  const [active, setActive] = useState(initialTab);
  const [state, setState] = useState({ loading: true, data: [], msg: "" });

  // exams attempt
  const [attempting, setAttempting] = useState(null); // exam
  const [qState, setQState] = useState({ loading: false, questions: [], msg: "" });
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [submittingExam, setSubmittingExam] = useState(false);

  // PDF exam submission
  const [pdfSubmitExam, setPdfSubmitExam] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSubmitting, setPdfSubmitting] = useState(false);
  const [myPdfSubmissions, setMyPdfSubmissions] = useState({}); // { examId: submission }

  const [mySubs, setMySubs] = useState([]);
  const [submitFor, setSubmitFor] = useState(null);
  const [subForm, setSubForm] = useState({ submissionUrl: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  // New states for hierarchy
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});
  const [activeVideo, setActiveVideo] = useState(null);


  const setTab = (k) => {
    setActive(k);
    setSearchParams({ tab: k });
  };

  const mySubByAssignment = useMemo(() => {
    const map = new Map();
    (mySubs || []).forEach((s) => {
      const id = s.assignment?._id || s.assignment;
      if (id) map.set(String(id), s);
    });
    return map;
  }, [mySubs]);

  const load = async (tab) => {
    setState({ loading: true, data: [], msg: "" });
    try {
      if (tab === "announcements") {
        // handled by component (no-op here)
        return setState({ loading: false, data: [], msg: "" });
      }
      if (tab === "completion") {
        // handled by component
        return setState({ loading: false, data: [], msg: "" });
      }
      if (tab === "lessons") {
        const [modRes, lRes] = await Promise.all([
          http.get(`/api/modules/batch/${batchId}`),
          http.get(`/api/lessons/batch/${batchId}`),
        ]);

        const modules = modRes.data.modules || [];
        const lessons = lRes.data.lessons || [];

        // Group lessons into modules
        const lessonsByModule = {};
        lessons.forEach(l => {
          const mId = String(l.module?._id || l.module || "other");
          if (!lessonsByModule[mId]) lessonsByModule[mId] = [];
          lessonsByModule[mId].push(l);
        });

        const hierarchy = modules
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(m => ({
            ...m,
            lessons: (lessonsByModule[String(m._id)] || []).sort((a, b) => (a.order || 0) - (b.order || 0))
          }));

        return setState({ loading: false, data: hierarchy, msg: "" });
      }
      if (tab === "materials") {
        const { data } = await http.get(`/api/materials/batch/${batchId}`);
        return setState({ loading: false, data: data.materials || [], msg: "" });
      }
      if (tab === "assignments") {
        const [aRes, sRes] = await Promise.all([
          http.get(`/api/assignments/batch/${batchId}`),
          http.get(`/api/submissions/me?batchId=${batchId}`),
        ]);
        setMySubs(sRes.data.submissions || []);
        return setState({ loading: false, data: aRes.data.assignments || [], msg: "" });
      }
      if (tab === "live") {
        const { data } = await http.get(`/api/live-classes/batch/${batchId}`);
        return setState({ loading: false, data: data.liveClasses || [], msg: "" });
      }
      if (tab === "attendance") {
        const { data } = await http.get(`/api/attendance/me?batchId=${batchId}`);
        return setState({ loading: false, data: data.records || [], msg: "" });
      }
      if (tab === "exams") {
        const { data } = await http.get(`/api/exams/batch/${batchId}`);
        const exams = data.exams || [];
        // Load PDF submissions for each PDF exam
        const pdfSubs = {};
        for (const exam of exams) {
          if (exam.examType === "pdf") {
            try {
              const subRes = await http.get(`/api/exams/${exam._id}/my-submission`);
              if (subRes.data.submission) {
                pdfSubs[exam._id] = subRes.data.submission;
              }
            } catch (e) {
              // ignore
            }
          }
        }
        setMyPdfSubmissions(pdfSubs);
        return setState({ loading: false, data: exams, msg: "" });
      }
      if (tab === "results") {
        const { data } = await http.get(`/api/attempts/me?batchId=${batchId}`);
        return setState({ loading: false, data: data.results || [], msg: "" });
      }
      setState({ loading: false, data: [], msg: "Unknown tab" });
    } catch (err) {
      setState({
        loading: false,
        data: [],
        msg: err?.response?.data?.message || "Failed to load",
      });
    }
  };

  const closeAttempt = () => {
    setAttempting(null);
    setQState({ loading: false, questions: [], msg: "" });
    setAnswers({});
    setTimeLeft(null);
    setSubmittingExam(false);
  };

  const startExamFlow = async (exam) => {
    if (!exam?._id) return;
    setAttempting(exam);
    setAnswers({});
    setQState({ loading: true, questions: [], msg: "" });

    try {
      // start attempt (backend enforces published + window + enrolled)
      try {
        await http.post(`/api/attempts/exam/${exam._id}/start`);
      } catch (err) {
        // 409 = already started/submitted → still allow opening questions
        if (err?.response?.status !== 409) throw err;
      }

      const { data } = await http.get(`/api/questions/exam/${exam._id}`);
      const qs = data.questions || [];
      setQState({ loading: false, questions: qs, msg: "" });

      // start local timer (best-effort; backend is source of truth)
      const minutes = Number(exam.durationMinutes || 30);
      setTimeLeft(Math.max(1, minutes * 60));
    } catch (err) {
      setQState({
        loading: false,
        questions: [],
        msg: err?.response?.data?.message || "Failed to start exam",
      });
    }
  };

  const submitExam = async () => {
    if (!attempting?._id) return;
    setSubmittingExam(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })),
      };
      await http.post(`/api/attempts/exam/${attempting._id}/submit`, payload);
      closeAttempt();
      // refresh results tab data in background
      if (active === "results") load("results");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit exam");
    } finally {
      setSubmittingExam(false);
    }
  };

  // PDF exam submission handlers
  const openPdfSubmit = (exam) => {
    setPdfSubmitExam(exam);
    setPdfFile(null);
  };

  const closePdfSubmit = () => {
    setPdfSubmitExam(null);
    setPdfFile(null);
  };

  const viewQuestionPaper = async (exam) => {
    if (!exam?._id) return;
    try {
      const response = await http.get(`/api/exams/${exam._id}/question`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(url, "_blank");
    } catch (err) {
      alert("Failed to view question paper. " + (err?.response?.status === 401 ? "Unauthorized" : ""));
    }
  };


  const submitPdfExam = async (e) => {
    e.preventDefault();
    if (!pdfSubmitExam?._id || !pdfFile) return;
    setPdfSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submissionPdf", pdfFile);
      const { data } = await http.post(`/api/exams/${pdfSubmitExam._id}/submit`, formData);
      setMyPdfSubmissions((prev) => ({ ...prev, [pdfSubmitExam._id]: data.submission }));
      closePdfSubmit();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit");
    } finally {
      setPdfSubmitting(false);
    }
  };

  // (removed older duplicate attempt helpers)

  const openSubmit = (assignment) => {
    setSubmitFor(assignment);
    setSubForm({ submissionUrl: "", note: "" });
  };

  const closeSubmit = () => {
    setSubmitFor(null);
    setSubForm({ submissionUrl: "", note: "" });
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!submitFor?._id) return;
    setSubmitting(true);
    try {
      const { data } = await http.post("/api/submissions", {
        assignmentId: submitFor._id,
        submissionUrl: subForm.submissionUrl,
        note: subForm.note,
      });
      setMySubs((prev) => [data.submission, ...(prev || [])]);
      closeSubmit();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, batchId]);

  useEffect(() => {
    if (!attempting || timeLeft === null) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [attempting, timeLeft]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Batch Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                Active Batch
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{batchId}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              Workspace: <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Learning Session</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              Your centralized hub for all course contents, assignments, and real-time updates for this batch.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Progress</p>
                <p className="text-xl font-bold text-white tracking-tighter">75%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
        {tabs.map((t) => {
          const isActive = active === t.key;
          const icons = {
            announcements: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z" /><path d="M10 12v.01" /><path d="M13 12v.01" /><path d="M7 12v.01" /><path d="M22 15h-4" /><path d="M22 9h-4" /></svg>,
            lessons: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 10h16" /><path d="M4 14h16" /><path d="M4 18h16" /></svg>,
            materials: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>,
            assignments: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10" /><path d="m16 8-4 4-4-4" /><path d="M4 22h16" /></svg>,
            live: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>,
            attendance: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
            exams: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6" /><path d="M12 9v6" /><circle cx="12" cy="12" r="10" /></svg>,
            results: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6" /><path d="M6 20V10" /><path d="M18 20V4" /></svg>,
            completion: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
          };

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group ${isActive
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
            >
              <div className={`mb-2 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500"}`}>
                {icons[t.key] || <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
            </button>
          );
        })}
      </div>

      {state.loading && <p>Loading...</p>}
      {state.msg && <p className="text-red-400">{state.msg}</p>}

      {!state.loading && !state.msg && (
        <div className="space-y-3">
          {active === "announcements" && <StudentBatchAnnouncements batchId={batchId} />}
          {active === "completion" && <StudentBatchCompletion batchId={batchId} />}

          {active === "lessons" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search Modules or Lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-xl font-bold"
                />
              </div>

              {state.data.length ? (
                <div className="space-y-6">
                  {state.data
                    .filter(m => !searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.lessons.some(l => l.title.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((module) => {
                      const isExpanded = expandedModules[module._id];
                      const toggle = () => setExpandedModules(prev => ({ ...prev, [module._id]: !isExpanded }));

                      return (
                        <div key={module._id} className="rounded-3xl bg-slate-900/50 border border-slate-800 overflow-hidden transition-all shadow-xl hover:border-slate-700">
                          {/* Module Header */}
                          <button
                            onClick={toggle}
                            className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg">
                                {module.order}
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white transition-colors uppercase tracking-tight">
                                  {module.title}
                                </h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                  {module.lessons.length} {module.lessons.length === 1 ? 'Lesson' : 'Lessons'} • Part of Curriculum
                                </p>
                              </div>
                            </div>
                            <div className={`p-2 rounded-xl bg-slate-800 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                          </button>

                          {/* Lessons Area */}
                          {isExpanded && (
                            <div className="p-4 pt-0 space-y-3 bg-slate-950/20 animate-in slide-in-from-top-4 duration-500">
                              {module.lessons.map((lesson) => (
                                <div key={lesson._id} className="group rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-500/30 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-indigo-400 transition-colors">
                                      {lesson.order}
                                    </div>
                                    <div>
                                      <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">{lesson.title}</h4>
                                      {lesson.videoUrl && (
                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-tighter bg-indigo-500/10 px-2.5 py-1 rounded-md w-fit ring-1 ring-indigo-500/20">
                                          <i className="fas fa-play-circle"></i> Video Lecture Available
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 w-full md:w-auto">
                                    {lesson.videoUrl ? (
                                      <button
                                        onClick={() => setActiveVideo({ ...lesson, url: lesson.videoUrl, title: lesson.title })}
                                        className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                      >
                                        Watch Lesson
                                      </button>
                                    ) : (
                                      <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                        No Video
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {module.lessons.length === 0 && (
                                <div className="p-12 text-center">
                                  <p className="text-xs text-slate-600 font-black uppercase tracking-widest">No lessons published in this module yet.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-20 text-center rounded-3xl bg-slate-900/50 border-2 border-dashed border-slate-800">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-300 uppercase italic">Curriculum Empty</h3>
                  <p className="text-slate-500 text-sm mt-1">No modules have been published for this batch yet.</p>
                </div>
              )}
            </div>
          )}

          {active === "materials" &&
            (state.data.length ? (
              <div className="grid md:grid-cols-2 gap-4">
                {state.data.map((m) => (
                  <div key={m._id} className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-indigo-500/30 transition-all shadow-xl">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${m.type === "video" ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {m.type === "video" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.type}</span>
                        {m.lesson?.title && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {m.lesson.title}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                        {m.title}
                      </h3>

                      {m.note && <p className="text-slate-400 text-xs line-clamp-2 mb-3">{m.note}</p>}

                      {m.fileUrl && m.type === "video" && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-3 group/video shadow-2xl">
                          <video className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity">
                            <source src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/materials/${m._id}/view`} type="video/mp4" />
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/video:bg-black/20 transition-all pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-90 group-hover/video:scale-100 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z" /></svg>
                            </div>
                          </div>
                          <a
                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/materials/${m._id}/view`}
                            target="_blank" rel="noreferrer"
                            className="absolute inset-0 z-10"
                          ></a>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-3">
                      {m.fileUrl ? (
                        <>
                          <button
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                            onClick={() => {
                              if (m.type === "video") {
                                setActiveVideo(m);
                              } else {
                                window.open(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/materials/${m._id}/view`, "_blank");
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                            {m.type === "video" ? "Watch Now" : "View Material"}
                          </button>
                          <a
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/materials/${m._id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                          </a>
                        </>
                      ) : m.url ? (
                        <a
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition-all border border-slate-700 uppercase tracking-widest"
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                          External Resource
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800">
                <p className="text-slate-500 font-medium">No materials have been added to this batch yet.</p>
              </div>
            ))}

          {active === "assignments" &&
            (state.data.length ? (
              <div className="grid gap-4">
                {state.data.map((a) => {
                  const sub = mySubByAssignment.get(String(a._id));
                  const canSubmit = a.isPublished && !sub;
                  return (
                    <div key={a._id} className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all shadow-xl">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {sub ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                Submitted
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                                Pending
                              </span>
                            )}
                            <span className="text-slate-500 text-xs">•</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                              Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A"}
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                            {a.title}
                          </h3>
                          {a.description && (
                            <p className="text-slate-400 text-xs mb-3 leading-relaxed line-clamp-2 italic">
                              "{a.description}"
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                              {a.totalMarks ?? 100} Marks
                            </div>
                          </div>

                          {sub && (
                            <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col md:flex-row md:items-center gap-3">
                              <a
                                href={sub.submissionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-indigo-400 text-[10px] font-bold hover:bg-slate-700 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                View My Work
                              </a>
                              {sub.status === "graded" && (
                                <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                  <span className="text-slate-300 text-[10px] font-bold mr-2">Grade:</span>
                                  <span className="text-indigo-400 font-extrabold text-xs">{sub.marks} / {a.totalMarks}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          <button
                            disabled={!canSubmit}
                            onClick={() => openSubmit(a)}
                            className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${canSubmit
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                              }`}
                          >
                            {sub ? "Resubmit" : "Submit Work"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800">
                <p className="text-slate-500 font-medium">No assignments have been assigned to this batch yet.</p>
              </div>
            ))}

          {active === "exams" &&
            (state.data.length ? (
              <div className="grid gap-4">
                {state.data.map((e) => {
                  const isPdf = String(e.examType || "").toLowerCase() === "pdf";
                  const mySub = myPdfSubmissions[e._id];
                  const now = new Date();
                  const isDeadlinePassed = e.endAt && now > new Date(e.endAt);
                  const isNotStarted = e.startAt && now < new Date(e.startAt);

                  return (
                    <div key={e._id} className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none"></div>

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2.5 mb-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${isPdf ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                              {e.examType} Exam
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                              {e.durationMinutes}m
                            </span>
                            {mySub && (
                              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                Completed
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                            {e.title}
                          </h3>

                          <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            <div className="flex items-center gap-2.5 text-slate-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              <div className="text-[10px] font-bold uppercase tracking-widest">
                                <span className="block text-slate-600 leading-tight">Starts At</span>
                                <span className="text-slate-400">{e.startAt ? new Date(e.startAt).toLocaleString() : "Available Now"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" /></svg>
                              <div className="text-[10px] font-bold uppercase tracking-widest">
                                <span className="block text-slate-600 leading-tight">Deadline</span>
                                <span className="text-slate-400">{e.endAt ? new Date(e.endAt).toLocaleString() : "No Deadline"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                          {isPdf && e.questionPdfUrl && (
                            <button
                              onClick={() => viewQuestionPaper(e)}
                              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-700 flex items-center justify-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                              Paper
                            </button>
                          )}

                          {isPdf ? (
                            <button
                              onClick={() => openPdfSubmit(e)}
                              disabled={isNotStarted}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${isNotStarted
                                ? "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10" /><path d="m16 8-4 4-4-4" /><path d="M4 22h16" /></svg>
                              {mySub ? "Update" : "Submit"}
                            </button>
                          ) : (
                            <button
                              onClick={() => startExamFlow(e)}
                              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4-4-4" /><path d="M3 3.41c0-1.88 2.28-2.83 3.61-1.5l14.89 14.89c1.33 1.33.38 3.61-1.5 3.61H3.41c-1.88 0-2.83-2.28-1.5-3.61l1.1-1.1" /><path d="M12 14v7" /><path d="M12 7v4" /><path d="M8 21h8" /></svg>
                              Start MCQ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800">
                <p className="text-slate-500 font-medium">No exams have been scheduled for this batch yet.</p>
              </div>
            ))}

          {active === "results" &&
            (state.data.length ? (
              state.data.map((r) => (
                <div key={r._id} className="p-4 rounded border border-slate-800">
                  <p className="font-semibold">{r.exam?.title || "Exam"}</p>
                  <p className="text-slate-400 text-sm">
                    Score: {r.score} • Correct: {r.correctCount} • Wrong: {r.wrongCount}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No results yet.</p>
            ))}
        </div>
      )
      }

      {attempting && (
        <div className="border border-slate-800 rounded p-4 bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Exam: {attempting.title}</h3>
              <p className="text-slate-400 text-sm">
                Time left:{" "}
                {timeLeft !== null
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
                  : "—"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Note: Timer is for UX. Backend enforces the real deadline from your start time.
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-200" onClick={closeAttempt}>
              ✕
            </button>
          </div>

          {qState.msg && (
            <div className="mt-3 p-3 rounded border border-red-800 text-red-300 text-sm">
              {qState.msg}
            </div>
          )}

          {qState.loading ? (
            <p className="text-slate-400 mt-3">Loading questions…</p>
          ) : qState.questions.length ? (
            <div className="mt-4 space-y-4">
              {qState.questions.map((q, idx) => (
                <div key={q._id} className="p-3 rounded border border-slate-800">
                  <p className="font-medium">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="mt-3 space-y-2">
                    {(q.options || []).map((opt, oi) => {
                      const checked = answers[q._id] === oi;
                      return (
                        <label
                          key={oi}
                          className={`flex gap-2 items-start p-2 rounded border border-slate-800 cursor-pointer ${checked ? "bg-slate-900" : ""
                            }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}`}
                            checked={checked}
                            onChange={() => setAnswers((p) => ({ ...p, [q._id]: oi }))}
                          />
                          <span className="text-sm">
                            <span className="text-slate-400 mr-2">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Marks: {q.marks} • Negative: {q.negativeMarks}
                  </p>
                </div>
              ))}

              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-2 rounded border border-slate-800 text-sm"
                  onClick={closeAttempt}
                  disabled={submittingExam}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-50"
                  onClick={submitExam}
                  disabled={submittingExam}
                >
                  {submittingExam ? "Submitting…" : "Submit Exam"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 mt-3">No questions found for this exam.</p>
          )}
        </div>
      )}

      {submitFor && (
        <div className="border border-slate-800 rounded p-4 bg-slate-950">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Submit Assignment</h3>
            <button className="text-slate-400 hover:text-slate-200" onClick={closeSubmit}>
              ✕
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">{submitFor.title}</p>

          <form onSubmit={submitAssignment} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400">Submission URL *</label>
              <input
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={subForm.submissionUrl}
                onChange={(e) => setSubForm((p) => ({ ...p, submissionUrl: e.target.value }))}
                placeholder="Google Drive / GitHub / Any link"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Note (optional)</label>
              <textarea
                className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                value={subForm.note}
                onChange={(e) => setSubForm((p) => ({ ...p, note: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeSubmit}
                className="px-3 py-2 rounded border border-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                className="px-3 py-2 rounded bg-slate-100 text-slate-900 text-sm disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Submission Modal */}
      {pdfSubmitExam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded p-6 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Submit Exam Answer</h3>
              <button className="text-slate-400 hover:text-slate-200 text-xl" onClick={closePdfSubmit}>
                ✕
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">{pdfSubmitExam.title}</p>

            {pdfSubmitExam.questionPdfUrl && (
              <div className="mb-4">
                <button
                  onClick={() => viewQuestionPaper(pdfSubmitExam)}
                  className="text-indigo-400 hover:underline text-sm flex items-center gap-2"
                >
                  📄 View Question Paper
                </button>
              </div>
            )}

            <form onSubmit={submitPdfExam} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Upload Answer File *</label>
                <input
                  type="file"
                  className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-sm file:text-slate-300 cursor-pointer"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Allowed: PDF, Images, Word, ZIP, etc.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closePdfSubmit}
                  className="px-4 py-2 rounded border border-slate-800 text-sm hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  disabled={pdfSubmitting || !pdfFile}
                  className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50 hover:bg-indigo-500 font-medium"
                >
                  {pdfSubmitting ? "Submitting..." : "Submit Answer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Video Modal */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
}
