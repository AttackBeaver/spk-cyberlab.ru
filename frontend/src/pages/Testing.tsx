import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Testing = () => {
  const tests = [
    {
      id: 1,
      title: 'Основы криптографии',
      description: 'Проверка знаний по шифрам, хешированию и протоколам.',
      questions: 20,
      time: '30 мин',
    },
    {
      id: 2,
      title: 'Базы данных и SQL',
      description: 'Тестирование знаний по SQL-запросам, нормализации и индексам.',
      questions: 25,
      time: '40 мин',
    },
    {
      id: 3,
      title: 'Информационная безопасность',
      description: 'Вопросы по кибербезопасности, атакам и защите.',
      questions: 30,
      time: '45 мин',
    },
    {
      id: 4,
      title: 'Программирование (основы)',
      description: 'Тест по основам алгоритмов и структур данных.',
      questions: 20,
      time: '30 мин',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Тестирование</h1>
        <p className="text-gray-600 mb-8">
          Проверьте свои знания с помощью тестов по различным темам. Каждый тест содержит вопросы с выбором ответа.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{test.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Вопросов: {test.questions}</span>
                <span>⏱️ {test.time}</span>
              </div>
              <div className="mt-4">
                <Link
                  to={`/testing/${test.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Начать тест →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Testing;