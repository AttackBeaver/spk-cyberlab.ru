import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
    return <Layout><div className="text-red-500 dark:text-red-400">Доступ запрещён</div></Layout>;
  }

  if (loading) return <Layout><div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div></Layout>;
  if (error || !task) return <Layout><div className="text-red-500 dark:text-red-400">{error || 'Задание не найдено'}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Предпросмотр задания</h1>
          <Link to="/teacher/sandbox" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
            ← Назад к управлению
          </Link>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-200">Режим предпросмотра. Студенты увидят это задание так, как показано ниже.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 transition-colors duration-300">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{task.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
          {task.instructions && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded mb-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Инструкции</h3>
              <p className="text-gray-700 dark:text-gray-300">{task.instructions}</p>
            </div>
          )}
          {task.htmlTemplate && (
            <div className="border dark:border-gray-700 rounded mb-4 overflow-auto" style={{ maxHeight: '400px' }}>
              <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">HTML-макет</div>
              <div className="p-2 dark:bg-gray-800" dangerouslySetInnerHTML={{ __html: task.htmlTemplate }} />
            </div>
          )}
          {task.expectedResult && (
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 p-4 mt-4">
              <p className="text-green-800 dark:text-green-200">
                <span className="font-semibold">Ожидаемый результат:</span> {task.expectedResult}
              </p>
            </div>
          )}
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Тип: {task.type} | Сложность: {task.difficulty} | Баллы: {task.points}
            {task.timeLimit && ` | ⏱️ ${task.timeLimit} мин`}
            {task.attemptsLimit && ` | 📝 ${task.attemptsLimit} попыток`}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SandboxPreview;