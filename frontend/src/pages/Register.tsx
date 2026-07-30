import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface Group {
  id: number;
  name: string;
  prefix: string;
}

const Register = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { registerStudent, login } = useAuth();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/auth/groups');
        setGroups(res.data);
        if (res.data.length > 0) setGroupId(res.data[0].id.toString());
      } catch {
        setError('Не удалось загрузить группы');
      }
    };
    loadGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await registerStudent({
        groupId: parseInt(groupId),
        studentNumber: parseInt(studentNumber),
        password,
        fullName,
      });
      const selectedGroup = groups.find(g => g.id === parseInt(groupId));
      const username = `${selectedGroup?.prefix || selectedGroup?.name}-${String(studentNumber).padStart(2, '0')}`;
      await login(username, password);
      setSuccess(true);
      alert('Регистрация и вход выполнены!');
      window.location.href = '/';
    } catch (err) {
      let errorMsg = 'Ошибка регистрации';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Регистрация студента</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Группа</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Номер по списку</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Полное имя</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Пароль</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 dark:text-green-400 text-sm mb-4">✅ Регистрация успешна! Вы вошли в систему.</p>}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white py-2 rounded-md transition"
          >
            Зарегистрироваться
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;