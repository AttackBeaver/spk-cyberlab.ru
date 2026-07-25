import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Регистрация студента</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Группа</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
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
            <label className="block text-gray-700">Номер по списку</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Полное имя</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Пароль</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">✅ Регистрация успешна! Вы вошли в систему.</p>}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
          >
            Зарегистрироваться
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Уже есть аккаунт? <a href="/login" className="text-blue-600">Войти</a>
        </p>
      </div>
    </div>
  );
};

export default Register;