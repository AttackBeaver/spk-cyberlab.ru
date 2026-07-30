import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div className="text-center py-16">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Страница не найдена</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded transition"
        >
          На главную
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;