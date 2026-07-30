import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Knowledge = () => {
  const articles = [
    {
      id: 1,
      title: 'Что такое криптография?',
      description: 'Введение в криптографию, основные понятия и история.',
      category: 'Криптография',
    },
    {
      id: 2,
      title: 'Основы SQL',
      description: 'SELECT, INSERT, UPDATE, DELETE — базовые операции с данными.',
      category: 'Базы данных',
    },
    {
      id: 3,
      title: 'XSS: что это и как защититься',
      description: 'Межсайтовый скриптинг, виды атак и методы защиты.',
      category: 'Безопасность',
    },
    {
      id: 4,
      title: 'Алгоритмы шифрования',
      description: 'Обзор симметричных и асимметричных алгоритмов шифрования.',
      category: 'Криптография',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">База знаний</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Справочные материалы, статьи и руководства по различным темам IT.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition">
              <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded mb-2">
                {article.category}
              </span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{article.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{article.description}</p>
              <Link
                to={`/knowledge/${article.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                Подробнее →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Knowledge;