import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';
import { AxiosError } from 'axios';
import {
  CubeIcon,
  PlusCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  HashtagIcon,
  ClockIcon,
  TrophyIcon,
  CodeBracketIcon,
  FolderPlusIcon,
  ClipboardDocumentListIcon,
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

interface Task {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
  answerTemplate: string | null;
  htmlTemplate: string | null;
  expectedResult: string | null;
  config: Record<string, unknown> | null;
  templateId: number | null;
  creator: { fullName: string };
  groups: { group: { id: number; name: string } }[];
}

interface Group {
  id: number;
  name: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface SandboxTaskPayload {
  title: string;
  description: string;
  instructions: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
  answerTemplate: string | null;
  htmlTemplate: string | null;
  expectedResult: string | null;
  config: Record<string, unknown> | null;
  templateId?: number;
}

const TeacherSandbox = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Состояния для формы
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [difficulty, setDifficulty] = useState(1);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [attemptsLimit, setAttemptsLimit] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [answerTemplate, setAnswerTemplate] = useState('');
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [config, setConfig] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Назначение групп
  const [assignTaskId, setAssignTaskId] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  // Загрузка данных
  const fetchTasks = async () => {
    try {
      const res = await api.get('/sandbox');
      setTasks(res.data);
    } catch {
      setError('Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/auth/groups');
      setGroups(res.data);
    } catch {
      console.error('Ошибка загрузки групп');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/sandbox/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Ошибка загрузки шаблонов:', err);
      if (err instanceof AxiosError) {
        console.error('Ответ сервера:', err.response?.data);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchTasks();
        await fetchGroups();
        await fetchTemplates();
      }
    };
    loadData();
  }, [user]);

  // Сброс формы
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setInstructions('');
    setType('CUSTOM');
    setDifficulty(1);
    setTimeLimit(null);
    setAttemptsLimit(null);
    setPoints(0);
    setAnswerTemplate('');
    setHtmlTemplate('');
    setExpectedResult('');
    setConfig('');
    setSelectedTemplateId(null);
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(false);
  };

  // Заполнение формы из шаблона
  const applyTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setType(template.type);
    setTitle(template.name);
    setDescription(template.description);
    setHtmlTemplate(template.previewHtml || '');
    if (template.defaultConfig) {
      setConfig(JSON.stringify(template.defaultConfig, null, 2));
    }
  };

  // Редактирование задания
  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setInstructions(task.instructions || '');
    setType(task.type);
    setDifficulty(task.difficulty);
    setTimeLimit(task.timeLimit);
    setAttemptsLimit(task.attemptsLimit);
    setPoints(task.points);
    setAnswerTemplate(task.answerTemplate || '');
    setHtmlTemplate(task.htmlTemplate || '');
    setExpectedResult(task.expectedResult || '');
    setConfig(task.config ? JSON.stringify(task.config, null, 2) : '');
    setSelectedTemplateId(task.templateId || null);
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  // Создание/обновление задания
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    let parsedConfig: Record<string, unknown> | null = null;
    if (config.trim()) {
      try {
        parsedConfig = JSON.parse(config) as Record<string, unknown>;
      } catch {
        setFormError('Некорректный JSON в конфиге');
        setIsSubmitting(false);
        return;
      }
    }

    const payload: SandboxTaskPayload = {
      title,
      description,
      instructions: instructions || null,
      type,
      difficulty,
      timeLimit,
      attemptsLimit,
      points,
      answerTemplate: answerTemplate || null,
      htmlTemplate: htmlTemplate || null,
      expectedResult: expectedResult || null,
      config: parsedConfig,
      templateId: selectedTemplateId || undefined,
    };

    try {
      if (editingId) {
        await api.put(`/sandbox/${editingId}`, payload);
        setFormSuccess('✅ Задание обновлено');
      } else {
        await api.post('/sandbox', payload);
        setFormSuccess('✅ Задание создано');
      }
      resetForm();
      await fetchTasks();
    } catch (err) {
      const errorObj = err as ApiError;
      setFormError(errorObj.response?.data?.error || '❌ Ошибка сохранения задания');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление задания
  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это задание?')) return;
    try {
      await api.delete(`/sandbox/${id}`);
      await fetchTasks();
    } catch (err) {
      const errorObj = err as ApiError;
      alert(errorObj.response?.data?.error || 'Ошибка удаления');
    }
  };

  // Назначение групп
  const openAssignModal = (taskId: number, currentGroupIds: number[]) => {
    setAssignTaskId(taskId);
    setSelectedGroups(currentGroupIds);
  };

  const handleAssign = async () => {
    if (assignTaskId === null) return;
    try {
      await api.post(`/sandbox/${assignTaskId}/assign`, { groupIds: selectedGroups });
      alert('✅ Назначения обновлены');
      setAssignTaskId(null);
      await fetchTasks();
    } catch (err) {
      const errorObj = err as ApiError;
      alert(errorObj.response?.data?.error || 'Ошибка назначения');
    }
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // Удаление шаблона (только ADMIN)
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Удалить шаблон? (Задания, созданные из него, останутся)')) return;
    try {
      await api.delete(`/sandbox/templates/${templateId}`);
      await fetchTemplates();
    } catch (err) {
      const errorObj = err as ApiError;
      alert(errorObj.response?.data?.error || 'Ошибка удаления шаблона');
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SQL_INJECTION: 'SQL-инъекция',
      XSS: 'XSS-атака',
      PHISHING: 'Фишинг',
      CODE: 'Программирование',
      DATABASE: 'База данных',
      CUSTOM: 'Кастомное',
    };
    return map[type] || type;
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 5: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
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
      <div className="max-w-6xl mx-auto">
        {/* Заголовок и кнопки */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Управление заданиями полигона
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/teacher/sandbox/sql/create"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-md text-sm font-medium"
            >
              <CodeBracketIcon className="w-5 h-5" />
              SQL-задание
            </Link>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-md ${
                showTemplates
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <FolderPlusIcon className="w-5 h-5" />
              {showTemplates ? 'Скрыть шаблоны' : 'Шаблоны'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md text-sm font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Создать задание
            </button>
          </div>
        </div>

        {/* Сообщения */}
        {formError && (
          <div className="flex items-start gap-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-6">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="flex items-start gap-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-xl mb-6">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Форма создания/редактирования */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {editingId ? 'Редактировать задание' : 'Новое задание'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="SQL_INJECTION">SQL-инъекция</option>
                    <option value="XSS">XSS-атака</option>
                    <option value="PHISHING">Фишинг</option>
                    <option value="CODE">Программирование</option>
                    <option value="DATABASE">База данных</option>
                    <option value="CUSTOM">Кастомное</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сложность (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Баллы</label>
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Лимит времени (мин)</label>
                  <input
                    type="number"
                    min="1"
                    value={timeLimit ?? ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Лимит попыток</label>
                  <input
                    type="number"
                    min="1"
                    value={attemptsLimit ?? ''}
                    onChange={(e) => setAttemptsLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Инструкции для студента</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Шаблон правильного ответа (для CUSTOM)</label>
                <input
                  type="text"
                  value={answerTemplate}
                  onChange={(e) => setAnswerTemplate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Например: hello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML-макет (для интерактивных заданий)</label>
                <textarea
                  value={htmlTemplate}
                  onChange={(e) => setHtmlTemplate(e.target.value)}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2.5 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Вставьте HTML-код макета уязвимого сайта..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ожидаемый результат (текст после успешной атаки)</label>
                <input
                  type="text"
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Например: Добро пожаловать, admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Конфигурация (JSON) — для сложных заданий</label>
                <textarea
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2.5 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder='{"schema": "CREATE TABLE...", "data": {...}}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Использовать шаблон (необязательно)</label>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    if (id) {
                      const template = templates.find(t => t.id === id);
                      if (template) applyTemplate(template);
                    } else {
                      setSelectedTemplateId(null);
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">Без шаблона</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({getTypeLabel(t.type)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      {editingId ? 'Обновить' : 'Создать'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Блок шаблонов */}
        {showTemplates && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FolderPlusIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Шаблоны заданий
              </h2>
              <Link
                to="/teacher/sandbox/templates/create"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition shadow-md text-sm font-medium"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Создать шаблон
              </Link>
            </div>
            {templates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Нет шаблонов</p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-wrap justify-between items-center gap-3 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{template.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {getTypeLabel(template.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          resetForm();
                          applyTemplate(template);
                          setShowForm(true);
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition"
                      >
                        <PlusCircleIcon className="w-4 h-4" />
                        Использовать
                      </button>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link
                            to={`/teacher/sandbox/templates/edit/${template.id}`}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                            Редактировать
                          </Link>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Список заданий */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Загрузка заданий...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
            <XCircleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <CubeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Нет заданий</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Создать первое задание
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-wrap justify-between items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{task.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <HashtagIcon className="w-3.5 h-3.5" />
                      {getTypeLabel(task.type)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                      Сложность {task.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <TrophyIcon className="w-3.5 h-3.5 text-yellow-500" />
                      {task.points} баллов
                    </span>
                    {task.timeLimit && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {task.timeLimit} мин
                      </span>
                    )}
                    {task.attemptsLimit && (
                      <span className="inline-flex items-center gap-1">
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        {task.attemptsLimit} попыток
                      </span>
                    )}
                    {task.templateId && (
                      <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <FolderPlusIcon className="w-3.5 h-3.5" />
                        Из шаблона
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Автор: {task.creator.fullName}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openAssignModal(task.id, task.groups.map(g => g.group.id))}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    Группы
                  </button>
                  <Link
                    to={`/sandbox/preview/${task.id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm transition px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Предпросмотр
                  </Link>
                  <Link
                    to={`/teacher/sandbox/reports/${task.id}`}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm transition px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Отчёты
                  </Link>
                  <button
                    onClick={() => handleEdit(task)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm transition px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно назначения групп */}
      {assignTaskId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Назначить группы
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выберите группы, которые будут иметь доступ к этому заданию.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                    selectedGroups.includes(group.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => toggleGroupSelection(group.id)}
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{group.name}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t dark:border-gray-700">
              <button
                onClick={handleAssign}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition shadow-md"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Сохранить
              </button>
              <button
                onClick={() => setAssignTaskId(null)}
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                <XMarkIcon className="w-5 h-5" />
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherSandbox;