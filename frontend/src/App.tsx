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
import Memes from './pages/Memes';
import Profile from './pages/Profile';
import About from './pages/About';
import Contacts from './pages/Contacts';
import FAQ from './pages/FAQ';
import News from './pages/News';
import Directions from './pages/Directions';
import NotFound from './pages/NotFound';
import Practicums from './pages/Practicums';
import Labs from './pages/Labs';
import Testing from './pages/Testing';
import VirtualLabs from './pages/VirtualLabs';
import CTFPolygon from './pages/CTFPolygon';
import Knowledge from './pages/Knowledge';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ServerError from './pages/ServerError';
import BugBounty from './pages/BugBounty';

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
        <Route path="/memes" element={<Memes />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/news" element={<News />} />
        <Route path="/directions" element={<Directions />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/practicums" element={<Practicums />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="/virtual-labs" element={<VirtualLabs />} />
        <Route path="/ctf-polygon" element={<CTFPolygon />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/bug-bounty" element={user ? <BugBounty /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;