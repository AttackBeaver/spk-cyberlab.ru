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
  hint: string | null;
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

interface QueryResultRow {
  [key: string]: string | number | boolean | null;
}

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
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; status: string } | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !attemptId) {
        setError('Неверный идентификатор');
        setLoading(false);
        return;
      }

      try {
        const [taskRes, attemptRes] = await Promise.all([
          api.get(`/sandbox/${taskId}`),
          api.get(`/sandbox/attempts/${attemptId}`)
        ]);

        setTask(taskRes.data);

        if (attemptRes.data.status !== 'PENDING') {
          setResult({
            score: attemptRes.data.score || 0,
            feedback: attemptRes.data.feedback || 'Завершено',
            status: attemptRes.data.status,
          });
        }

        setAttempt(attemptRes.data);

        // Инициализация БД для задания
        await api.post(`/sandbox/tasks/${taskId}/sql/init`);

        // Расчёт оставшегося времени
        if (taskRes.data.timeLimit && attemptRes.data.startedAt) {
          const elapsed = (Date.now() - new Date(attemptRes.data.startedAt).getTime()) / 60000;
          const remaining = Math.max(0, taskRes.data.timeLimit - elapsed);
          setTimeLeft(Math.ceil(remaining));
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

  // Таймер
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [timeLeft]);

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
    setSubmitting(true);
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
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Ошибка отправки ответа');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return 'менее 1 минуты';
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  if (loading) return <Layout><div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 dark:text-red-400 text-center py-8">{error}</div></Layout>;
  if (!task) return <Layout><div className="text-red-500 dark:text-red-400 text-center py-8">Задание не найдено</div></Layout>;

  const isCompleted = result && result.status !== 'PENDING';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{task.title}</h1>
          <button
            onClick={() => navigate('/sandbox')}
            className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← К списку заданий
          </button>
        </div>

        {/* Информационная панель */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm transition-colors duration-300">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Тип:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{task.type}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Сложность:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{task.difficulty}/5</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Баллы:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{task.points}</span>
          </div>
          {task.timeLimit && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">⏱️ Время:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{task.timeLimit} мин</span>
            </div>
          )}
          {task.attemptsLimit && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">📝 Попыток:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{task.attemptsLimit}</span>
            </div>
          )}
          {attempt && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Статус:</span>
              <span
                className={`ml-1 font-medium ${
                  attempt.status === 'PENDING'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : attempt.status === 'PASSED'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {attempt.status === 'PENDING' && 'В процессе'}
                {attempt.status === 'PASSED' && '✅ Выполнено'}
                {attempt.status === 'FAILED' && '❌ Неверно'}
                {attempt.status === 'TIME_EXPIRED' && '⏰ Время истекло'}
              </span>
            </div>
          )}
          {timeLeft !== null && timeLeft > 0 && attempt?.status === 'PENDING' && (
            <div className="col-span-2 sm:col-span-1">
              <span className="text-gray-500 dark:text-gray-400">⏳ Осталось:</span>
              <span className={`ml-1 font-medium ${timeLeft < 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка — описание, инструкции, схема, подсказка */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 transition-colors duration-300">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Описание</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2">{task.description}</p>
              {task.instructions && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">📌 Инструкции:</h3>
                  <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap mt-1">{task.instructions}</p>
                </div>
              )}
            </div>

            {/* Схема БД */}
            {task.config?.schema && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 transition-colors duration-300">
                <button
                  onClick={() => setShowSchema(!showSchema)}
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                >
                  🗄️ {showSchema ? 'Скрыть схему БД' : 'Показать схему БД'}
                  <svg
                    className={`w-4 h-4 transition-transform ${showSchema ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSchema && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 overflow-auto max-h-64">
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">{task.config.schema}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Подсказка */}
            {task.hint && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 transition-colors duration-300">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                >
                  💡 {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                  <svg
                    className={`w-4 h-4 transition-transform ${showHint ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showHint && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {task.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка — SQL-терминал */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 sticky top-24 transition-colors duration-300">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">SQL-терминал</h2>
              {!isCompleted ? (
                <>
                  <div className="border dark:border-gray-600 rounded">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={6}
                      className="w-full border-0 rounded-t px-3 py-2 font-mono text-sm focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Введите SQL-запрос (SELECT ...)"
                      disabled={submitting}
                    />
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-t dark:border-gray-600 flex justify-between items-center">
                      <span className="text-xs text-gray-400 dark:text-gray-400">SQL-запрос</span>
                      <button
                        onClick={handleExecuteQuery}
                        disabled={executing || submitting || !query.trim()}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition"
                      >
                        {executing ? 'Выполнение...' : '▶ Выполнить'}
                      </button>
                    </div>
                  </div>
                  {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}
                  {queryResult && (
                    <div className="mt-3 overflow-auto max-h-48 border dark:border-gray-600 rounded">
                      {queryResult.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {Object.keys(queryResult[0]).map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {queryResult.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((val, i) => (
                                  <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {val !== null && val !== undefined ? String(val) : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-3 text-gray-500 dark:text-gray-400">Запрос выполнен успешно, но не вернул данных</div>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded w-full disabled:opacity-50 transition"
                    >
                      {submitting ? 'Отправка...' : 'Отправить ответ'}
                    </button>
                  </div>
                  {task.expectedResult && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      💡 Ожидаемый результат: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded dark:text-gray-300">{task.expectedResult}</span>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={`p-4 rounded ${
                    result.status === 'PASSED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-600'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-600'
                  }`}
                >
                  <p className="font-medium text-lg">
                    {result.status === 'PASSED' ? '✅ Задание выполнено!' : '❌ Задание не выполнено'}
                  </p>
                  <p className="mt-1">Оценка: <span className="font-bold">{result.score}%</span></p>
                  {result.feedback && <p className="mt-2 text-sm">{result.feedback}</p>}
                  {attempt?.completedAt && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Завершено: {new Date(attempt.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskExecutionSQL;