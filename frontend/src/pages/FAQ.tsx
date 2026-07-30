import Layout from '../components/Layout';

const FAQ = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Часто задаваемые вопросы</h1>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Как зарегистрироваться на платформе?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Регистрация доступна только для студентов и преподавателей колледжа.
              Студенты регистрируются через администратора или преподавателя,
              указывая номер в списке группы. Преподаватели создаются администратором.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Я забыл пароль. Что делать?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Обратитесь к администратору платформы или своему преподавателю.
              Они помогут сбросить пароль и восстановить доступ к аккаунту.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Как выполнять задания?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Зайдите в раздел «Курсы», выберите нужный курс, затем модуль и тему.
              В конце каждой темы есть задания. Введите ответ в поле и нажмите «Отправить».
              Система автоматически проверит ваш ответ.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Что такое CTF-полигон?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              CTF-полигон — это среда для отработки навыков кибербезопасности.
              Вы сможете выполнять задания по поиску уязвимостей, SQL-инъекциям,
              XSS и другим направлениям в безопасной изолированной среде.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Как получить достижения?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Достижения выдаются автоматически за выполнение определённых действий:
              регистрация, успешное выполнение заданий, активность в разделе мемов
              и высокие результаты.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Могу ли я предлагать мемы?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Да, если вы авторизованный пользователь. Перейдите в раздел «Мемная»,
              нажмите «+ Предложить мем», загрузите изображение или видео и отправьте
              на модерацию. Администратор одобрит или отклонит ваш мем.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Как отслеживать свой прогресс?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              В личном кабинете (раздел «Профиль») вы можете увидеть статистику:
              количество пройденных курсов, выполненных заданий, средний балл
              и полученные достижения.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;