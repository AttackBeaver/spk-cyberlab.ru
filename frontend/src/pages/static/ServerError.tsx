import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ServerIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

const ServerError = () => {
  return (
    <Layout>
      <div className="relative flex flex-col items-center justify-center py-16 sm:py-24 text-center overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/20 dark:bg-red-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-3xl -z-10" />

        {/* Иконка 500 */}
        <div className="mb-6 p-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <ServerIcon className="w-20 h-20 text-red-500 dark:text-red-400" />
        </div>

        <h1 className="text-7xl sm:text-8xl font-extrabold text-red-400 dark:text-red-600 select-none">
          500
        </h1>
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">
          Внутренняя ошибка сервера
        </h2>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-md">
          Что-то пошло не так на нашей стороне. Мы уже работаем над устранением проблемы.
          Пожалуйста, попробуйте обновить страницу или вернуться позже.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Обновить страницу
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
          >
            <HomeIcon className="w-5 h-5" />
            На главную
          </Link>
        </div>

        {/* Дополнительный декоративный текст */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 select-none">
          Если ошибка повторяется, свяжитесь с администратором.
        </p>
      </div>
    </Layout>
  );
};

export default ServerError;