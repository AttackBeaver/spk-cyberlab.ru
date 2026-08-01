import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  CubeIcon,
  PlusCircleIcon,
  PlayIcon,
  UserIcon,
  ClockIcon,
  TrophyIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

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
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 5: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Очень лёгкая';
      case 2: return 'Лёгкая';
      case 3: return 'Средняя';
      case 4: return 'Сложная';
      case 5: return 'Очень сложная';
      default: return `${level}`;
    }
  };

  const handleStart = async (taskId: number) => {
    try {
      const taskRes = await api.get(`/sandbox/${taskId}`);
      const taskType = taskRes.data.type;
      const res = await api.post(`/sandbox/tasks/${taskId}/start`);
      const attemptId = res.data.attemptId;

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

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <CubeIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, войдите, чтобы просмотреть задания</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <CubeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Полигон — задания
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Практические задания по кибербезопасности
            </p>
          </div>
          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <Link
              to="/teacher/sandbox"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Управление заданиями
            </Link>
          )}
        </div>

        {/* Загрузка */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Загрузка заданий...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <CubeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Нет доступных заданий</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col group"
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                    {getDifficultyLabel(task.difficulty)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-1 line-clamp-2">
                  {task.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <HashtagIcon className="w-3.5 h-3.5" />
                    {getTypeLabel(task.type)}
                  </span>
                  {task.timeLimit && (
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {task.timeLimit} мин
                    </span>
                  )}
                  {task.attemptsLimit && (
                    <span className="inline-flex items-center gap-1">
                      <DocumentTextIcon className="w-3.5 h-3.5" />
                      {task.attemptsLimit} попыток
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <TrophyIcon className="w-3.5 h-3.5 text-yellow-500" />
                    {task.points} баллов
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" />
                    {task.creator.fullName}
                  </span>
                  <button
                    onClick={() => handleStart(task.id)}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Начать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SandboxTasks;