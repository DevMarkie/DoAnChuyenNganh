import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingFallback from './components/common/LoadingFallback';

// Auth - Lazy Loaded
const PortalHubPage = lazy(() => import('./pages/auth/PortalHubPage'));
const StudentLoginPage = lazy(() => import('./pages/auth/StudentLoginPage'));
const LecturerLoginPage = lazy(() => import('./pages/auth/LecturerLoginPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));

// Admin Pages - Lazy Loaded
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage'));
const ClassesPage = lazy(() => import('./pages/admin/ClassesPage'));
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'));
const LecturersPage = lazy(() => import('./pages/admin/LecturersPage'));
const SemestersPage = lazy(() => import('./pages/admin/SemestersPage'));
const CourseSectionsPage = lazy(() => import('./pages/admin/CourseSectionsPage'));
const SchedulesPage = lazy(() => import('./pages/admin/SchedulesPage'));
const AdminGradesPage = lazy(() => import('./pages/admin/GradesPage'));
const PasswordResetsPage = lazy(() => import('./pages/admin/PasswordResetsPage'));

// Lecturer Pages - Lazy Loaded
const LecturerDashboard = lazy(() => import('./pages/lecturer/LecturerDashboard'));
const MySectionsPage = lazy(() => import('./pages/lecturer/MySectionsPage'));
const LecturerSchedulePage = lazy(() => import('./pages/lecturer/LecturerSchedulePage'));
const GradeEntryPage = lazy(() => import('./pages/lecturer/GradeEntryPage'));
const LecturerProfilePage = lazy(() => import('./pages/lecturer/LecturerProfilePage'));

// Student Pages - Lazy Loaded
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentSchedulePage = lazy(() => import('./pages/student/StudentSchedulePage'));
const EnrollPage = lazy(() => import('./pages/student/EnrollPage'));
const MyEnrollmentsPage = lazy(() => import('./pages/student/MyEnrollmentsPage'));
const TranscriptPage = lazy(() => import('./pages/student/TranscriptPage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));

function ProtectedRoute({ children, allowedRoles, fallbackLoginPath }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    const loginPath = fallbackLoginPath || (
      allowedRoles?.includes('ADMIN') ? '/admin/login' :
      allowedRoles?.includes('LECTURER') ? '/lecturer/login' :
      '/student/login'
    );
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const defaultPath = user?.role === 'ADMIN' ? '/admin/dashboard'
      : user?.role === 'LECTURER' ? '/lecturer/dashboard'
      : '/student/dashboard';
    return <Navigate to={defaultPath} replace />;
  }
  return children;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'LECTURER') return '/lecturer/dashboard';
    return '/student/dashboard';
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Dedicated Portal Login Routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <PortalHubPage />
          } />
          <Route path="/student/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <StudentLoginPage />
          } />
          <Route path="/lecturer/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <LecturerLoginPage />
          } />
          <Route path="/admin/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <AdminLoginPage />
          } />

          {/* Admin Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/classes" element={<ClassesPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/lecturers" element={<LecturersPage />} />
            <Route path="/admin/semesters" element={<SemestersPage />} />
            <Route path="/admin/course-sections" element={<CourseSectionsPage />} />
            <Route path="/admin/schedules" element={<SchedulesPage />} />
            <Route path="/admin/grades" element={<AdminGradesPage />} />
            <Route path="/admin/password-resets" element={<PasswordResetsPage />} />
          </Route>

          {/* Lecturer Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['LECTURER']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
            <Route path="/lecturer/my-sections" element={<MySectionsPage />} />
            <Route path="/lecturer/schedule" element={<LecturerSchedulePage />} />
            <Route path="/lecturer/grades" element={<GradeEntryPage />} />
            <Route path="/lecturer/profile" element={<LecturerProfilePage />} />
          </Route>

          {/* Student Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route path="/student/enroll" element={<EnrollPage />} />
            <Route path="/student/enrollments" element={<MyEnrollmentsPage />} />
            <Route path="/student/transcript" element={<TranscriptPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
