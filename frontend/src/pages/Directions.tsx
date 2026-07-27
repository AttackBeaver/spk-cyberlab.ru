import Layout from '../components/Layout';

const Directions = () => {
  const directions = [
    {
      id: 'programming',
      title: 'Программирование',
      description: 'Изучение языков программирования, алгоритмов и структур данных. Разработка приложений и веб-сайтов.',
      icon: '💻',
    },
    {
      id: 'databases',
      title: 'Базы данных',
      description: 'Проектирование, создание и управление реляционными и NoSQL базами данных. Изучение SQL, нормализации, оптимизации запросов.',
      icon: '🗄️',
    },
    {
      id: 'cryptography',
      title: 'Криптография',
      description: 'Шифры, хеширование, цифровые подписи, протоколы обмена ключами. Практические задания по взлому и защите информации.',
      icon: '🔐',
    },
    {
      id: 'security',
      title: 'Информационная безопасность',
      description: 'Основы кибербезопасности, защита от атак, аудит безопасности, политики безопасности, защита персональных данных.',
      icon: '🛡️',
    },
    {
      id: 'ctf',
      title: 'CTF (Capture The Flag)',
      description: 'Соревнования по кибербезопасности. Решение задач на взлом, криптоанализ, форензику и обратную разработку.',
      icon: '🏁',
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Направления обучения</h1>
        <p className="text-gray-600 mb-8">
          Выберите направление, которое вас интересует, и начните обучение.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {directions.map((dir) => (
            <div key={dir.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="text-4xl mb-3">{dir.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{dir.title}</h2>
              <p className="text-gray-600 text-sm">{dir.description}</p>
              <div className="mt-4">
                <a
                  href={`/courses?direction=${dir.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Перейти к курсам →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Directions;