import Layout from '../components/Layout';
import {
  MapPinIcon,
  GlobeAltIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Contacts = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <MapPinIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Контакты
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Адрес */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mb-3">
              <MapPinIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Адрес</h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              БПОУ ОО «Сибирский профессиональный колледж»<br />
              644005, Омская область, г. Омск, ул. Добролюбова, 15
            </p>
          </div>

          {/* Контакты */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col items-start">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-3">
              <GlobeAltIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Контакты</h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium">Сайт:</span>{' '}
                <a
                  href="https://spk-55.ru/"
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  spk-55.ru
                </a>
              </p>
              <p>
                <span className="font-medium">Telegram:</span>{' '}
                <a
                  href="https://t.me/attack_beaver"
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @attack_beaver
                </a>
              </p>
              <p>
                <span className="font-medium">GitHub:</span>{' '}
                <a
                  href="https://github.com/AttackBeaver/spk-cyberlab.ru"
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AttackBeaver/spk-cyberlab.ru
                </a>
              </p>
            </div>
          </div>

          {/* Разработчик */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col items-start">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mb-3">
              <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Разработчик платформы</h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <span className="font-medium">Стариков Александр Владимирович</span>
              <br />
              Преподаватель
            </p>
          </div>

          {/* Режим работы */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col items-start sm:col-span-2 lg:col-span-1">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full mb-3">
              <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Режим работы колледжа</h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Пн – Пт: 8:00 – 19:00<br />
              Сб: 8:00 – 15:30<br />
              Вс: выходной
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacts;