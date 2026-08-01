import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  UserCircleIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  UserGroupIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, XCircleIcon as XCircleSolid } from '@heroicons/react/24/solid';

interface UserStats {
  totalCourses: number;
  completedTasks: number;
  averageScore: number;
  achievements: { id: number; name: string; description: string; icon: string; earnedAt: string }[];
}

interface TaskHistoryItem {
  id: number;
  taskTitle: string;
  courseTitle: string;
  score: number | null;
  status: string;
  completedAt: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/profile/stats');
        setStats(res.data);
      } catch {
        setError('Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/profile/history');
        setHistory(res.data);
      } catch {
        setHistoryError('Ошибка загрузки истории');
      } finally {
        setHistoryLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      setIsChangingPassword(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен быть не менее 6 символов');
      setIsChangingPassword(false);
      return;
    }

    try {
      await api.post('/profile/change-password', {
        oldPassword,
        newPassword,
      });
      setPasswordSuccess('✅ Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      let msg = 'Ошибка смены пароля';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <UserCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, войдите, чтобы просмотреть профиль</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Личный кабинет
        </h1>

        {/* Информация о пользователе */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {user.fullName.charAt(0)}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{user.fullName}</h2>
              <div className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <KeyIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">Логин:</span> {user.username}
                </p>
                <p className="flex items-center justify-center sm:justify-start gap-2">
                  <UserCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">Роль:</span> 
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                    user.role === 'TEACHER' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {user.role}
                  </span>
                </p>
                {user.groupId && (
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <UserGroupIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">Группа:</span> {user.groupId}
                  </p>
                )}
                {user.studentNumber && (
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <PlusCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">Номер по списку:</span> {user.studentNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <LockClosedIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Смена пароля
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текущий пароль</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый пароль</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockOpenIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Подтвердите новый пароль</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>
            {passwordError && (
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Смена...
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  Сменить пароль
                </>
              )}
            </button>
          </form>
        </div>

        {/* Статистика */}
        {loading ? (
          <div className="flex items-center justify-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Загрузка статистики...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
            <XCircleIcon className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCourses}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Курсов пройдено</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Заданий выполнено</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <ChartBarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averageScore}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Средний балл</p>
              </div>
            </div>

            {/* Достижения */}
            {stats.achievements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                  Достижения
                </h3>
                <div className="flex flex-wrap gap-3">
                  {stats.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="group bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-4 py-2 flex items-center gap-2 transition shadow-sm hover:shadow-md"
                      title={ach.description}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{ach.icon}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ach.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* История выполненных заданий */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            История выполненных заданий
          </h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
              <span>Загрузка истории...</span>
            </div>
          ) : historyError ? (
            <div className="text-center py-4 text-red-500 dark:text-red-400">
              <XCircleIcon className="w-10 h-10 mx-auto mb-2" />
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p>Вы ещё не выполнили ни одного задания</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Задание</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Курс</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Оценка</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.taskTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.courseTitle}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.score !== null ? `${item.score}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.status === 'PASSED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : item.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          }`}
                        >
                          {item.status === 'PASSED' ? (
                            <CheckCircleSolid className="w-3.5 h-3.5" />
                          ) : item.status === 'FAILED' ? (
                            <XCircleSolid className="w-3.5 h-3.5" />
                          ) : (
                            <ClockIcon className="w-3.5 h-3.5" />
                          )}
                          {item.status === 'PASSED'
                            ? 'Выполнено'
                            : item.status === 'FAILED'
                            ? 'Неверно'
                            : 'Ожидает проверки'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {item.completedAt ? (
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            {new Date(item.completedAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;