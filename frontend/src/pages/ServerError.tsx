import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const ServerError = () => {
  return (
    <Layout>
      <div className="text-center py-16">
        <h1 className="text-6xl font-bold text-red-300 mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-4">Внутренняя ошибка сервера</h2>
        <p className="text-gray-600 mb-8">
          Что-то пошло не так на нашей стороне. Мы уже работаем над устранением проблемы.
          Пожалуйста, попробуйте обновить страницу или вернуться позже.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Обновить страницу
          </button>
          <Link
            to="/"
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 inline-block"
          >
            На главную
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ServerError;