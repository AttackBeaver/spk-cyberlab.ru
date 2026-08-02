import Layout from '../../components/Layout';
import {
  QuestionMarkCircleIcon,
  KeyIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  TrophyIcon,
  FaceSmileIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const FAQ = () => {
  const faqs = [
    {
      question: 'Как зарегистрироваться на платформе?',
      answer:
        'Регистрация доступна только для студентов и преподавателей колледжа. Студенты регистрируются через администратора или преподавателя, указывая номер в списке группы. Преподаватели создаются администратором.',
      icon: KeyIcon,
    },
    {
      question: 'Я забыл пароль. Что делать?',
      answer:
        'Обратитесь к администратору платформы или своему преподавателю. Они помогут сбросить пароль и восстановить доступ к аккаунту.',
      icon: QuestionMarkCircleIcon,
    },
    {
      question: 'Как выполнять задания?',
      answer:
        'Зайдите в раздел «Курсы», выберите нужный курс, затем модуль и тему. В конце каждой темы есть задания. Введите ответ в поле и нажмите «Отправить». Система автоматически проверит ваш ответ.',
      icon: PencilSquareIcon,
    },
    {
      question: 'Что такое CTF-полигон?',
      answer:
        'CTF-полигон — это среда для отработки навыков кибербезопасности. Вы сможете выполнять задания по поиску уязвимостей, SQL-инъекциям, XSS и другим направлениям в безопасной изолированной среде.',
      icon: ShieldCheckIcon,
    },
    {
      question: 'Как получить достижения?',
      answer:
        'Достижения выдаются автоматически за выполнение определённых действий: регистрация, успешное выполнение заданий, активность в разделе мемов и высокие результаты.',
      icon: TrophyIcon,
    },
    {
      question: 'Могу ли я предлагать мемы?',
      answer:
        'Да, если вы авторизованный пользователь. Перейдите в раздел «Мемная», нажмите «+ Предложить мем», загрузите изображение или видео и отправьте на модерацию. Администратор одобрит или отклонит ваш мем.',
      icon: FaceSmileIcon,
    },
    {
      question: 'Как отслеживать свой прогресс?',
      answer:
        'В личном кабинете (раздел «Профиль») вы можете увидеть статистику: количество пройденных курсов, выполненных заданий, средний балл и полученные достижения.',
      icon: ChartBarIcon,
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <QuestionMarkCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Часто задаваемые вопросы
        </h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const IconComponent = faq.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;