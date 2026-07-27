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
        <h1 className="text-3xl font-bold mb-6">Виртуальные лаборатории</h1>
        <p className="text-gray-600 mb-8">
          Изолированные среды для выполнения практических заданий. Доступны только авторизованным пользователям.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="text-3xl mb-3">{lab.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{lab.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{lab.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lab.status === 'Доступна'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {lab.status}
                </span>
                {lab.status === 'Доступна' && (
                  <Link
                    to={`/virtual-labs/${lab.id}`}
                    className="text-blue-600 hover:underline text-sm"
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