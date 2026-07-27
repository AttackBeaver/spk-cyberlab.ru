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
    return <Layout><div className="text-red-500">Доступ запрещён</div></Layout>;
  }

  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error || !task) return <Layout><div className="text-red-500">{error || 'Задание не найдено'}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Предпросмотр задания</h1>
          <Link to="/teacher/sandbox" className="text-blue-600 hover:underline">← Назад к управлению</Link>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-800">Режим предпросмотра. Студенты увидят это задание так, как показано ниже.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
          <p className="text-gray-600 mb-4">{task.description}</p>
          {task.instructions && (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-medium">Инструкции</h3>
              <p className="text-gray-700">{task.instructions}</p>
            </div>
          )}
          {task.htmlTemplate && (
            <div className="border rounded mb-4 overflow-auto" style={{ maxHeight: '400px' }}>
              <div className="bg-gray-100 px-2 py-1 text-xs text-gray-500">HTML-макет</div>
              <div className="p-2" dangerouslySetInnerHTML={{ __html: task.htmlTemplate }} />
            </div>
          )}
          {task.expectedResult && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
              <p className="text-green-800"><span className="font-semibold">Ожидаемый результат:</span> {task.expectedResult}</p>
            </div>
          )}
          <div className="text-xs text-gray-400 mt-4">
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