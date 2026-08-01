import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  ShieldCheckIcon,
  PlusCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface BugReport {
  id: number;
  title: string;
  description: string;
  steps: string | null;
  severity: string;
  category: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  responder?: { fullName: string };
}

const BugBounty = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [category, setCategory] = useState('OTHER');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchReports = async () => {
    try {
      const res = await api.get('/bug-reports/my');
      setReports(res.data);
    } catch {
      setError('Ошибка загрузки отчётов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      if (user) {
        await fetchReports();
      }
    };
    loadReports();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!title || !description) {
      setFormError('Название и описание обязательны');
      return;
    }
    try {
      await api.post('/bug-reports', { title, description, steps, severity, category });
      setFormSuccess('✅ Отчёт отправлен');
      setTitle('');
      setDescription('');
      setSteps('');
      setSeverity('MEDIUM');
      setCategory('OTHER');
      setShowForm(false);
      await fetchReports();
    } catch (err) {
      let msg = 'Ошибка отправки';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setFormError(msg);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'WONTFIX': return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
      case 'CLOSED': return 'bg-gray-300 text-gray-600 dark:bg-gray-600/50 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'LOW': return 'Низкая';
      case 'MEDIUM': return 'Средняя';
      case 'HIGH': return 'Высокая';
      case 'CRITICAL': return 'Критическая';
      default: return sev;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'Новый';
      case 'IN_PROGRESS': return 'В работе';
      case 'RESOLVED': return 'Решён';
      case 'WONTFIX': return 'Не будет исправлено';
      case 'CLOSED': return 'Закрыт';
      default: return status;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, войдите, чтобы участвовать в программе Bug Bounty</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Bug Bounty
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
              showForm
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showForm ? (
              <>
                <XMarkIcon className="w-5 h-5" />
                Отмена
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5" />
                Сообщить об ошибке
              </>
            )}
          </button>
        </div>

        {/* Описание раздела */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-5 mb-6 flex items-start gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full flex-shrink-0">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Что такое Bug Bounty?</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Это программа по поиску ошибок и уязвимостей на платформе. Если вы нашли баг,
              опишите его в отчёте. Администратор проверит и, если ошибка подтвердится, вы получите
              оценку по дисциплине.
            </p>
          </div>
        </div>

        {/* Сообщения */}
        {formError && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-xl mb-4 flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Форма создания отчёта */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Новый отчёт
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Шаги воспроизведения (необязательно)</label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Серьёзность</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="LOW">Низкая</option>
                    <option value="MEDIUM">Средняя</option>
                    <option value="HIGH">Высокая</option>
                    <option value="CRITICAL">Критическая</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="UI">UI/UX</option>
                    <option value="SECURITY">Безопасность</option>
                    <option value="PERFORMANCE">Производительность</option>
                    <option value="OTHER">Другое</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition shadow-md"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Отправить
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список отчётов */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Загрузка отчётов...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <ShieldCheckIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Вы ещё не отправляли отчётов</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Сообщить об ошибке
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{report.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{report.description}</p>
                    {report.steps && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        <span className="font-medium">Шаги:</span> {report.steps}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {new Date(report.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {user.fullName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                      {getSeverityLabel(report.severity)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>

                {report.adminResponse && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
                    <div className="flex items-start gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ответ администратора:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{report.adminResponse}</p>
                        {report.responder && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ответил: {report.responder.fullName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BugBounty;