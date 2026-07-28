import Layout from '../components/Layout';

const Contacts = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Контакты</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Адрес</h2>
            <p className="text-gray-700">
              БПОУ ОО «Сибирский профессиональный колледж»<br />
              644005, Омская область, г. Омск, ул. Добролюбова, 15
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Контакты</h2>
            <p className="text-gray-700">
              <span className="font-medium">Сайт:</span> <a href="https://spk-55.ru/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">spk-55.ru</a><br />
              <span className="font-medium">Разработчик:</span> <a href="https://t.me/attack_beaver" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">@attack_beaver</a><br />           
              <span className="font-medium">GitHub:</span> <a href="https://github.com/AttackBeaver/spk-cyberlab.ru" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">AttackBeaver/spk-cyberlab.ru</a>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Разработчик платформы</h2>
            <p className="text-gray-700">
              <span className="font-medium">Стариков Александр Владимирович,</span><br />
              Преподаватель<br />
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Режим работы колледжа</h2>
            <p className="text-gray-700">
            Понедельник - Пятница с 8:00 до 19:00<br />
            Суббота с 8:00 до 15:30<br />
            Воскресенье - выходной
          </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacts;