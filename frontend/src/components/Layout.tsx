import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  hideAuth?: boolean;
}

const Layout = ({ children, hideAuth = false }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            {/* Логотип */}
            <img src="/logo.png" alt="Логотип SPK CyberLab" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-blue-600">SPK CyberLab</span>
            <span className="text-sm text-gray-500 hidden sm:inline">| Образовательная платформа</span>
          </Link>
          <div className="flex items-center space-x-4">
            {!hideAuth && (
              <>
                {user ? (
                  <>
                    <span className="text-gray-700 hidden sm:inline">{user.fullName} ({user.role})</span>
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-blue-600 hover:underline text-sm">Вход</Link>
                    <Link to="/register" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Регистрация</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {children}
      </main>

      {/* Футер */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>© 2026 БПОУ ОО «Сибирский профессиональный колледж». Все права защищены.</p>
          <p>Разработчик: Стариков А.В.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;