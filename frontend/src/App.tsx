import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import { useAuth } from './hooks/useAuth';

const Home = () => {
  const { user, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Добро пожаловать, {user?.fullName}!</h1>
      <p className="mt-2">Роль: {user?.role}</p>
      <p className="mt-2">Логин: {user?.username}</p>
      {user?.role === 'ADMIN' && (
        <Link to="/admin" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
          Админ-панель
        </Link>
      )}
      <button
        onClick={logout}
        className="mt-4 ml-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Выйти
      </button>
    </div>
  );
};

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
        <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;