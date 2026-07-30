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
  config: Record<string, unknown> | null;
}

interface Attempt {
  id: number;
  status: string;
  score: number | null;
  feedback: string | null;
  startedAt: string;
  completedAt: string | null;
  remainingTime?: number | null;
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
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Состояния для выполнения кода
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<string>('');

  // Загрузка данных задания и попытки
  useEffect(() => {
    const fetchData = async () => {
      if (!taskId || !attemptId) {
        setError('Неверный идентификатор задания или попытки');
        setLoading(false);
        return;
      }

      try {
        const [taskRes, attemptRes] = await Promise.all([
          api.get(`/sandbox/${taskId}`),
          api.get(`/sandbox/attempts/${attemptId}`),
        ]);

        setTask(taskRes.data);

        // Если попытка уже завершена, показываем результат
        if (attemptRes.data.status !== 'PENDING') {
          setResult({
            score: attemptRes.data.score || 0,
            feedback: attemptRes.data.feedback || 'Завершено',
            status: attemptRes.data.status,
          });
        }

        setAttempt(attemptRes.data);

        // Вычисляем оставшееся время, если есть лимит
        if (taskRes.data.timeLimit && attemptRes.data.startedAt) {
          const elapsed = (Date.now() - new Date(attemptRes.data.startedAt).getTime()) / 60000;
          const remaining = Math.max(0, taskRes.data.timeLimit - elapsed);
          setTimeLeft(Math.ceil(remaining));
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

  // Таймер обратного отсчёта
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // обновляем каждую минуту

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Отправка ответа
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
      // Обновляем попытку
      const updatedAttempt = await api.get(`/sandbox/attempts/${attemptId}`);
      setAttempt(updatedAttempt.data);
    } catch (err) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Ошибка отправки ответа');
    } finally {
      setSubmitting(false);
    }
  };

  // Выполнение кода (только для типа CODE)
  const handleExecuteCode = async () => {
    if (!taskId || !task) return;
    if (!answer.trim()) {
      setError('Пожалуйста, введите код для выполнения');
      return;
    }

    setExecuting(true);
    setOutput('');
    setError('');

    try {
      const language = (task.config?.language as string) || 'python';
      const res = await api.post(`/sandbox/tasks/${taskId}/execute`, {
        code: answer,
        language,
      });
      if (res.data.success) {
        setOutput(res.data.output || '✅ Код выполнен успешно (вывод пуст)');
      } else {
        setOutput(`❌ Ошибка выполнения:\n${res.data.error || res.data.output}`);
      }
    } catch (err) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setOutput(`❌ Ошибка выполнения запроса: ${errorObj.response?.data?.error || 'Неизвестная ошибка'}`);
    } finally {
      setExecuting(false);
    }
  };

  // Форматирование времени
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 dark:text-red-400 text-center py-8">{error}</div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-red-500 dark:text-red-400 text-center py-8">Задание не найдено</div>
      </Layout>
    );
  }

  const isCompleted = result && result.status !== 'PENDING';
  const isCodeTask = task.type === 'CODE';
  const isXssTask = task.type === 'XSS';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
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
              <span className={`ml-1 font-medium ${
                timeLeft < 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Описание задания */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Описание</h2>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</div>
          {task.instructions && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
              <h3 className="font-medium text-blue-800 dark:text-blue-300">📌 Инструкции:</h3>
              <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap mt-1">{task.instructions}</p>
            </div>
          )}
        </div>

        {/* Подсказка */}
        {task.hint && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 mb-6 transition-colors duration-300">
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

        {/* HTML-макет (в iframe для безопасности) */}
        {task.htmlTemplate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 mb-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Интерактивный макет</h2>
            <div className="border dark:border-gray-700 rounded overflow-hidden bg-gray-50 dark:bg-gray-700">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">Предпросмотр</div>
              <div className="p-0 max-h-96 overflow-auto">
                <iframe
                  srcDoc={task.htmlTemplate}
                  title="Интерактивный макет"
                  className="w-full min-h-[300px] border-0 dark:bg-gray-800"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}

        {/* Форма ответа или результат */}
        {!isCompleted ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Ваш ответ</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isCodeTask ? 'Введите ваш код' : isXssTask ? 'Введите вредоносный код для XSS-атаки' : 'Введите ответ'}
                </label>
                <textarea
                  id="answer"
                  rows={isCodeTask ? 10 : 6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 ${
                    isCodeTask ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                  placeholder={
                    isCodeTask
                      ? '# Ваш код на Python или JavaScript...\nprint("Hello, World!")'
                      : isXssTask
                      ? '<script>alert("XSS")</script>'
                      : 'Введите ваш ответ здесь...'
                  }
                  disabled={submitting || executing}
                />
              </div>

              {isCodeTask && (
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleExecuteCode}
                    disabled={executing || submitting}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-6 py-2 rounded disabled:opacity-50 transition"
                  >
                    {executing ? 'Выполнение...' : '▶ Выполнить код'}
                  </button>
                </div>
              )}

              {output && (
                <div className="mt-2 p-3 bg-gray-900 dark:bg-black text-green-400 rounded font-mono text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                  {output}
                </div>
              )}

              {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || executing}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 transition"
                >
                  {submitting ? 'Отправка...' : 'Отправить ответ'}
                </button>
                {task.expectedResult && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
                    💡 Ожидаемый результат: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded dark:text-gray-300">{task.expectedResult}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Результат</h2>
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
              {result.feedback && <p className="mt-2 text-sm whitespace-pre-wrap">{result.feedback}</p>}
              {attempt?.completedAt && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Завершено: {new Date(attempt.completedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/sandbox')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded transition"
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