import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeftIcon,
  FolderPlusIcon,
  DocumentTextIcon,
  HashtagIcon,
  InformationCircleIcon,
  CodeBracketIcon,
  CubeIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

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
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Доступ запрещён. Только для администратора.</p>
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
            <FolderPlusIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            {templateId ? 'Редактировать шаблон' : 'Создать шаблон'}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название шаблона</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Тип задания */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип задания</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HashtagIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none appearance-none transition"
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
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание шаблона</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Схема конфигурации */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Схема конфигурации (JSON) — описывает структуру настраиваемых параметров
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <CodeBracketIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={configSchema}
                onChange={(e) => setConfigSchema(e.target.value)}
                rows={4}
                className="w-full pl-10 pr-3 py-2.5 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder='{"schema": "string", "data": "object"}'
                required
              />
            </div>
          </div>

          {/* Конфигурация по умолчанию */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Конфигурация по умолчанию (JSON)</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <CubeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={defaultConfig}
                onChange={(e) => setDefaultConfig(e.target.value)}
                rows={4}
                className="w-full pl-10 pr-3 py-2.5 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder='{"schema": "CREATE TABLE users...", "data": {"users": [...]}}'
                required
              />
            </div>
          </div>

          {/* HTML-макет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML-макет для предпросмотра (необязательно)</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                value={previewHtml}
                onChange={(e) => setPreviewHtml(e.target.value)}
                rows={6}
                className="w-full pl-10 pr-3 py-2.5 font-mono text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder="<div>Пример макета уязвимого сайта...</div>"
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
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  {templateId ? (
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

export default TeacherSandboxTemplateCreator;