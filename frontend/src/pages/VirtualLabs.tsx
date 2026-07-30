import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const VirtualLabs = () => {
  const labs = [
    {
      id: 1,
      title: 'Виртуальная машина для криптографии',
      description: 'Окружение с предустановленными инструментами для шифрования и взлома.',
      status: 'Доступна',
      icon: '🔐',
    },
    {
      id: 2,
      title: 'Среда для SQL-инъекций',
      description: 'Изолированная база данных с учебными уязвимостями.',
      status: 'Доступна',
      icon: '🗄️',
    },
    {
      id: 3,
      title: 'Сетевая лаборатория',
      description: 'Виртуальная сеть с маршрутизаторами и хостами для анализа трафика.',
      status: 'В разработке',
      icon: '🌐',
    },
    {
      id: 4,
      title: 'Песочница для вредоносного ПО',
      description: 'Безопасная среда для анализа вредоносных программ.',
      status: 'В разработке',
      icon: '🛡️',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Виртуальные лаборатории</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Изолированные среды для выполнения практических заданий. Доступны только авторизованным пользователям.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition-colors duration-300">
              <div className="text-3xl mb-3">{lab.icon}</div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{lab.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{lab.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lab.status === 'Доступна'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {lab.status}
                </span>
                {lab.status === 'Доступна' && (
                  <Link
                    to={`/virtual-labs/${lab.id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Запустить →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default VirtualLabs;