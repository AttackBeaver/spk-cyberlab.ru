import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

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

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadData = async () => {
    console.log('📡 loadData вызван, taskId:', taskId);
    if (!taskId) {
      console.error('❌ taskId отсутствует');
      setLoading(false);
      setError('Не указан идентификатор задания');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/sandbox/tasks/${taskId}/reports`),
        api.get(`/sandbox/tasks/${taskId}/statistics`),
      ]);
      console.log('✅ Данные получены');
      if (isMounted.current) {
        setReports(reportsRes.data);
        setStatistics(statsRes.data);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      if (isMounted.current) {
        const errorObj = err as ApiError;
        setError(errorObj.response?.data?.error || 'Ошибка загрузки данных');
      }
    } finally {
      console.log('🏁 Загрузка завершена, устанавливаем loading=false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await loadData();
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

  const handleExportCSV = async () => {
    if (!taskId) return;
    try {
      const response = await api.get(`/sandbox/tasks/${taskId}/export-csv`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `results_task_${taskId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorObj = err as ApiError;
      alert(errorObj.response?.data?.error || 'Ошибка экспорта CSV');
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Загрузка отчётов...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <XCircleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Повторить
          </button>
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
            <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Отчёты по заданию: {statistics?.task.title || 'Загрузка...'}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-md text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Экспорт CSV
            </button>
            <button
              onClick={() => navigate('/teacher/sandbox')}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Назад к управлению
            </button>
          </div>
        </div>

        {/* Сообщения об успехе/ошибке */}
        {successMessage && (
          <div className="flex items-start gap-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-xl mb-6">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-6">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Статистика */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <HashtagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.attempts.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Всего попыток</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.attempts.passed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Выполнено</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.reports.pending}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Отчётов на проверку</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex justify-center mb-2">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.scores.average.toFixed(1)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Средний балл</p>
            </div>
          </div>
        )}

        {/* Таблица отчётов */}
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Нет отчётов для этого задания</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Студент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Группа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус попытки</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Отчёт</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Оценка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{report.attempt.user.fullName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{report.attempt.user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {report.attempt.user.group?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            report.attempt.status === 'PASSED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : report.attempt.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : report.attempt.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                          }`}
                        >
                          {report.attempt.status === 'PASSED' && <CheckCircleIcon className="w-3.5 h-3.5" />}
                          {report.attempt.status === 'FAILED' && <XCircleIcon className="w-3.5 h-3.5" />}
                          {report.attempt.status === 'PENDING' && <ClockIcon className="w-3.5 h-3.5" />}
                          {report.attempt.status === 'TIME_EXPIRED' && <ClockIcon className="w-3.5 h-3.5" />}
                          {report.attempt.status === 'PASSED' && 'Выполнено'}
                          {report.attempt.status === 'FAILED' && 'Неверно'}
                          {report.attempt.status === 'PENDING' && 'На проверке'}
                          {report.attempt.status === 'TIME_EXPIRED' && 'Время истекло'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {report.text.length > 60 ? report.text.slice(0, 60) + '…' : report.text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.score !== null ? (
                          <span className="text-gray-900 dark:text-gray-100">{report.score}%</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openReport(report)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                        >
                          {report.score !== null ? (
                            <>
                              <EyeIcon className="w-4 h-4" />
                              Просмотреть
                            </>
                          ) : (
                            <>
                              <PencilSquareIcon className="w-4 h-4" />
                              Проверить
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно оценки отчёта */}
      {selectedReportId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <PencilSquareIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Оценка отчёта
              </h2>
              <button
                onClick={() => setSelectedReportId(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {reports.find(r => r.id === selectedReportId) && (() => {
              const report = reports.find(r => r.id === selectedReportId)!;
              return (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Студент</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                      {report.attempt.user.fullName}
                      <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                        ({report.attempt.user.username})
                      </span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Текст отчёта</p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto">
                      {report.text}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Оценка (0–100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Комментарий (необязательно)
                    </label>
                    <textarea
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="Ваш комментарий к отчёту..."
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={() => setSelectedReportId(null)}
                      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Отмена
                    </button>
                    <button
                      // eslint-disable-next-line react-hooks/refs
                      onClick={() => handleGrade(selectedReportId)}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          Сохранить оценку
                        </>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherSandboxReports;