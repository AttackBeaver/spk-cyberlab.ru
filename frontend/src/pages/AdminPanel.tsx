import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface Group {
  id: number;
  name: string;
  prefix: string;
  year: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupPrefix, setGroupPrefix] = useState('');
  const [groupYear, setGroupYear] = useState(new Date().getFullYear());
  const [studentsInput, setStudentsInput] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/auth/groups');
        setGroups(res.data);
        if (res.data.length > 0) setSelectedGroupId(res.data[0].id.toString());
      } catch {
        setMessage('Ошибка загрузки групп');
      }
    };
    if (user?.role === 'ADMIN') loadGroups();
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/groups', {
        name: groupName,
        prefix: groupPrefix,
        year: groupYear,
      });
      setMessage('✅ Группа создана');
      setGroupName('');
      setGroupPrefix('');
      const res = await api.get('/auth/groups');
      setGroups(res.data);
    } catch (err) {
      let errorMsg = 'Ошибка создания группы';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setMessage(errorMsg);
    }
  };

  const handleAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const students = studentsInput.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split('\t');
          return {
            fullName: parts[0]?.trim() || '',
            studentNumber: parseInt(parts[1]?.trim() || '0'),
          };
        })
        .filter(s => s.fullName && s.studentNumber > 0);

      if (students.length === 0) {
        setMessage('❌ Введите данные в формате: ФИО\tНомер (каждый студент с новой строки)');
        return;
      }

      await api.post('/admin/students', {
        groupId: parseInt(selectedGroupId),
        students,
      });
      setMessage(`✅ Добавлено ${students.length} студентов`);
      setStudentsInput('');
    } catch (err) {
      let errorMsg = 'Ошибка добавления студентов';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setMessage(errorMsg);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-red-500">Доступ запрещён. Только для администратора.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Административная панель</h1>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Создать группу</h2>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Название группы</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Префикс (для логинов)</label>
            <input
              type="text"
              value={groupPrefix}
              onChange={(e) => setGroupPrefix(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Год</label>
            <input
              type="number"
              value={groupYear}
              onChange={(e) => setGroupYear(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Создать группу
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Добавить студентов в группу</h2>
        <form onSubmit={handleAddStudents} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Выберите группу</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.prefix})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Список студентов (ФИО\tНомер, каждый с новой строки)
            </label>
            <textarea
              value={studentsInput}
              onChange={(e) => setStudentsInput(e.target.value)}
              rows={6}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              placeholder="Иванов Иван	1&#10;Петров Петр	2"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Добавить студентов
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Сброс пароля пользователя</h2>
        <p className="text-gray-500">Функция будет добавлена позже</p>
      </div>
    </div>
  );
};

export default AdminPanel;