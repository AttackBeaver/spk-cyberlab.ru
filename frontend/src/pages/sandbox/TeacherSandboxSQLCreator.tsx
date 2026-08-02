import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeftIcon,
  CircleStackIcon,
  HashtagIcon,
  TrophyIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  TableCellsIcon,
  CubeIcon,
  CheckCircleIcon,
  LightBulbIcon,
  FolderPlusIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  defaultConfig: {
    schema?: string;
    data?: Record<string, unknown[]>;
    expectedResult?: string;
    hint?: string;
  };
}

interface TaskData {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
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
  htmlTemplate: string | null;
  expectedResult: string | null;
  templateId: number | null;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const TeacherSandboxSQLCreator = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [points, setPoints] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [attemptsLimit, setAttemptsLimit] = useState<number | null>(null);

  const [schema, setSchema] = useState('');
  const [initialData, setInitialData] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [hint, setHint] = useState('');

  // Загрузка списка шаблонов
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/sandbox/templates');
        const sqlTemplates = res.data.filter(
          (t: Template) => t.type === 'DATABASE' || t.type === 'SQL_INJECTION'
        );
        setTemplates(sqlTemplates);
        if (sqlTemplates.length > 0) {
          setSelectedTemplate(sqlTemplates[0].id);
        }
      } catch {
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, []);

  // Загрузка задания для редактирования (только если есть taskId)
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      try {
        const res = await api.get(`/sandbox/${taskId}`);
        const task: TaskData = res.data;
        setTitle(task.title);
        setDescription(task.description);
        setInstructions(task.instructions || '');
        setDifficulty(task.difficulty);
        setPoints(task.points);
        setTimeLimit(task.timeLimit);
        setAttemptsLimit(task.attemptsLimit);
        setExpectedResult(task.expectedResult || '');
        if (task.config) {
          setSchema(task.config.schema || '');
          setInitialData(task.config.data ? JSON.stringify(task.config.data, null, 2) : '');
          setHint(task.config.hint || '');
        }
        if (task.templateId) {
          setSelectedTemplate(task.templateId);
        }
      } catch (err) {
        setError('Ошибка загрузки задания');
        console.error(err);
      }
    };
    fetchTask();
  }, [taskId]);

  // Обработчик выбора шаблона
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value ? Number(e.target.value) : null;
    setSelectedTemplate(templateId);

    if (templateId && !taskId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const config = template.defaultConfig;
        if (config) {
          setSchema(config.schema || '');
          setInitialData(config.data ? JSON.stringify(config.data, null, 2) : '');
          setExpectedResult(config.expectedResult || '');
          setHint(config.hint || '');
          if (!title) setTitle(template.name);
          if (!description) setDescription(template.description);
        }
      }
    } else if (!templateId && !taskId) {
      setSchema('');
      setInitialData('');
      setExpectedResult('');
      setHint('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description) {
      setError('Название и описание обязательны');
      return;
    }

    let dataObj: Record<string, unknown[]> = {};
    try {
      if (initialData.trim()) {
        dataObj = JSON.parse(initialData);
      }
    } catch {
      setError('Некорректный JSON в начальных данных');
      return;
    }

    const payload = {
      title,
      description,
      instructions: instructions || null,
      type: 'DATABASE',
      difficulty,
      timeLimit,
      attemptsLimit,
      points,
      config: {
        schema,
        data: dataObj,
        expectedResult: expectedResult || null,
        hint: hint || null,
      },
      htmlTemplate: null,
      expectedResult: expectedResult || null,
      templateId: selectedTemplate || undefined,
    };

    try {
      setLoading(true);
      if (taskId) {
        await api.put(`/sandbox/${taskId}`, payload);
        setSuccess('✅ Задание обновлено');
      } else {
        await api.post('/sandbox', payload);
        setSuccess('✅ Задание создано');
        setTimeout(() => navigate('/teacher/sandbox'), 1500);
      }
    } catch (err) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.error || '❌ Ошибка сохранения задания');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Доступ запрещён</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Заголовок и навигация */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <CircleStackIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {taskId ? 'Редактировать SQL-задание' : 'Создать SQL-задание'}
          </h1>
          <button
            onClick={() => navigate('/teacher/sandbox')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Сообщения */}
        {error && (
          <div className="flex items-start gap-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-6">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-xl mb-6">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Шаблон */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Шаблон (необязательно)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FolderPlusIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  value={selectedTemplate || ''}
                  onChange={handleTemplateChange}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition"
                >
                  <option value="">Без шаблона</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Сложность */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сложность (1-5)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HashtagIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Баллы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Баллы</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Лимит времени */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Лимит времени (мин, необязательно)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={timeLimit ?? ''}
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Лимит попыток */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Лимит попыток (необязательно)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ArrowPathIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={attemptsLimit ?? ''}
                  onChange={(e) => setAttemptsLimit(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Инструкции */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Инструкции для студента</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Схема БД */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Схема базы данных (SQL CREATE TABLE ...)</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <TableCellsIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                rows={6}
                className="w-full pl-10 pr-3 py-2.5 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);"
                required
              />
            </div>
          </div>

          {/* Начальные данные */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Начальные данные (JSON)</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <CubeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={initialData}
                onChange={(e) => setInitialData(e.target.value)}
                rows={4}
                className="w-full pl-10 pr-3 py-2.5 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder='{"users": [{"id":1,"username":"admin","password":"admin123"}]}'
              />
            </div>
          </div>

          {/* Ожидаемый результат */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ожидаемый результат (текст, который должен появиться после успешного запроса)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
              <input
                type="text"
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Например: admin"
              />
            </div>
          </div>

          {/* Подсказка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Подсказка (необязательно)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LightBulbIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Например: Попробуйте использовать UNION"
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex flex-wrap gap-3 pt-2 border-t dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
              ) : (
                <>
                  {taskId ? (
                    <>
                      <PencilSquareIcon className="w-5 h-5" />
                      Обновить
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="w-5 h-5" />
                      Создать
                    </>
                  )}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/sandbox')}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              <XMarkIcon className="w-5 h-5" />
              Отмена
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TeacherSandboxSQLCreator;