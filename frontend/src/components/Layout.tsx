import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  hideAuth?: boolean;
}

const Layout = ({ children, hideAuth = false }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Логотип SPK CyberLab" className="h-8 w-auto" />
            <span className="text-xl font-bold text-blue-600">SPK CyberLab</span>
            <span className="text-xs text-gray-500 hidden sm:inline">| Образовательная платформа</span>
          </Link>

          {/* Основное меню (десктоп) */}
          <nav className="hidden md:flex items-center space-x-4 text-sm">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Главная</Link>
            <Link to="/courses" className="text-gray-700 hover:text-blue-600">Курсы</Link>
            <Link to="/practicums" className="text-gray-700 hover:text-blue-600">Практикумы</Link>
            <Link to="/labs" className="text-gray-700 hover:text-blue-600">Лабораторные</Link>
            <Link to="/ctf-polygon" className="text-gray-700 hover:text-blue-600">CTF-полигон</Link>
            <Link to="/memes" className="text-gray-700 hover:text-blue-600">Мемы</Link>

            {user ? (
              <div className="relative group">
                <span className="text-gray-700 hover:text-blue-600 cursor-pointer">Личный кабинет</span>
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Профиль</Link>
                  <Link to="/achievements" className="block px-4 py-2 hover:bg-gray-100">Достижения</Link>
                  <Link to="/leaderboard" className="block px-4 py-2 hover:bg-gray-100">Рейтинг</Link>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-blue-600 hover:underline">Вход</Link>
            )}

            {user?.role === 'TEACHER' && (
              <Link to="/teacher/courses" className="text-gray-700 hover:text-blue-600">Панель преподавателя</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600">Админ-панель</Link>
            )}
          </nav>

          {/* Правая часть: бургер и выход для авторизованных */}
          <div className="flex items-center space-x-3">
            {!hideAuth && user && (
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline text-sm hidden md:inline"
              >
                Выйти
              </button>
            )}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Мобильное меню (бургер) */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <nav className="flex flex-col p-4 space-y-2 text-sm">
              <Link to="/" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Главная</Link>
              <Link to="/courses" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Курсы</Link>
              <Link to="/practicums" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Практикумы</Link>
              <Link to="/labs" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Лабораторные</Link>
              <Link to="/ctf-polygon" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>CTF-полигон</Link>
              <Link to="/memes" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Мемы</Link>
              {user ? (
                <>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-xs">Личный кабинет</p>
                    <Link to="/profile" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Профиль</Link>
                    <Link to="/achievements" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Достижения</Link>
                    <Link to="/leaderboard" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Рейтинг</Link>
                  </div>
                  <button onClick={handleLogout} className="text-red-600 hover:underline text-left">Выйти</button>
                </>
              ) : (
                <Link to="/login" className="text-blue-600 hover:underline" onClick={() => setIsMenuOpen(false)}>Вход</Link>
              )}
              {user?.role === 'TEACHER' && (
                <Link to="/teacher/courses" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Панель преподавателя</Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Админ-панель</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {children}
      </main>

      {/* Футер с второстепенными ссылками */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">О проекте</h3>
              <ul className="space-y-1">
                <li><Link to="/about" className="text-gray-500 hover:text-blue-600">О платформе</Link></li>
                <li><Link to="/directions" className="text-gray-500 hover:text-blue-600">Направления</Link></li>
                <li><Link to="/news" className="text-gray-500 hover:text-blue-600">Новости</Link></li>
                <li><Link to="/contacts" className="text-gray-500 hover:text-blue-600">Контакты</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Обучение</h3>
              <ul className="space-y-1">
                <li><Link to="/courses" className="text-gray-500 hover:text-blue-600">Курсы</Link></li>
                <li><Link to="/practicums" className="text-gray-500 hover:text-blue-600">Практикумы</Link></li>
                <li><Link to="/labs" className="text-gray-500 hover:text-blue-600">Лабораторные</Link></li>
                <li><Link to="/testing" className="text-gray-500 hover:text-blue-600">Тестирование</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Ресурсы</h3>
              <ul className="space-y-1">
                <li><Link to="/virtual-labs" className="text-gray-500 hover:text-blue-600">Виртуальные лаборатории</Link></li>
                <li><Link to="/ctf-polygon" className="text-gray-500 hover:text-blue-600">CTF-полигон</Link></li>
                <li><Link to="/knowledge" className="text-gray-500 hover:text-blue-600">База знаний</Link></li>
                <li><Link to="/memes" className="text-gray-500 hover:text-blue-600">Мемы</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Помощь</h3>
              <ul className="space-y-1">
                <li><Link to="/faq" className="text-gray-500 hover:text-blue-600">FAQ</Link></li>
                <li><Link to="/privacy" className="text-gray-500 hover:text-blue-600">Политика конфиденциальности</Link></li>
                <li><Link to="/terms" className="text-gray-500 hover:text-blue-600">Пользовательское соглашение</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Контакты</h3>
              <ul className="space-y-1">
                <li><a href="https://spk-55.ru/" className="text-gray-500 hover:text-blue-600">spk-55.ru</a></li>
                <li><a href="https://t.me/attack_beaver" className="text-gray-500 hover:text-blue-600">@attack_beaver</a></li>
                <li><span className="text-gray-500">644005 Омская область, г. Омск, ул. Добролюбова, 15</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
            <p>© 2026 БПОУ ОО «Сибирский профессиональный колледж». Все права защищены.</p>
            <p>Разработчик: Стариков А.В.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;