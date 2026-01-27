import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./auth/ProtectedRoute";
import DashboardRedirect from "./pages/DashboardRedirect";
import Profile from "./pages/Profile";

// student
import StudentShell from "./pages/student/StudentShell";
import StudentHome from "./pages/student/StudentHome";
import MyEnrollments from "./pages/student/MyEnrollments";
import StudentBatch from "./pages/student/StudentBatch";

// teacher
import TeacherShell from "./pages/teacher/TeacherShell";
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherCourseEdit from "./pages/teacher/TeacherCourseEdit";
import TeacherBatches from "./pages/teacher/TeacherBatches";
import TeacherBatchManage from "./pages/teacher/TeacherBatchManage";

// admin
import AdminShell from "./pages/admin/AdminShell";
import AdminHome from "./pages/admin/AdminHome";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminBatches from "./pages/admin/AdminBatches";
import AdminBatchManage from "./pages/admin/AdminBatchManage";

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

          {/* Profile page for all authenticated users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
            <Route path="notifications" element={<Notifications />} />
            <Route path="batch/:batchId" element={<StudentBatch />} />
          </Route>

          {/* Teacher Dashboard */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherHome />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="courses/:courseId" element={<TeacherCourseEdit />} />
            <Route path="batches" element={<TeacherBatches />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="batches/:batchId" element={<TeacherBatchManage />} />
          </Route>

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/:courseId/edit" element={<TeacherCourseEdit />} />
            <Route path="batches" element={<AdminBatches />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="batches/:batchId" element={<AdminBatchManage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
