import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface SandboxTask {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
  creator: { fullName: string };
  groups: { group: { id: number; name: string } }[];
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const SandboxTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SandboxTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/sandbox');
        setTasks(res.data);
      } catch {
        setError('Ошибка загрузки заданий');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTasks();
  }, [user]);

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SQL_INJECTION: 'SQL-инъекция',
      XSS: 'XSS-атака',
      PHISHING: 'Фишинг',
      CODE: 'Программирование',
      DATABASE: 'База данных',
      CUSTOM: 'Кастомное',
    };
    return map[type] || type;
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 5: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleStart = async (taskId: number) => {
    try {
      // Получаем тип задания
      const taskRes = await api.get(`/sandbox/${taskId}`);
      const taskType = taskRes.data.type;
      
      // Начинаем попытку
      const res = await api.post(`/sandbox/tasks/${taskId}/start`);
      const attemptId = res.data.attemptId;

      // Перенаправляем в зависимости от типа
      if (taskType === 'DATABASE') {
        navigate(`/sandbox/sql/task/${taskId}/attempt/${attemptId}`);
      } else {
        navigate(`/sandbox/task/${taskId}/attempt/${attemptId}`);
      }
    } catch (err) {
      let msg = 'Ошибка начала задания';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as ApiError;
        msg = errObj.response?.data?.error || msg;
      }
      alert(msg);
    }
  };

  if (!user) return <Layout><div className="text-center py-8 text-gray-700 dark:text-gray-300">Пожалуйста, войдите</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Полигон — задания</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Здесь вы можете выполнять практические задания по кибербезопасности.</p>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center py-8">{error}</div>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Нет доступных заданий</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 hover:shadow-lg transition-colors duration-300">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{task.title}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                    Сложность {task.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{task.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="inline-block mr-3">Тип: {getTypeLabel(task.type)}</span>
                  {task.timeLimit && <span className="mr-3">⏱️ {task.timeLimit} мин</span>}
                  {task.attemptsLimit && <span>📝 {task.attemptsLimit} попыток</span>}
                  <span className="ml-3">🏆 {task.points} баллов</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Автор: {task.creator.fullName}</span>
                  <button
                    onClick={() => handleStart(task.id)}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Начать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
          <div className="mt-8 text-center">
            <Link
              to="/teacher/sandbox"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
            >
              Управление заданиями (для преподавателей)
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SandboxTasks;