import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import LatestNews from '../components/LatestNews';
import {
  BookOpenIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
  CubeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  // Гостевая версия (упрощённая, без тяжёлых эффектов)
  if (!user) {
    return (
      <Layout>
        <div className="py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3">
              Добро пожаловать в SPK CyberLab!
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Отделение информационных технологий БПОУ ОО «СПК»<br />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Интерактивная образовательная платформа
              </span>
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow transition-colors"
              >
                Зарегистрироваться
              </Link>
            </div>

            {/* Карточки направлений */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg">
                <div className="text-3xl mb-2">🔐</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Криптография</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Изучайте шифры и методы защиты информации</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg">
                <div className="text-3xl mb-2">🗄️</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Базы данных</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Практика SQL и защита от инъекций</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition hover:shadow-lg">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Искусственный интеллект</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Основы машинного обучения и нейросетей</p>
              </div>
            </div>

            {/* Блок новостей */}
            <div className="mt-12 max-w-4xl mx-auto">
              <LatestNews />
            </div>

            <div className="mt-6">
              <Link
                to="/memes"
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Посмотреть мемы
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Авторизованная версия (оставляем как есть, она уже хороша)
  return (
    <Layout>
      <div className="space-y-8">
        {/* Приветственный блок */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-100/50 dark:border-blue-800/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-2xl -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-2xl -z-10" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">
              Добро пожаловать, <span className="text-blue-600 dark:text-blue-400">{user.fullName}</span>!
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {user.role === 'ADMIN' ? '👑 Администратор' : user.role === 'TEACHER' ? '👨‍🏫 Преподаватель' : '👨‍🎓 Студент'}
              </span>
              {user.groupId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  Группа: {user.groupId}
                </span>
              )}
              {user.studentNumber && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  № {user.studentNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Карточки действий */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/courses"
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
              <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Мои курсы</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Просмотр доступных курсов</p>
          </Link>

          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <Link
              to="/teacher/courses"
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
            >
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Управление курсами</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Создавать и редактировать курсы</p>
            </Link>
          )}

          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
            >
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                <Cog6ToothIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Админ-панель</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Управление пользователями и группами</p>
            </Link>
          )}

          <Link
            to="/memes"
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
          >
            <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/50 transition-colors">
              <FaceSmileIcon className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Мемы</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">IT-юмор и мемы</p>
          </Link>

          <Link
            to="/sandbox"
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
          >
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
              <CubeIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Полигон</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Практические задания</p>
          </Link>

          <Link
            to="/bug-bounty"
            className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center"
          >
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
              <ShieldCheckIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Bug Bounty</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Поиск уязвимостей</p>
          </Link>
        </div>

        {/* Новости */}
        <div className="mt-8">
          <LatestNews />
        </div>
      </div>
    </Layout>
  );
};

export default Home;