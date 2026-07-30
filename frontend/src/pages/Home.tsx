import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import LatestNews from '../components/LatestNews';

const Home = () => {
  const { user } = useAuth();

  // Гостевая версия
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">Добро пожаловать в SPK CyberLab!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Отделение информационных технологий БПОУ ОО «СПК»<br />
            Интерактивная образовательная платформа
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded">
              Войти
            </Link>
            <Link to="/register" className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2 rounded">
              Зарегистрироваться
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Криптография</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Изучайте шифры и методы защиты информации</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
              <div className="text-3xl mb-2">🗄️</div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Базы данных</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Практика SQL и защита от инъекций</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Искусственный интеллект</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Основы машинного обучения и нейросетей</p>
            </div>
          </div>

          {/* Блок последних новостей (гостевая версия) */}
          <div className="mt-12 max-w-4xl mx-auto">
            <LatestNews />
          </div>

          <div className="mt-8">
            <Link to="/memes" className="text-blue-600 dark:text-blue-400 hover:underline text-lg">
              Посмотреть мемы →
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Авторизованная версия
  return (
    <Layout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Добро пожаловать, {user.fullName}!</h2>
        <p className="text-gray-600 dark:text-gray-400">Роль: {user.role}</p>
        {user.groupId && <p className="text-gray-600 dark:text-gray-400">Группа: {user.groupId}</p>}
        {user.studentNumber && <p className="text-gray-600 dark:text-gray-400">Номер по списку: {user.studentNumber}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/courses" className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition flex flex-col items-center text-center">
          <div className="text-4xl mb-2">📚</div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Мои курсы</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Просмотр доступных курсов</p>
        </Link>

        {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
          <Link to="/teacher/courses" className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Управление курсами</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Создавать и редактировать курсы</p>
          </Link>
        )}

        {user.role === 'ADMIN' && (
          <Link to="/admin" className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <div className="text-4xl mb-2">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Админ-панель</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Управление пользователями и группами</p>
          </Link>
        )}

        <Link to="/memes" className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition flex flex-col items-center text-center">
          <div className="text-4xl mb-2">😂</div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Мемы</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">IT-юмор и мемы</p>
        </Link>
      </div>

      {/* Блок последних новостей (авторизованная версия) */}
      <div className="mt-8">
        <LatestNews />
      </div>
    </Layout>
  );
};

export default Home;