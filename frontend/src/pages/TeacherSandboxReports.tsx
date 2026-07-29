import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';

interface Report {
  id: number;
  text: string;
  score: number | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  attempt: {
    id: number;
    feedback: string | null;
    user: {
      id: number;
      fullName: string;
      username: string;
      group: { id: number; name: string } | null;
    };
    task: {
      id: number;
      title: string;
    };
    score: number | null;
    status: string;
  };
  reviewer: {
    id: number;
    fullName: string;
  } | null;
}

interface Statistics {
  task: {
    id: number;
    title: string;
  };
  attempts: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    timeExpired: number;
  };
  scores: {
    average: number;
    max: number;
    min: number;
  };
  reports: {
    total: number;
    reviewed: number;
    pending: number;
  };
  students: {
    id: number;
    fullName: string;
    username: string;
    group: string | null;
    status: string;
    score: number | null;
    hasReport: boolean;
    reportReviewed: boolean;
  }[];
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const TeacherSandboxReports = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      if (!taskId) return;
      setLoading(true);
      setError('');
      try {
        const [reportsRes, statsRes] = await Promise.all([
          api.get(`/sandbox/tasks/${taskId}/reports`),
          api.get(`/sandbox/tasks/${taskId}/statistics`),
        ]);
        setReports(reportsRes.data);
        setStatistics(statsRes.data);
      } catch (err) {
        const errorObj = err as ApiError;
        setError(errorObj.response?.data?.error || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  const handleGrade = async (reportId: number) => {
    if (gradeScore < 0 || gradeScore > 100) {
      alert('Оценка должна быть от 0 до 100');
      return;
    }
    if (!confirm('Выставить оценку?')) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.put(`/sandbox/reports/${reportId}/grade`, {
        score: gradeScore,
        feedback: gradeFeedback || null,
      });
      setSuccessMessage('✅ Оценка выставлена');
      setSelectedReportId(null);
      setGradeScore(0);
      setGradeFeedback('');
      // Перезагружаем данные после обновления
      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/sandbox/tasks/${taskId}/reports`),
        api.get(`/sandbox/tasks/${taskId}/statistics`),
      ]);
      setReports(reportsRes.data);
      setStatistics(statsRes.data);
    } catch (err) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.error || 'Ошибка выставления оценки');
    } finally {
      setSubmitting(false);
    }
  };

  const openReport = (report: Report) => {
    setSelectedReportId(report.id);
    setGradeScore(report.score || 0);
    setGradeFeedback(report.attempt.feedback || '');
  };

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return <Layout><div className="text-red-500">Доступ запрещён</div></Layout>;
  }

  if (loading) {
    return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-8">{error}</div>
        <div className="text-center">
          <button
            onClick={() => {
              // Перезагрузка данных через useEffect
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Повторить
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Отчёты по заданию: {statistics?.task.title || 'Загрузка...'}
          </h1>
          <button
            onClick={() => navigate('/teacher/sandbox')}
            className="text-blue-600 hover:underline"
          >
            ← Назад к управлению заданиями
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>
        )}

        {/* Статистика */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{statistics.attempts.total}</p>
              <p className="text-sm text-gray-500">Всего попыток</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{statistics.attempts.passed}</p>
              <p className="text-sm text-gray-500">Выполнено</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{statistics.reports.pending}</p>
              <p className="text-sm text-gray-500">Отчётов на проверку</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{statistics.scores.average.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Средний балл</p>
            </div>
          </div>
        )}

        {/* Список студентов с отчётами */}
        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет отчётов для этого задания</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Студент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус попытки</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Отчёт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.attempt.user.fullName}
                      <div className="text-xs text-gray-400">{report.attempt.user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.attempt.user.group?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.attempt.status === 'PASSED'
                            ? 'bg-green-100 text-green-800'
                            : report.attempt.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : report.attempt.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {report.attempt.status === 'PASSED' && '✅ Выполнено'}
                        {report.attempt.status === 'FAILED' && '❌ Неверно'}
                        {report.attempt.status === 'PENDING' && '⏳ На проверке'}
                        {report.attempt.status === 'TIME_EXPIRED' && '⏰ Время истекло'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.text.length > 50 ? report.text.slice(0, 50) + '…' : report.text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.score !== null ? `${report.score}%` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openReport(report)}
                        className="text-blue-600 hover:underline mr-2"
                      >
                        {report.score !== null ? 'Просмотреть' : 'Проверить'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Модалка для оценки отчёта */}
        {selectedReportId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-full overflow-auto p-6">
              <h2 className="text-xl font-semibold mb-4">Оценка отчёта</h2>
              {reports.find(r => r.id === selectedReportId) && (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Студент:</p>
                    <p className="font-medium">
                      {reports.find(r => r.id === selectedReportId)?.attempt.user.fullName}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Текст отчёта:</p>
                    <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                      {reports.find(r => r.id === selectedReportId)?.text}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium">Оценка (0–100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(Number(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium">Комментарий (необязательно)</label>
                    <textarea
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      rows={4}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Ваш комментарий к отчёту..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedReportId(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleGrade(selectedReportId)}
                      disabled={submitting}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Сохранение...' : 'Сохранить оценку'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherSandboxReports;