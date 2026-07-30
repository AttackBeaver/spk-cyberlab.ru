import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Practicums = () => {
  const practicums = [
    {
      id: 1,
      title: 'Основы криптографии',
      description: 'Практические задания по шифрам Цезаря, Виженера, RSA, хешированию.',
      tasksCount: 12,
      level: 'Начальный',
    },
    {
      id: 2,
      title: 'SQL-инъекции',
      description: 'Изучение уязвимостей SQL, выполнение инъекций, защита запросов.',
      tasksCount: 8,
      level: 'Средний',
    },
    {
      id: 3,
      title: 'XSS-атаки',
      description: 'Поиск и эксплуатация межсайтового скриптинга, защита приложений.',
      tasksCount: 6,
      level: 'Средний',
    },
    {
      id: 4,
      title: 'Сетевая безопасность',
      description: 'Анализ трафика, настройка файрволов, обнаружение вторжений.',
      tasksCount: 10,
      level: 'Продвинутый',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Практикумы</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Здесь собраны практические задания по различным темам. Выполняйте их, чтобы закрепить навыки.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practicums.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{p.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{p.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Заданий: {p.tasksCount}</span>
                <span>Уровень: {p.level}</span>
              </div>
              <div className="mt-4">
                <Link
                  to={`/practicums/${p.id}`}
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Перейти к заданиям →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Practicums;