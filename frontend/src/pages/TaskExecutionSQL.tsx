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
  config: {
    schema: string;
    data: Record<string, unknown[]>;
    expectedResult?: string;
    hint?: string;
  } | null;
}

interface Attempt {
  id: number;
  status: string;
  score: number | null;
  feedback: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

type QueryResultRow = Record<string, string | number | boolean | null>;

const TaskExecutionSQL = () => {
  const { taskId, attemptId } = useParams<{ taskId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResultRow[] | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; status: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !attemptId) {
        setError('Неверный идентификатор');
        setLoading(false);
        return;
      }

      try {
        const taskRes = await api.get(`/sandbox/${taskId}`);
        setTask(taskRes.data);

        const attemptRes = await api.get(`/sandbox/attempts/${attemptId}`);
        setAttempt(attemptRes.data);

        await api.post(`/sandbox/tasks/${taskId}/sql/init`);

        if (attemptRes.data.status !== 'PENDING') {
          setResult({
            score: attemptRes.data.score || 0,
            feedback: attemptRes.data.feedback || 'Завершено',
            status: attemptRes.data.status,
          });
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, attemptId]);

  const handleExecuteQuery = async () => {
    if (!taskId || !query.trim()) return;
    setExecuting(true);
    setError('');
    try {
      const res = await api.post(`/sandbox/tasks/${taskId}/sql/execute`, { query });
      if (res.data.success) {
        setQueryResult(res.data.rows || []);
      } else {
        setError(res.data.error || 'Ошибка выполнения запроса');
        setQueryResult(null);
      }
    } catch (err) {
      setError('Ошибка выполнения запроса');
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!taskId) return;
    try {
      const res = await api.post(`/sandbox/tasks/${taskId}/submit`, { answer: query });
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
        const errObj = err as ApiError;
        msg = errObj.response?.data?.error || msg;
      }
      setError(msg);
    }
  };

  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 text-center py-8">{error}</div></Layout>;
  if (!task) return <Layout><div className="text-red-500 text-center py-8">Задание не найдено</div></Layout>;

  const isCompleted = result && result.status !== 'PENDING';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <button
            onClick={() => navigate('/sandbox')}
            className="text-blue-600 hover:underline"
          >
            ← К списку заданий
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold">Описание</h2>
              <p className="text-gray-700">{task.description}</p>
              {task.instructions && (
                <div className="mt-2">
                  <h3 className="font-medium">Инструкции:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
                </div>
              )}
              {task.config?.hint && (
                <div className="mt-2 text-sm text-blue-600">
                  <span className="font-medium">Подсказка:</span> {task.config.hint}
                </div>
              )}
            </div>

            {task.htmlTemplate && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold">Макет</h2>
                <div className="border rounded p-2 bg-gray-50 overflow-auto max-h-96">
                  <div dangerouslySetInnerHTML={{ __html: task.htmlTemplate }} />
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2">SQL-терминал</h2>
              <div className="border rounded p-2 bg-gray-50">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={6}
                  className="w-full border rounded px-3 py-2 font-mono text-sm"
                  placeholder="Введите SQL-запрос (SELECT ...)"
                  disabled={!!isCompleted}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleExecuteQuery}
                    disabled={executing || !query.trim() || !!isCompleted}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {executing ? 'Выполнение...' : 'Выполнить'}
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={handleSubmit}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Отправить ответ
                    </button>
                  )}
                </div>
              </div>
              {queryResult && queryResult.length > 0 && (
                <div className="mt-4 overflow-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(queryResult[0]).map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-gray-500">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queryResult.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-700">
                              {val !== null && val !== undefined ? String(val) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold">Информация</h2>
              <dl className="mt-2 space-y-1 text-sm">
                <dt className="text-gray-500">Тип</dt>
                <dd className="font-medium">{task.type}</dd>
                <dt className="text-gray-500">Сложность</dt>
                <dd className="font-medium">{task.difficulty}</dd>
                <dt className="text-gray-500">Баллы</dt>
                <dd className="font-medium">{task.points}</dd>
                {task.timeLimit && <><dt className="text-gray-500">Время</dt><dd className="font-medium">{task.timeLimit} мин</dd></>}
                {task.attemptsLimit && <><dt className="text-gray-500">Попыток</dt><dd className="font-medium">{task.attemptsLimit}</dd></>}
                {attempt && (
                  <>
                    <dt className="text-gray-500">Статус попытки</dt>
                    <dd className={`font-medium ${
                      attempt.status === 'PENDING' ? 'text-yellow-600' :
                      attempt.status === 'PASSED' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {attempt.status === 'PENDING' && 'В процессе'}
                      {attempt.status === 'PASSED' && '✅ Выполнено'}
                      {attempt.status === 'FAILED' && '❌ Неверно'}
                      {attempt.status === 'TIME_EXPIRED' && '⏰ Время истекло'}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {isCompleted && (
              <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${result.status === 'PASSED' ? 'border-green-500' : 'border-red-500'}`}>
                <h2 className="text-lg font-semibold">Результат</h2>
                <p className="mt-1 font-medium">Баллы: {result.score}</p>
                <p className="text-sm">{result.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskExecutionSQL;