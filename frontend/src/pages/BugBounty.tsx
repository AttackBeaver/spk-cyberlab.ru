import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';

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
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'WONTFIX': return 'bg-gray-100 text-gray-800';
      case 'CLOSED': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return <Layout><div className="text-center py-8">Пожалуйста, войдите</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bug Bounty</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Отмена' : '+ Сообщить об ошибке'}
          </button>
        </div>

        {/* Описание раздела */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800">Что такое Bug Bounty?</h3>
          <p className="text-blue-700 text-sm">
            Это программа по поиску ошибок и уязвимостей на платформе. Если вы нашли баг, 
            опишите его в отчёте. Администратор проверит и, если ошибка подтвердится, вы получите 
            оценку по дисциплине.
          </p>
        </div>

        {formError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{formError}</div>}
        {formSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{formSuccess}</div>}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Новый отчёт</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Шаги воспроизведения (необязательно)</label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Серьёзность</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="LOW">Низкая</option>
                    <option value="MEDIUM">Средняя</option>
                    <option value="HIGH">Высокая</option>
                    <option value="CRITICAL">Критическая</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="UI">UI/UX</option>
                    <option value="SECURITY">Безопасность</option>
                    <option value="PERFORMANCE">Производительность</option>
                    <option value="OTHER">Другое</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Отправить
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Вы ещё не отправляли отчётов</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                    {report.steps && (
                      <p className="text-gray-500 text-sm mt-1">
                        <span className="font-medium">Шаги:</span> {report.steps}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status === 'NEW' && 'Новый'}
                      {report.status === 'IN_PROGRESS' && 'В работе'}
                      {report.status === 'RESOLVED' && 'Решён'}
                      {report.status === 'WONTFIX' && 'Не будет исправлено'}
                      {report.status === 'CLOSED' && 'Закрыт'}
                    </span>
                  </div>
                </div>
                {report.adminResponse && (
                  <div className="mt-3 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-gray-700">Ответ администратора:</p>
                    <p className="text-sm text-gray-600">{report.adminResponse}</p>
                    {report.responder && (
                      <p className="text-xs text-gray-400 mt-1">Ответил: {report.responder.fullName}</p>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BugBounty;