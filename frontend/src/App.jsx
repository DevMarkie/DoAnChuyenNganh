import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingFallback from './components/common/LoadingFallback';

// Auth - Lazy Loaded
const PortalHubPage = lazy(() => import('./pages/auth/PortalHubPage'));
const PortalLoginPage = lazy(() => import('./pages/auth/PortalLoginPage'));

// Academic Affairs Pages - Lazy Loaded
const AcademicDashboardPage = lazy(() => import('./pages/academic/AcademicDashboardPage'));
const GraduationPage = lazy(() => import('./pages/academic/GraduationPage'));

// Admin & Shared Management Pages - Lazy Loaded
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage'));
const ClassesPage = lazy(() => import('./pages/admin/ClassesPage'));
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'));
const LecturersPage = lazy(() => import('./pages/admin/LecturersPage'));
const SemestersPage = lazy(() => import('./pages/admin/SemestersPage'));
const TuitionCashierPage = lazy(() => import('./pages/admin/TuitionCashierPage'));
const CourseSectionsPage = lazy(() => import('./pages/admin/CourseSectionsPage'));
const SchedulesPage = lazy(() => import('./pages/admin/SchedulesPage'));
const AdminGradesPage = lazy(() => import('./pages/admin/GradesPage'));
const ExamRoomsPage = lazy(() => import('./pages/admin/ExamRoomsPage'));
const PasswordResetsPage = lazy(() => import('./pages/admin/PasswordResetsPage'));
const AcademicWarningsPage = lazy(() => import('./pages/admin/AcademicWarningsPage'));
const AdminGradeAppealsPage = lazy(() => import('./pages/shared/GradeAppealsPage'));
const GradeAmendmentsPage = lazy(() => import('./pages/shared/GradeAmendmentsPage'));
const GradeAuditLogsPage = lazy(() => import('./pages/shared/GradeAuditLogsPage'));
const StudentConductPage = lazy(() => import('./pages/admin/StudentConductPage'));

// Lecturer Pages - Lazy Loaded
const LecturerDashboard = lazy(() => import('./pages/lecturer/LecturerDashboard'));
const LecturerSchedulePage = lazy(() => import('./pages/lecturer/LecturerSchedulePage'));
const GradeEntryPage = lazy(() => import('./pages/lecturer/GradeEntryPage'));
const LecturerProfilePage = lazy(() => import('./pages/lecturer/LecturerProfilePage'));
const LecturerGradeAppealsPage = lazy(() => import('./pages/shared/GradeAppealsPage'));

// Student Pages - Lazy Loaded
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentSchedulePage = lazy(() => import('./pages/student/StudentSchedulePage'));
const EnrollPage = lazy(() => import('./pages/student/EnrollPage'));
const MyEnrollmentsPage = lazy(() => import('./pages/student/MyEnrollmentsPage'));
const TranscriptPage = lazy(() => import('./pages/student/TranscriptPage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
const CurriculumRoadmapPage = lazy(() => import('./pages/student/CurriculumRoadmapPage'));

function ProtectedRoute({ children, allowedRoles, fallbackLoginPath }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    const loginPath = fallbackLoginPath || (
      allowedRoles?.includes('ACADEMIC_AFFAIRS') ? '/academic/login' :
      allowedRoles?.includes('EXAMINATION_OFFICER') ? '/admin/login' :
      allowedRoles?.includes('ADMIN') ? '/admin/login' :
      allowedRoles?.includes('LECTURER') ? '/lecturer/login' :
      '/student/login'
    );
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const defaultPath = (user?.role === 'ACADEMIC_AFFAIRS' || user?.role === 'ACADEMIC_STAFF') ? '/academic/dashboard'
      : user?.role === 'EXAMINATION_OFFICER' ? '/exam/rooms'
      : user?.role === 'ADMIN' ? '/admin/dashboard'
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
    if (user?.role === 'ACADEMIC_AFFAIRS' || user?.role === 'ACADEMIC_STAFF') return '/academic/dashboard';
    if (user?.role === 'EXAMINATION_OFFICER') return '/exam/rooms';
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
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <PortalLoginPage portalType="student" />
          } />
          <Route path="/lecturer/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <PortalLoginPage portalType="lecturer" />
          } />
          <Route path="/academic/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <PortalLoginPage portalType="academic" />
          } />
          <Route path="/admin/login" element={
            isAuthenticated ? <Navigate to={getDefaultRedirect()} replace /> : <PortalLoginPage portalType="admin" />
          } />

          {/* Academic Affairs Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['ACADEMIC_AFFAIRS', 'ACADEMIC_STAFF']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/academic/dashboard" element={<AcademicDashboardPage />} />
            <Route path="/academic/students" element={<StudentsPage />} />
            <Route path="/academic/departments" element={<DepartmentsPage />} />
            <Route path="/academic/classes" element={<ClassesPage />} />
            <Route path="/academic/subjects" element={<SubjectsPage />} />
            <Route path="/academic/semesters" element={<SemestersPage />} />
            <Route path="/academic/course-sections" element={<CourseSectionsPage />} />
            <Route path="/academic/schedules" element={<SchedulesPage />} />
            <Route path="/academic/exam-rooms" element={<ExamRoomsPage />} />
            <Route path="/academic/grades" element={<AdminGradesPage />} />
            <Route path="/academic/grade-audit-logs" element={<GradeAuditLogsPage />} />
            <Route path="/academic/academic-warnings" element={<AcademicWarningsPage />} />
            <Route path="/academic/grade-appeals" element={<AdminGradeAppealsPage />} />
            <Route path="/academic/grade-amendments" element={<GradeAmendmentsPage />} />
            <Route path="/academic/graduation" element={<GraduationPage />} />
            <Route path="/academic/tuition" element={<TuitionCashierPage />} />
          </Route>

          {/* Examination Officer Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['EXAMINATION_OFFICER']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/exam/dashboard" element={<ExamRoomsPage />} />
            <Route path="/exam/rooms" element={<ExamRoomsPage />} />
            <Route path="/exam/audit-logs" element={<GradeAuditLogsPage />} />
          </Route>

          {/* Admin Routes - Strict Separation of Duties */}
          <Route element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/student-conduct" element={<StudentConductPage />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/classes" element={<ClassesPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/lecturers" element={<LecturersPage />} />
            <Route path="/admin/semesters" element={<SemestersPage />} />
            <Route path="/admin/tuition" element={<TuitionCashierPage />} />
            <Route path="/admin/course-sections" element={<CourseSectionsPage readOnly={true} />} />
            <Route path="/admin/grades" element={<AdminGradesPage readOnlyAudit={true} />} />
            <Route path="/admin/grade-audit-logs" element={<GradeAuditLogsPage />} />
            <Route path="/admin/grade-amendments" element={<GradeAmendmentsPage />} />
            <Route path="/admin/password-resets" element={<PasswordResetsPage />} />
          </Route>

          {/* Lecturer Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['LECTURER']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
            <Route path="/lecturer/my-sections" element={<Navigate to="/lecturer/schedule" replace />} />
            <Route path="/lecturer/schedule" element={<LecturerSchedulePage />} />
            <Route path="/lecturer/grades" element={<GradeEntryPage />} />
            <Route path="/lecturer/profile" element={<LecturerProfilePage />} />
            <Route path="/lecturer/grade-appeals" element={<LecturerGradeAppealsPage />} />
            <Route path="/lecturer/grade-amendments" element={<GradeAmendmentsPage />} />
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
            <Route path="/student/tuition" element={<MyEnrollmentsPage />} />
            <Route path="/student/transcript" element={<TranscriptPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/curriculum" element={<CurriculumRoadmapPage />} />
          </Route>

          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
