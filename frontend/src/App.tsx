import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminPanel from './pages/AdminPanel';
import Home from './pages/Home';
import Courses from './pages/courses/Courses';
import TeacherCourses from './pages/courses/TeacherCourses';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import CourseDetail from './pages/courses/CourseDetails';
import Memes from './pages/Memes';
import Profile from './pages/Profile';
import About from './pages/static/About';
import Contacts from './pages/static/Contacts';
import FAQ from './pages/static/FAQ';
import News from './pages/News';
import NotFound from './pages/static/NotFound';
import Privacy from './pages/static/Privacy';
import Terms from './pages/static/Terms';
import ServerError from './pages/static/ServerError';
import BugBounty from './pages/BugBounty';
import SandboxTasks from './pages/sandbox/SandboxTasks';
import TaskExecution from './pages/sandbox/TaskExecution';
import TeacherSandbox from './pages/sandbox/TeacherSandbox';
import SandboxPreview from './pages/sandbox/SandboxPreview';
import TeacherSandboxSQLCreator from './pages/sandbox/TeacherSandboxSQLCreator';
import TaskExecutionSQL from './pages/sandbox/TaskExecutionSQL';
import TeacherSandboxTemplateCreator from './pages/sandbox/TeacherSandboxTemplateCreator';
import TeacherSandboxReports from './pages/sandbox/TeacherSandboxReports';
import CourseManage from './pages/courses/CourseManage';
import CryptoLab from './pages/cryptoLab/CryptoLab';

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
        <Route path="/cryptolab" element={user ? <CryptoLab /> : <Navigate to="/login" />} />
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