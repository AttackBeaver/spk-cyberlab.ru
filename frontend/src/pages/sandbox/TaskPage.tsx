import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
}

const TaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ score?: number; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}`);
        setTask(res.data);
      } catch (err) {
        setError('Ошибка загрузки задания');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (taskId) fetchTask();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/tasks/${taskId}/attempt`, {
        answer,
        userId: user?.id,
      });
      setResult(res.data);
    } catch (err) {
      setResult({ message: 'Ошибка при проверке задания' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
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
          <XCircleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error || 'Задание не найдено'}</p>
          <Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
            <ArrowLeftIcon className="w-4 h-4" />
            Вернуться к курсам
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Навигация назад */}
        <div className="mb-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад к курсам
          </Link>
        </div>

        {/* Основная карточка */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {task.title}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{task.description}</p>

          {/* Информационная панель */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">Сложность:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                task.difficulty <= 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                task.difficulty <= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                task.difficulty <= 4 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {task.difficulty} / 5
              </span>
            </div>
            {task.timeLimit && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">Время:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{task.timeLimit} мин</span>
              </div>
            )}
            {task.attemptsLimit && (
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">Попыток:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{task.attemptsLimit}</span>
              </div>
            )}
          </div>

          {/* Форма ответа */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ваш ответ
              </label>
              {task.type === 'TEXT' ? (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Введите ответ здесь..."
                  required
                />
              ) : task.type === 'SQL_INJECTION' ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CodeBracketIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Введите SQL-запрос..."
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Введите ответ..."
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Отправить ответ
                </>
              )}
            </button>
          </form>

          {/* Результат */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
                result.score !== undefined && result.score >= 70
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
              }`}
            >
              {result.score !== undefined && result.score >= 70 ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{result.message}</p>
                {result.score !== undefined && (
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    Оценка: <span className="font-bold text-lg">{result.score}%</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TaskPage;