import Layout from '../../components/Layout';
import {
  AcademicCapIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  CodeBracketIcon,
  FaceSmileIcon,
  TrophyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const About = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
          <AcademicCapIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          О платформе
        </h1>

        {/* Вступление */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <ComputerDesktopIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Добро пожаловать в SPK CyberLab!
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            SPK CyberLab — это интерактивная образовательная среда, созданная для студентов и преподавателей
            БПОУ ОО «Сибирский профессиональный колледж». Платформа предназначена для практического изучения
            информационной безопасности, криптографии, баз данных, программирования и других IT-дисциплин.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Наша цель — предоставить студентам прочный фундамент теоретических знаний и практических навыков,
            необходимых для успешной адаптации к современным реалиям и достижения профессиональных высот.
          </p>
        </div>

        {/* О колледже */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            О Сибирском профессиональном колледже
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
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

        {/* Что вы найдёте на платформе — сетка с иконками */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <CodeBracketIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Что вы найдёте на платформе
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Курсы и модули</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Структурированные материалы по IT-дисциплинам</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CodeBracketIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Практические задания</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">С автоматической проверкой ответов</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaceSmileIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Мемы и юмор</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">IT-юмор для разрядки и вовлечения</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrophyIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Достижения и рейтинг</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Геймификация для мотивации</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <UserCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">Личный кабинет</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Отслеживание прогресса и статистика</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;