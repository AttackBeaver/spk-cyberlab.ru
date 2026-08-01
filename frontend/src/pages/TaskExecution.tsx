import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
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
  CpuChipIcon,
  DocumentTextIcon,
  TrophyIcon,
  HashtagIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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

  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<string>('');

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

        if (attemptRes.data.status !== 'PENDING') {
          setResult({
            score: attemptRes.data.score || 0,
            feedback: attemptRes.data.feedback || 'Завершено',
            status: attemptRes.data.status,
          });
        }

        setAttempt(attemptRes.data);

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
    }, 60000);

    return () => clearInterval(interval);
  }, [timeLeft]);

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
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Ошибка отправки ответа');
    } finally {
      setSubmitting(false);
    }
  };

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
  const isCodeTask = task.type === 'CODE';
  const isXssTask = task.type === 'XSS';

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
      <div className="max-w-5xl mx-auto">
        {/* Заголовок и навигация */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <CpuChipIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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

        {/* Описание задания */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
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

        {/* Подсказка */}
        {task.hint && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
            >
              <LightBulbIcon className="w-5 h-5" />
              {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
              {showHint ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            {showHint && (
              <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {task.hint}
              </div>
            )}
          </div>
        )}

        {/* HTML-макет */}
        {task.htmlTemplate && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
              <EyeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Интерактивный макет
            </h2>
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 flex items-center gap-2">
                <CodeBracketIcon className="w-3.5 h-3.5" />
                Предпросмотр
              </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <PaperAirplaneIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Ваш ответ
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isCodeTask ? 'Введите ваш код' : isXssTask ? 'Введите вредоносный код для XSS-атаки' : 'Введите ответ'}
                </label>
                <textarea
                  id="answer"
                  rows={isCodeTask ? 10 : 6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition ${
                    isCodeTask ? 'bg-gray-50 dark:bg-gray-800 font-mono' : ''
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
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExecuteCode}
                    disabled={executing || submitting}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-5 py-2 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executing ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Выполнение...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Выполнить код
                      </>
                    )}
                  </button>
                </div>
              )}

              {output && (
                <div className="mt-2 p-4 bg-gray-900 dark:bg-black text-green-400 rounded-lg font-mono text-sm overflow-auto max-h-60 whitespace-pre-wrap border border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <CodeBracketIcon className="w-3.5 h-3.5" />
                    Вывод
                  </div>
                  {output}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || executing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Отправить ответ
                    </>
                  )}
                </button>
                {task.expectedResult && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>💡 Ожидаемый результат:</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded dark:text-gray-300">
                      {task.expectedResult}
                    </span>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              {result.status === 'PASSED' ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              Результат
            </h2>
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
            <button
              onClick={() => navigate('/sandbox')}
              className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg transition shadow-md hover:shadow-lg"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Вернуться к списку
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TaskExecution;