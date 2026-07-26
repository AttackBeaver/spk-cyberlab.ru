import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import Home from './pages/Home';
import Courses from './pages/Courses';
import TeacherCourses from './pages/TeacherCourses';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import CourseDetails from './pages/CourseDetails';
import TaskPage from './pages/TaskPage';
import TeacherCourseEdit from './pages/TeacherCourseEdit';

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
        <Route path="/teacher/courses" element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherCourses /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'ADMIN' ? <Layout><AdminPanel /></Layout> : <Navigate to="/" />} />
        <Route path="/course/:id" element={user ? <CourseDetails /> : <Navigate to="/login" />} />
        <Route path="/task/:taskId" element={user ? <TaskPage /> : <Navigate to="/login" />} />
        <Route path="/teacher/course/:courseId/edit" element={user?.role === 'TEACHER' || user?.role === 'ADMIN' ? <TeacherCourseEdit /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;