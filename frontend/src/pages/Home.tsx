import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

const Home = () => {
  const { user } = useAuth();

  // Гостевая версия
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Добро пожаловать в SPK CyberLab!</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Отделение информационных технологий БПОУ ОО «СПК»<br />
            Интерактивная образовательная платформа
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Войти
            </Link>
            <Link to="/register" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Зарегистрироваться
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold">Криптография</h3>
              <p className="text-sm text-gray-500">Изучайте шифры и методы защиты информации</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🗄️</div>
              <h3 className="font-semibold">Базы данных</h3>
              <p className="text-sm text-gray-500">Практика SQL и защита от инъекций</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-semibold">Искусственный интеллект</h3>
              <p className="text-sm text-gray-500">Основы машинного обучения и нейросетей</p>
            </div>
          </div>
          <div className="mt-8">
            <Link to="/memes" className="text-blue-600 hover:underline text-lg">
              Посмотреть IT-мемы →
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Авторизованная версия
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">Добро пожаловать, {user.fullName}!</h2>
        <p className="text-gray-600">Роль: {user.role}</p>
        {user.groupId && <p className="text-gray-600">Группа: {user.groupId}</p>}
        {user.studentNumber && <p className="text-gray-600">Номер по списку: {user.studentNumber}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
          <div className="text-4xl mb-2">📚</div>
          <h3 className="text-lg font-semibold">Мои курсы</h3>
          <p className="text-gray-500 text-sm">Просмотр доступных курсов</p>
        </Link>

        {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
          <Link to="/teacher/courses" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="text-lg font-semibold">Управление курсами</h3>
            <p className="text-gray-500 text-sm">Создавать и редактировать курсы</p>
          </Link>
        )}

        {user.role === 'ADMIN' && (
          <Link to="/admin" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <div className="text-4xl mb-2">⚙️</div>
            <h3 className="text-lg font-semibold">Админ-панель</h3>
            <p className="text-gray-500 text-sm">Управление пользователями и группами</p>
          </Link>
        )}

        <Link to="/memes" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
          <div className="text-4xl mb-2">😂</div>
          <h3 className="text-lg font-semibold">Мемы</h3>
          <p className="text-gray-500 text-sm">IT-юмор и мемы</p>
        </Link>
      </div>
    </Layout>
  );
};

export default Home;