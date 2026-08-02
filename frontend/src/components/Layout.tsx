import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  HomeIcon,
  BookOpenIcon,
  CubeIcon,
  FaceSmileIcon,
  ShieldCheckIcon,
  KeyIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Эффект для изменения стиля шапки при скролле
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Определяем активную ссылку для подсветки
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Шапка */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg'
            : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-sm'
        } border-b border-gray-200/50 dark:border-gray-700/50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img
                src="/logo.png"
                alt="SPK CyberLab"
                className="h-9 w-auto transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                SPK CyberLab
              </span>
            </Link>

            {/* Десктопное меню */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <HomeIcon className="w-4 h-4" />
                  Главная
                </span>
              </Link>
              <Link
                to="/courses"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/courses')
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpenIcon className="w-4 h-4" />
                  Курсы
                </span>
              </Link>

              {/* Ссылки для больших экранов */}
              <div className="hidden lg:flex items-center space-x-1">
                <Link
                  to="/sandbox"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/sandbox')
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CubeIcon className="w-4 h-4" />
                    Полигон
                  </span>
                </Link>
                <Link
                  to="/memes"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/memes')
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FaceSmileIcon className="w-4 h-4" />
                    Мемы
                  </span>
                </Link>
                <Link
                  to="/bug-bounty"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/bug-bounty')
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Bug Bounty
                  </span>
                </Link>
                {/* Криптолаборатория */}
                <Link
                  to="/cryptolab"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/cryptolab')
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <KeyIcon className="w-4 h-4" />
                    Криптолаба
                  </span>
                </Link>
              </div>

              {/* Выпадающее меню "Ещё" для средних экранов */}
              <div className="relative hidden md:block lg:hidden">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    isDropdownOpen
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70'
                  }`}
                >
                  Ещё
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-1 z-20 animate-fadeIn">
                    <Link
                      to="/sandbox"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <CubeIcon className="w-4 h-4" />
                      Полигон
                    </Link>
                    <Link
                      to="/memes"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaceSmileIcon className="w-4 h-4" />
                      Мемы
                    </Link>
                    <Link
                      to="/bug-bounty"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                      Bug Bounty
                    </Link>
                    <Link
                      to="/cryptolab"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <KeyIcon className="w-4 h-4" />
                      Криптолаба
                    </Link>
                  </div>
                )}
              </div>

              {/* Профиль / Вход */}
              <div className="flex items-center space-x-2">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive('/profile')
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <UserCircleIcon className="w-4 h-4" />
                        Профиль
                      </span>
                    </Link>
                    {/* Ролевые ссылки */}
                    {user.role === 'TEACHER' && (
                      <Link
                        to="/teacher/courses"
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <AcademicCapIcon className="w-4 h-4" />
                          Преподаватель
                        </span>
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <Cog6ToothIcon className="w-4 h-4" />
                          Админ
                        </span>
                      </Link>
                    )}
                    {!hideAuth && (
                      <button
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          Выйти
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Вход
                      </span>
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <span className="flex items-center gap-1.5">
                        <UserPlusIcon className="w-4 h-4" />
                        Регистрация
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </nav>

            {/* Правая часть: тема + мобильное меню */}
            <div className="flex items-center gap-3">
              <button
                onClick={cycleTheme}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors relative group"
                title={`Тема: ${getThemeLabel()}`}
              >
                {getThemeIcon()}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {getThemeLabel()}
                </span>
              </button>

              <button
                className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Мобильное меню (анимированное) */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-3 space-y-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <HomeIcon className="w-5 h-5" />
              Главная
            </Link>
            <Link
              to="/courses"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpenIcon className="w-5 h-5" />
              Курсы
            </Link>
            <Link
              to="/sandbox"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <CubeIcon className="w-5 h-5" />
              Полигон
            </Link>
            <Link
              to="/memes"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <FaceSmileIcon className="w-5 h-5" />
              Мемы
            </Link>
            <Link
              to="/bug-bounty"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              Bug Bounty
            </Link>
            {/* Криптолаборатория в мобильном меню */}
            <Link
              to="/cryptolab"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <KeyIcon className="w-5 h-5" />
              Криптолаборатория
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  Профиль
                </Link>
                {user.role === 'TEACHER' && (
                  <Link
                    to="/teacher/courses"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <AcademicCapIcon className="w-5 h-5" />
                    Панель преподавателя
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    Админ-панель
                  </Link>
                )}
                <button
                  onClick={() => {
                    cycleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all w-full"
                >
                  {getThemeIcon()}
                  <span>Тема: {getThemeLabel()}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all w-full"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Регистрация
                </Link>
                <button
                  onClick={() => {
                    cycleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all w-full"
                >
                  {getThemeIcon()}
                  <span>Тема: {getThemeLabel()}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {children}
      </main>

      {/* Футер */}
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                О проекте
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    О платформе
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Новости
                  </Link>
                </li>
                <li>
                  <Link to="/contacts" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                Обучение
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Курсы
                  </Link>
                </li>
                {/* Криптолаборатория в футере */}
                <li>
                  <Link to="/cryptolab" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Криптолаборатория
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                Ресурсы
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/sandbox" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Полигон
                  </Link>
                </li>
                <li>
                  <Link to="/memes" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Мемы
                  </Link>
                </li>
                <li>
                  <Link to="/bug-bounty" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Bug Bounty
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                Помощь
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/faq" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Пользовательское соглашение
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                Контакты
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://spk-55.ru/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    spk-55.ru
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/AttackBeaver/spk-cyberlab.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li className="text-gray-500 dark:text-gray-500 text-xs">
                  644005, Омская обл.,<br />г. Омск, ул. Добролюбова, 15
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200/70 dark:border-gray-700/70 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 БПОУ ОО «Сибирский профессиональный колледж». Все права защищены.</p>
            <p className="mt-1">Разработчик: Стариков А.В.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;