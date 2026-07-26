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
              644116, Омская область, г. Омск,<br />
              ул. 2-я Солнечная, 35а
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Контакты</h2>
            <p className="text-gray-700">
              <span className="font-medium">Телефон:</span> +7 (3812) 20-41-41<br />
              <span className="font-medium">E-mail:</span> spk55@mail.ru<br />
              <span className="font-medium">Сайт:</span> <a href="https://spk-55.ru/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">spk-55.ru</a>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Разработчик платформы</h2>
            <p className="text-gray-700">
              <span className="font-medium">Стариков Александр Владимирович</span><br />
              Преподаватель, разработчик платформы<br />
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Режим работы колледжа</h2>
            <p className="text-gray-700">
            Пн–Пт: 8:00 – 17:00 (обед: 12:00 – 13:00)<br />
            Сб–Вс: выходной
          </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacts;