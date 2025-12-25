import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./auth/ProtectedRoute";
import DashboardRedirect from "./pages/DashboardRedirect";

// student
import StudentShell from "./pages/student/StudentShell";
import StudentHome from "./pages/student/StudentHome";
import MyEnrollments from "./pages/student/MyEnrollments";
import StudentBatch from "./pages/student/StudentBatch";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="enrollments" element={<MyEnrollments />} />
            <Route path="batch/:batchId" element={<StudentBatch />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
