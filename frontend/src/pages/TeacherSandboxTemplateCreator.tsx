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
  configSchema: Record<string, unknown>;
  defaultConfig: Record<string, unknown>;
  previewHtml: string | null;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const TeacherSandboxTemplateCreator = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('SQL_INJECTION');
  const [configSchema, setConfigSchema] = useState('');
  const [defaultConfig, setDefaultConfig] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // Загрузка шаблона для редактирования
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      try {
        const res = await api.get(`/sandbox/templates/${templateId}`);
        const template: Template = res.data;
        setName(template.name);
        setDescription(template.description);
        setType(template.type);
        setConfigSchema(JSON.stringify(template.configSchema, null, 2));
        setDefaultConfig(JSON.stringify(template.defaultConfig, null, 2));
        setPreviewHtml(template.previewHtml || '');
      } catch {
        setError('Ошибка загрузки шаблона');
      }
    };
    fetchTemplate();
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !description) {
      setError('Название и описание обязательны');
      return;
    }

    // Парсим JSON – используем let, чтобы присвоить внутри try
    let parsedConfigSchema: Record<string, unknown>;
    let parsedDefaultConfig: Record<string, unknown>;

    try {
      parsedConfigSchema = JSON.parse(configSchema);
    } catch {
      setError('Некорректный JSON в схеме конфигурации');
      return;
    }

    try {
      parsedDefaultConfig = JSON.parse(defaultConfig);
    } catch {
      setError('Некорректный JSON в конфигурации по умолчанию');
      return;
    }

    const payload = {
      name,
      description,
      type,
      configSchema: parsedConfigSchema,
      defaultConfig: parsedDefaultConfig,
      previewHtml: previewHtml || null,
    };

    try {
      setLoading(true);
      if (templateId) {
        await api.put(`/sandbox/templates/${templateId}`, payload);
        setSuccess('✅ Шаблон обновлён');
      } else {
        await api.post('/sandbox/templates', payload);
        setSuccess('✅ Шаблон создан');
        setTimeout(() => navigate('/teacher/sandbox'), 1500);
      }
    } catch (err) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.error || '❌ Ошибка сохранения шаблона');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <Layout><div className="text-red-500 dark:text-red-400">Доступ запрещён. Только для администратора.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {templateId ? 'Редактировать шаблон' : 'Создать шаблон'}
          </h1>
          <button
            onClick={() => navigate('/teacher/sandbox')}
            className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Назад
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 space-y-4 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название шаблона</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Тип задания</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="SQL_INJECTION">SQL-инъекция</option>
                <option value="XSS">XSS-атака</option>
                <option value="PHISHING">Фишинг</option>
                <option value="CODE">Программирование</option>
                <option value="DATABASE">База данных</option>
                <option value="CUSTOM">Кастомное</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание шаблона</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Схема конфигурации (JSON) — описывает структуру настраиваемых параметров</label>
            <textarea
              value={configSchema}
              onChange={(e) => setConfigSchema(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              placeholder='{"schema": "string", "data": "object"}'
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Конфигурация по умолчанию (JSON)</label>
            <textarea
              value={defaultConfig}
              onChange={(e) => setDefaultConfig(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              placeholder='{"schema": "CREATE TABLE users...", "data": {"users": [...]}}'
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">HTML-макет для предпросмотра (необязательно)</label>
            <textarea
              value={previewHtml}
              onChange={(e) => setPreviewHtml(e.target.value)}
              rows={6}
              className="w-full border rounded px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              placeholder="<div>Пример макета уязвимого сайта...</div>"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50 transition"
            >
              {loading ? 'Сохранение...' : templateId ? 'Обновить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/sandbox')}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TeacherSandboxTemplateCreator;