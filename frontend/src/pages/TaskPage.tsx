import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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

  if (loading) return <Layout><div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div></Layout>;
  if (error || !task) return <Layout><div className="text-red-500 dark:text-red-400 text-center py-8">{error || 'Задание не найдено'}</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/courses" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
          ← Назад к курсам
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{task.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <p>Сложность: {task.difficulty} / 5</p>
          {task.timeLimit && <p>⏱️ Время: {task.timeLimit} мин</p>}
          {task.attemptsLimit && <p>📝 Попыток: {task.attemptsLimit}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ваш ответ</label>
            {task.type === 'TEXT' ? (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                className="w-full border rounded px-3 py-2 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ответ здесь..."
                required
              />
            ) : task.type === 'SQL_INJECTION' ? (
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full border rounded px-3 py-2 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите SQL-запрос..."
                required
              />
            ) : (
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full border rounded px-3 py-2 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ответ..."
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 transition"
          >
            {submitting ? 'Проверка...' : 'Отправить ответ'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded ${
            result.score !== undefined && result.score >= 70
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            <p className="font-semibold">{result.message}</p>
            {result.score !== undefined && <p>Оценка: {result.score}%</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskPage;