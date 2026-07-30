import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Labs = () => {
  const labs = [
    {
      id: 1,
      title: 'Шифрование и дешифрование',
      description: 'Практическое занятие по шифрованию текста с использованием различных алгоритмов.',
      duration: '45 мин',
      level: 'Начальный',
    },
    {
      id: 2,
      title: 'SQL-инъекции в веб-приложениях',
      description: 'Лабораторная работа по поиску и эксплуатации SQL-инъекций в учебном приложении.',
      duration: '60 мин',
      level: 'Средний',
    },
    {
      id: 3,
      title: 'XSS-атаки и защита',
      description: 'Изучение межсайтового скриптинга, создание защищённых форм.',
      duration: '45 мин',
      level: 'Средний',
    },
    {
      id: 4,
      title: 'Сетевая разведка и защита',
      description: 'Сканирование портов, анализ трафика, настройка файрволов.',
      duration: '90 мин',
      level: 'Продвинутый',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Лабораторные работы</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Пошаговые лабораторные работы для практического изучения тем. Выполняйте их в своём темпе.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{lab.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{lab.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>⏱️ {lab.duration}</span>
                <span>Уровень: {lab.level}</span>
              </div>
              <div className="mt-4">
                <Link
                  to={`/labs/${lab.id}`}
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Начать выполнение →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Labs;