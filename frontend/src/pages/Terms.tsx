import Layout from '../components/Layout';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ScaleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const Terms = () => {
  const sections = [
    {
      title: '1. Общие положения',
      icon: DocumentTextIcon,
      paragraphs: [
        '1.1. Использование Платформы означает полное согласие Пользователя с условиями настоящего Соглашения.',
        '1.2. Платформа предоставляет образовательные материалы, курсы, задания и другие инструменты для обучения.',
        '1.3. Доступ к некоторым функциям может быть ограничен в зависимости от роли пользователя (Гость, Студент, Преподаватель, Администратор).',
      ],
    },
    {
      title: '2. Права и обязанности Пользователя',
      icon: UserGroupIcon,
      paragraphs: [
        '2.1. Пользователь обязуется предоставлять достоверные данные при регистрации.',
        '2.2. Пользователь обязуется не передавать свои учётные данные третьим лицам.',
        '2.3. Пользователь имеет право использовать Платформу в образовательных целях, проходить курсы, выполнять задания, участвовать в геймификации и мемах.',
        '2.4. Пользователь не имеет права размещать контент, нарушающий законодательство РФ, нормы морали и этики.',
      ],
    },
    {
      title: '3. Права и обязанности Администрации',
      icon: ShieldCheckIcon,
      paragraphs: [
        '3.1. Администрация обеспечивает работу Платформы, предоставляет доступ к материалам, осуществляет модерацию и техническую поддержку.',
        '3.2. Администрация оставляет за собой право изменять содержание Платформы, удалять контент, нарушающий правила.',
        '3.3. Администрация не несёт ответственности за перерывы в работе, вызванные техническими сбоями.',
      ],
    },
    {
      title: '4. Интеллектуальная собственность',
      icon: LightBulbIcon,
      paragraphs: [
        '4.1. Все материалы, размещённые на Платформе, являются объектами интеллектуальной собственности их авторов и/или администрации.',
        '4.2. Пользователь не имеет права копировать, распространять или использовать материалы в коммерческих целях без разрешения.',
      ],
    },
    {
      title: '5. Ответственность',
      icon: ScaleIcon,
      paragraphs: [
        '5.1. Пользователь самостоятельно несёт ответственность за свои действия на Платформе.',
        '5.2. Администрация не несёт ответственности за убытки, возникшие в результате использования Платформы.',
        '5.3. В случае нарушения правил администрация может заблокировать доступ Пользователя.',
      ],
    },
    {
      title: '6. Заключительные положения',
      icon: ClipboardDocumentListIcon,
      paragraphs: [
        '6.1. Настоящее Соглашение вступает в силу с момента регистрации Пользователя.',
        '6.2. Администрация оставляет за собой право изменять Соглашение с уведомлением Пользователей через Платформу.',
        '6.3. Все споры решаются в соответствии с законодательством РФ.',
      ],
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Пользовательское соглашение
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-6">
          {/* Вступление */}
          <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Настоящее Пользовательское соглашение регулирует отношения между платформой SPK CyberLab (далее — «Платформа») и пользователями (далее — «Пользователь»).
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
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {section.title}
                  </h2>
                  <div className="mt-1 space-y-1 text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
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

export default Terms;