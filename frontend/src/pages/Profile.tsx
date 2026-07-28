import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';

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

  // Состояния для истории заданий
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  // Состояния для смены пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен быть не менее 6 символов');
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
    }
  };

  if (!user) return <Layout><div className="text-center py-8">Пожалуйста, войдите</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>

        {/* Информация о пользователе */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.fullName}</h2>
              <p className="text-gray-600">Логин: {user.username}</p>
              <p className="text-gray-600">Роль: {user.role}</p>
              {user.groupId && <p className="text-gray-600">Группа: {user.groupId}</p>}
              {user.studentNumber && <p className="text-gray-600">Номер по списку: {user.studentNumber}</p>}
            </div>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Смена пароля</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium">Текущий пароль</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Подтвердите новый пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
            {passwordSuccess && <div className="text-green-500 text-sm">{passwordSuccess}</div>}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Сменить пароль
            </button>
          </form>
        </div>

        {/* Статистика */}
        {loading ? (
          <div className="text-center py-8">Загрузка статистики...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalCourses}</p>
                <p className="text-sm text-gray-500">Курсов пройдено</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                <p className="text-sm text-gray-500">Заданий выполнено</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
                <p className="text-sm text-gray-500">Средний балл</p>
              </div>
            </div>

            {/* Достижения */}
            {stats.achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Достижения</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.achievements.map((ach) => (
                    <div key={ach.id} className="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-2">
                      <span className="text-2xl">{ach.icon}</span>
                      <span className="text-sm font-medium">{ach.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* История выполненных заданий */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">История выполненных заданий</h3>
          {historyLoading ? (
            <div className="text-center py-4">Загрузка истории...</div>
          ) : historyError ? (
            <div className="text-red-500 text-center py-4">{historyError}</div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Вы ещё не выполнили ни одного задания</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Задание</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Курс</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.taskTitle}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.courseTitle}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.score !== null ? `${item.score}%` : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'PASSED'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status === 'PASSED'
                            ? '✅ Выполнено'
                            : item.status === 'FAILED'
                            ? '❌ Неверно'
                            : '⏳ Ожидает проверки'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '—'}
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