import Layout from '../../components/Layout';
import {
  ShieldCheckIcon,
  InformationCircleIcon,
  UserGroupIcon,
  LockClosedIcon,
  UserMinusIcon,
  CakeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const Privacy = () => {
  const sections = [
    {
      title: '1. Сбор информации',
      icon: InformationCircleIcon,
      text: 'Мы собираем информацию, которую вы предоставляете при регистрации: ФИО, номер группы, а также данные о выполненных заданиях и активности на платформе.',
    },
    {
      title: '2. Использование информации',
      icon: UserGroupIcon,
      text: 'Информация используется для предоставления доступа к образовательным материалам, отслеживания прогресса, выдачи достижений и улучшения работы платформы.',
    },
    {
      title: '3. Защита информации',
      icon: LockClosedIcon,
      text: 'Мы принимаем разумные меры для защиты ваших данных от несанкционированного доступа, изменения или уничтожения. Пароли хранятся в зашифрованном виде.',
    },
    {
      title: '4. Передача третьим лицам',
      icon: UserMinusIcon,
      text: 'Мы не передаём ваши личные данные третьим лицам, за исключением случаев, предусмотренных законодательством.',
    },
    {
      title: '5. Файлы cookie',
      icon: CakeIcon,
      text: 'Платформа использует файлы cookie для обеспечения работы авторизации и улучшения пользовательского опыта. Вы можете отключить cookie в настройках браузера.',
    },
    {
      title: '6. Изменения политики',
      icon: DocumentTextIcon,
      text: 'Мы оставляем за собой право вносить изменения в данную политику. Обновлённая версия публикуется на этой странице.',
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Политика конфиденциальности
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          {/* Вступление */}
          <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Настоящая Политика конфиденциальности описывает, как платформа SPK CyberLab собирает, использует и защищает личную информацию пользователей.
            </p>
          </div>

          {/* Разделы */}
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
                    {section.text}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Дата обновления */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Дата последнего обновления: 01 сентября 2026 г.</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;