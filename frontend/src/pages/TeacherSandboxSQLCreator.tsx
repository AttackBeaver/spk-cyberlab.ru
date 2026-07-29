import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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

  // Обработчик выбора шаблона — здесь обновляем поля (без эффекта)
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value ? Number(e.target.value) : null;
    setSelectedTemplate(templateId);

    // Если выбран шаблон и это новое задание (нет taskId) — заполняем поля
    if (templateId && !taskId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const config = template.defaultConfig;
        if (config) {
          setSchema(config.schema || '');
          setInitialData(config.data ? JSON.stringify(config.data, null, 2) : '');
          setExpectedResult(config.expectedResult || '');
          setHint(config.hint || '');
          // Если название и описание пустые — подставляем из шаблона
          if (!title) setTitle(template.name);
          if (!description) setDescription(template.description);
        }
      }
    } else if (!templateId && !taskId) {
      // Если шаблон снят — очищаем поля (только для нового задания)
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
    return <Layout><div className="text-red-500">Доступ запрещён</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {taskId ? 'Редактировать SQL-задание' : 'Создать SQL-задание'}
          </h1>
          <button
            onClick={() => navigate('/teacher/sandbox')}
            className="text-blue-600 hover:underline"
          >
            ← Назад
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Шаблон (необязательно)</label>
              <select
                value={selectedTemplate || ''}
                onChange={handleTemplateChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Без шаблона</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Сложность (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Баллы</label>
              <input
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Лимит времени (мин, необязательно)</label>
              <input
                type="number"
                min="1"
                value={timeLimit ?? ''}
                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Лимит попыток (необязательно)</label>
              <input
                type="number"
                min="1"
                value={attemptsLimit ?? ''}
                onChange={(e) => setAttemptsLimit(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Инструкции для студента</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Схема базы данных (SQL CREATE TABLE ...)</label>
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={6}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              placeholder="CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Начальные данные (JSON)</label>
            <textarea
              value={initialData}
              onChange={(e) => setInitialData(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              placeholder='{"users": [{"id":1,"username":"admin","password":"admin123"}]}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Ожидаемый результат (текст, который должен появиться после успешного запроса)</label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Например: admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Подсказка (необязательно)</label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Например: Попробуйте использовать UNION"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : taskId ? 'Обновить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/sandbox')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TeacherSandboxSQLCreator;