import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  htmlTemplate: string | null;
  expectedResult: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
}

interface Attempt {
  id: number;
  status: string;
  score: number | null;
  feedback: string | null;
  startedAt: string;
  completedAt: string | null;
}

const TaskExecution = () => {
  const { taskId, attemptId } = useParams<{ taskId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; status: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !attemptId) {
        setError('Неверный идентификатор задания или попытки');
        setLoading(false);
        return;
      }

      try {
        const taskRes = await api.get(`/sandbox/${taskId}`);
        setTask(taskRes.data);

        const attemptRes = await api.get(`/sandbox/attempts/${attemptId}`);
        setAttempt(attemptRes.data);

        if (attemptRes.data.status !== 'PENDING') {
          setResult({
            score: attemptRes.data.score || 0,
            feedback: attemptRes.data.feedback || 'Завершено',
            status: attemptRes.data.status,
          });
        }
      } catch (err) {
        setError('Ошибка загрузки данных задания');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, attemptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    if (!answer.trim()) {
      setError('Пожалуйста, введите ответ');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/sandbox/tasks/${taskId}/submit`, { answer });
      setResult({
        score: res.data.score,
        feedback: res.data.feedback,
        status: res.data.status,
      });
      const updatedAttempt = await api.get(`/sandbox/attempts/${attemptId}`);
      setAttempt(updatedAttempt.data);
    } catch (err) {
      let msg = 'Ошибка отправки ответа';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Загрузка...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-8">{error}</div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-8">Задание не найдено</div>
      </Layout>
    );
  }

  const isCompleted = result && result.status !== 'PENDING';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <button
            onClick={() => navigate('/sandbox')}
            className="text-blue-600 hover:underline"
          >
            ← К списку заданий
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-sm text-gray-500 space-y-1">
            <p>Тип: {task.type}</p>
            <p>Сложность: {task.difficulty}</p>
            <p>Баллы: {task.points}</p>
            {task.timeLimit && <p>⏱️ Время: {task.timeLimit} мин</p>}
            {task.attemptsLimit && <p>📝 Попыток: {task.attemptsLimit}</p>}
            {attempt && (
              <p>
                Статус попытки:{' '}
                <span
                  className={`font-medium ${
                    attempt.status === 'PENDING'
                      ? 'text-yellow-600'
                      : attempt.status === 'PASSED'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {attempt.status === 'PENDING' && 'В процессе'}
                  {attempt.status === 'PASSED' && 'Выполнено'}
                  {attempt.status === 'FAILED' && 'Неверно'}
                  {attempt.status === 'TIME_EXPIRED' && 'Время истекло'}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Описание</h2>
          <p className="text-gray-700">{task.description}</p>
          {task.instructions && (
            <div className="mt-4">
              <h3 className="font-medium">Инструкции:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
            </div>
          )}
        </div>

        {task.htmlTemplate && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Макет</h2>
            <div className="border rounded p-2 bg-gray-50 overflow-auto max-h-96">
              <div dangerouslySetInnerHTML={{ __html: task.htmlTemplate }} />
            </div>
          </div>
        )}

        {!isCompleted ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Ваш ответ</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                  Введите ответ
                </label>
                <textarea
                  id="answer"
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="mt-1 block w-full border rounded-md px-3 py-2 font-mono"
                  placeholder="Введите ваш ответ здесь..."
                  disabled={submitting}
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Результат</h2>
            <div
              className={`p-4 rounded ${
                result.status === 'PASSED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <p className="font-medium">Статус: {result.status === 'PASSED' ? '✅ Выполнено' : '❌ Неверно'}</p>
              <p>Баллы: {result.score}</p>
              {result.feedback && <p className="mt-2">{result.feedback}</p>}
            </div>
            <button
              onClick={() => navigate('/sandbox')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Вернуться к списку
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskExecution;