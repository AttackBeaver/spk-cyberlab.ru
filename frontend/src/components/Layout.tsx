import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  hideAuth?: boolean;
}

const Layout = ({ children, hideAuth = false }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    window.location.href = '/';
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'system':
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Светлая';
      case 'dark':
        return 'Тёмная';
      case 'system':
        return 'Системная';
    }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Шапка */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Логотип SPK CyberLab" className="h-8 w-auto" />
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">SPK CyberLab</span>
          </Link>

          {/* Основное меню (десктоп и планшет) */}
          <nav className="hidden md:flex items-center space-x-4 text-sm">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Главная</Link>
            <Link to="/courses" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Курсы</Link>

            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/directions" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Направления</Link>
              <Link to="/sandbox" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Полигон</Link>
              <Link to="/memes" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Мемы</Link>
              <Link to="/bug-bounty" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">Bug Bounty</Link>
            </div>

            <div className="relative hidden md:block lg:hidden">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center whitespace-nowrap"
              >
                Ещё
                <svg
                  className={`ml-1 w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border dark:border-gray-700 z-20">
                  <Link
                    to="/directions"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Направления
                  </Link>
                  <Link
                    to="/sandbox"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Полигон
                  </Link>
                  <Link
                    to="/memes"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Мемы
                  </Link>
                  <Link
                    to="/bug-bounty"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Bug Bounty
                  </Link>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative group">
                <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer whitespace-nowrap">
                  Личный кабинет
                </Link>
              </div>
            ) : (
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">Вход</Link>
            )}

            {user?.role === 'TEACHER' && (
              <Link to="/teacher/courses" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">
                Панель преподавателя
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap">
                Админ-панель
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {/* Кнопка переключения темы */}
            <button
              onClick={cycleTheme}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Тема: ${getThemeLabel()}`}
            >
              {getThemeIcon()}
            </button>

            {!hideAuth && user && (
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline text-sm hidden md:inline"
              >
                Выйти
              </button>
            )}
            <button
              className="md:hidden text-gray-700 dark:text-gray-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <nav className="flex flex-col p-4 space-y-2 text-sm">
              <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Главная</Link>
              <Link to="/directions" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Направления</Link>
              <Link to="/courses" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Курсы</Link>
              <Link to="/sandbox" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Полигон</Link>
              <Link to="/memes" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Мемы</Link>
              <Link to="/bug-bounty" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Bug Bounty</Link>
              {user ? (
                <>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Личный кабинет</p>
                    <Link to="/profile" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Профиль</Link>
                    <Link to="/achievements" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Достижения</Link>
                    <Link to="/leaderboard" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Рейтинг</Link>
                  </div>
                  <button
                    onClick={() => {
                      cycleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <span>{getThemeIcon()}</span>
                    <span>Тема: {getThemeLabel()}</span>
                  </button>
                  <button onClick={handleLogout} className="text-red-600 hover:underline text-left">Выйти</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setIsMenuOpen(false)}>Вход</Link>
                  <button
                    onClick={() => {
                      cycleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <span>{getThemeIcon()}</span>
                    <span>Тема: {getThemeLabel()}</span>
                  </button>
                </>
              )}
              {user?.role === 'TEACHER' && (
                <Link to="/teacher/courses" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Панель преподавателя</Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Админ-панель</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm sm:text-base">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">О проекте</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><Link to="/about" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">О платформе</Link></li>
                <li><Link to="/directions" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Направления</Link></li>
                <li><Link to="/news" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Новости</Link></li>
                <li><Link to="/contacts" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Контакты</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Обучение</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><Link to="/courses" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Курсы</Link></li>
                <li><Link to="/practicums" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Практикумы</Link></li>
                <li><Link to="/labs" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Лабораторные</Link></li>
                <li><Link to="/testing" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Тестирование</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Ресурсы</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><Link to="/virtual-labs" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Виртуальные лаборатории</Link></li>
                <li><Link to="/sandbox" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Полигон</Link></li>
                <li><Link to="/knowledge" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">База знаний</Link></li>
                <li><Link to="/memes" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Мемы</Link></li>
                <li><Link to="/bug-bounty" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Bug Bounty</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Помощь</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><Link to="/faq" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">FAQ</Link></li>
                <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Политика конфиденциальности</Link></li>
                <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Пользовательское соглашение</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Контакты</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><a href="https://spk-55.ru/" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">spk-55.ru</a></li>
                <li><a href="https://github.com/AttackBeaver/spk-cyberlab.ru" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">GitHub</a></li>
                <li className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">644005, Омская область, г. Омск, ул. Добролюбова, 15</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 border-t dark:border-gray-700 pt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 БПОУ ОО «Сибирский профессиональный колледж». Все права защищены.</p>
            <p>Разработчик: Стариков А.В.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;