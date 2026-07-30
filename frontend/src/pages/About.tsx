import Layout from '../components/Layout';

const About = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">О платформе</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Добро пожаловать в SPK CyberLab!</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            SPK CyberLab — это интерактивная образовательная среда, созданная для студентов и преподавателей
            БПОУ ОО «Сибирский профессиональный колледж». Платформа предназначена для практического изучения
            информационной безопасности, криптографии, баз данных, программирования и других IT-дисциплин.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Наша цель — предоставить студентам прочный фундамент теоретических знаний и практических навыков,
            необходимых для успешной адаптации к современным реалиям и достижения профессиональных высот.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">О Сибирском профессиональном колледже</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Сибирский профессиональный колледж — это современное образовательное учреждение с богатой историей
            и сложившимися традициями, где каждый студент имеет возможность получить качественное
            профессиональное образование, востребованное на рынке труда.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Колледж ставит своей главной целью подготовку не просто специалистов, а квалифицированных,
            образованных, творчески мыслящих профессионалов, способных эффективно работать в условиях
            динамично меняющейся экономической и социальной среды.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Что вы найдёте на платформе</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li><span className="font-medium">Курсы и модули</span> — структурированные материалы по IT-дисциплинам</li>
            <li><span className="font-medium">Практические задания</span> — с автоматической проверкой ответов</li>
            <li><span className="font-medium">Мемы и юмор</span> — IT-юмор для разрядки и вовлечения</li>
            <li><span className="font-medium">Достижения и рейтинг</span> — геймификация для мотивации</li>
            <li><span className="font-medium">Личный кабинет</span> — отслеживание прогресса и статистика</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default About;