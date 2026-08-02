import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
  ArrowLeftIcon,
  ClockIcon,
  InformationCircleIcon,
  LightBulbIcon,
  PlayIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
  DocumentTextIcon,
  TrophyIcon,
  HashtagIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

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

        await api.post(`/sandbox/tasks/${taskId}/sql/init`);

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

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Задание не найдено</p>
        </div>
      </Layout>
    );
  }

  const isCompleted = result && result.status !== 'PENDING';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 dark:text-yellow-400';
      case 'PASSED': return 'text-green-600 dark:text-green-400';
      case 'FAILED': return 'text-red-600 dark:text-red-400';
      case 'TIME_EXPIRED': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'В процессе';
      case 'PASSED': return '✅ Выполнено';
      case 'FAILED': return '❌ Неверно';
      case 'TIME_EXPIRED': return '⏰ Время истекло';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок и навигация */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <CircleStackIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {task.title}
          </h1>
          <button
            onClick={() => navigate('/sandbox')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            К списку заданий
          </button>
        </div>

        {/* Информационная панель */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 mb-6 border border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <HashtagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-500 dark:text-gray-400">Тип:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{task.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Сложность:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              task.difficulty <= 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
              task.difficulty <= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
              task.difficulty <= 4 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
            }`}>
              {task.difficulty}/5
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-500 dark:text-gray-400">Баллы:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{task.points}</span>
          </div>
          {task.timeLimit && (
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">Время:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{task.timeLimit} мин</span>
            </div>
          )}
          {attempt && (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="text-gray-500 dark:text-gray-400">Статус:</span>
              <span className={`font-medium ${getStatusColor(attempt.status)}`}>
                {getStatusLabel(attempt.status)}
              </span>
            </div>
          )}
          {timeLeft !== null && timeLeft > 0 && attempt?.status === 'PENDING' && (
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">Осталось:</span>
              <span className={`font-medium ${timeLeft < 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Основная сетка */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-5">
            {/* Описание */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Описание
              </h2>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </div>
              {task.instructions && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    Инструкции:
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {task.instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Схема БД */}
            {task.config?.schema && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <button
                  onClick={() => setShowSchema(!showSchema)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition w-full text-left"
                >
                  <CircleStackIcon className="w-5 h-5" />
                  {showSchema ? 'Скрыть схему БД' : 'Показать схему БД'}
                  {showSchema ? (
                    <ChevronUpIcon className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
                {showSchema && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-64">
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {task.config.schema}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Подсказка */}
            {task.hint && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition w-full text-left"
                >
                  <LightBulbIcon className="w-5 h-5" />
                  {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                  {showHint ? (
                    <ChevronUpIcon className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
                {showHint && (
                  <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {task.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка — SQL-терминал */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                <CodeBracketIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                SQL-терминал
              </h2>

              {!isCompleted ? (
                <>
                  <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={6}
                      className="w-full border-0 rounded-t-lg px-3 py-2 font-mono text-sm focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y"
                      placeholder="Введите SQL-запрос (SELECT ...)"
                      disabled={submitting}
                    />
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-t dark:border-gray-600 flex justify-between items-center">
                      <span className="text-xs text-gray-400 dark:text-gray-400">SQL-запрос</span>
                      <button
                        onClick={handleExecuteQuery}
                        disabled={executing || submitting || !query.trim()}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {executing ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            Выполнение...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-4 h-4" />
                            Выполнить
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{error}</span>
                    </div>
                  )}

                  {queryResult && (
                    <div className="mt-3 overflow-auto max-h-60 border dark:border-gray-700 rounded-lg">
                      {queryResult.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {Object.keys(queryResult[0]).map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap">
                                  <span className="flex items-center gap-1">
                                    <TableCellsIcon className="w-3.5 h-3.5" />
                                    {col}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {queryResult.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                {Object.values(row).map((val, i) => (
                                  <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-mono text-xs">
                                    {val !== null && val !== undefined ? String(val) : <span className="text-gray-400 dark:text-gray-500">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <CheckCircleIcon className="w-8 h-8 text-green-500 dark:text-green-400 mx-auto mb-1" />
                          <p className="text-sm">Запрос выполнен успешно, но не вернул данных</p>
                        </div>
                      )}
                    </div>
                  )}

                  {task.expectedResult && (
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                      <span>💡 Ожидаемый результат:</span>
                      <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded border dark:border-gray-600 text-gray-800 dark:text-gray-200">
                        {task.expectedResult}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !query.trim()}
                    className="mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-5 py-2.5 rounded-lg w-full transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5" />
                        Отправить ответ
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div
                  className={`p-4 rounded-xl ${
                    result.status === 'PASSED'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                  }`}
                >
                  <p className="font-bold text-lg flex items-center gap-2">
                    {result.status === 'PASSED' ? (
                      <>
                        <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        Задание выполнено!
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        Задание не выполнено
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    Оценка: <span className="font-bold text-lg">{result.score}%</span>
                  </p>
                  {result.feedback && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      {result.feedback}
                    </p>
                  )}
                  {attempt?.completedAt && (
                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Завершено: {new Date(attempt.completedAt).toLocaleString('ru-RU')}
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