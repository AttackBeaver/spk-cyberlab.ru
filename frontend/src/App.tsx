import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import Home from './pages/Home';
import Courses from './pages/Courses';
import TeacherCourses from './pages/TeacherCourses';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import CourseDetail from './pages/CourseDetails';
import Memes from './pages/Memes';
import Profile from './pages/Profile';
import About from './pages/About';
import Contacts from './pages/Contacts';
import FAQ from './pages/FAQ';
import News from './pages/News';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ServerError from './pages/ServerError';
import BugBounty from './pages/BugBounty';
import SandboxTasks from './pages/SandboxTasks';
import TaskExecution from './pages/TaskExecution';
import TeacherSandbox from './pages/TeacherSandbox';
import SandboxPreview from './pages/SandboxPreview';
import TeacherSandboxSQLCreator from './pages/TeacherSandboxSQLCreator';
import TaskExecutionSQL from './pages/TaskExecutionSQL';
import TeacherSandboxTemplateCreator from './pages/TeacherSandboxTemplateCreator';
import TeacherSandboxReports from './pages/TeacherSandboxReports';
import CourseManage from './pages/CourseManage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={user ? <Courses /> : <Navigate to="/login" />} />
        <Route
          path="/teacher/courses"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherCourses /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={user?.role === 'ADMIN' ? <Layout><AdminPanel /></Layout> : <Navigate to="/" />}
        />
        <Route path="/course/:id" element={user ? <CourseDetail /> : <Navigate to="/login" />} />
        {/* Старый маршрут редактирования удалён, вместо него используется /course/:courseId/manage */}
        <Route path="/memes" element={<Memes />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/news" element={<News />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/bug-bounty" element={user ? <BugBounty /> : <Navigate to="/login" />} />
        <Route path="/sandbox" element={user ? <SandboxTasks /> : <Navigate to="/login" />} />
        <Route
          path="/sandbox/task/:taskId/attempt/:attemptId"
          element={user ? <TaskExecution /> : <Navigate to="/login" />}
        />
        <Route
          path="/teacher/sandbox"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherSandbox /> : <Navigate to="/" />}
        />
        <Route
          path="/sandbox/preview/:taskId"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <SandboxPreview /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/sandbox/sql/create"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherSandboxSQLCreator /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/sandbox/sql/edit/:taskId"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherSandboxSQLCreator /> : <Navigate to="/" />}
        />
        <Route
          path="/sandbox/sql/task/:taskId/attempt/:attemptId"
          element={user ? <TaskExecutionSQL /> : <Navigate to="/login" />}
        />

        <Route
          path="/teacher/sandbox/templates/create"
          element={user?.role === 'ADMIN' ? <TeacherSandboxTemplateCreator /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/sandbox/templates/edit/:templateId"
          element={user?.role === 'ADMIN' ? <TeacherSandboxTemplateCreator /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/sandbox/reports/:taskId"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherSandboxReports /> : <Navigate to="/" />}
        />
        <Route
          path="/course/:courseId/manage"
          element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <CourseManage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;