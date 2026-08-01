import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  EyeIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface Task {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
  answerTemplate: string | null;
  htmlTemplate: string | null;
  expectedResult: string | null;
  creator: { fullName: string };
  groups: { group: { id: number; name: string } }[];
}

const SandboxPreview = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/sandbox/${taskId}`);
        setTask(res.data);
      } catch {
        setError('Ошибка загрузки задания');
      } finally {
        setLoading(false);
      }
    };
    if (taskId) fetchTask();
  }, [taskId]);

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Доступ запрещён</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Загрузка задания...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error || 'Задание не найдено'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Навигация */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <EyeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Предпросмотр задания
          </h1>
          <Link
            to="/teacher/sandbox"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад к управлению
          </Link>
        </div>

        {/* Баннер предпросмотра */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-6 rounded-r-xl flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Режим предпросмотра. Студенты увидят это задание так, как показано ниже.
          </p>
        </div>

        {/* Карточка задания */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {task.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            {task.description}
          </p>

          {task.instructions && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Инструкции
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-1">
                {task.instructions}
              </p>
            </div>
          )}

          {task.htmlTemplate && (
            <div className="border dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CodeBracketIcon className="w-4 h-4" />
                HTML-макет
              </div>
              <div className="p-3 dark:bg-gray-800/50 overflow-auto" style={{ maxHeight: '400px' }}>
                <div dangerouslySetInnerHTML={{ __html: task.htmlTemplate }} />
              </div>
            </div>
          )}

          {task.expectedResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg mt-4 flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-green-800 dark:text-green-300">Ожидаемый результат:</span>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">{task.expectedResult}</p>
              </div>
            </div>
          )}

          {/* Метаданные */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <DocumentDuplicateIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Тип:</span> {task.type}
            </div>
            <div className="flex items-center gap-1.5">
              <StarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Сложность:</span> {task.difficulty}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Баллы:</span> {task.points}
            </div>
            {task.timeLimit && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">⏱️</span> {task.timeLimit} мин
              </div>
            )}
            {task.attemptsLimit && (
              <div className="flex items-center gap-1.5">
                <DocumentDuplicateIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="font-medium">📝</span> {task.attemptsLimit} попыток
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SandboxPreview;