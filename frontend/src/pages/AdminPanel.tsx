import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface Group {
  id: number;
  name: string;
  prefix: string;
  year: number;
  students: { id: number; fullName: string; studentNumber: number; username: string; email: string }[];
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  groupId: number | null;
  studentNumber: number | null;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacherId: number;
  teacher: { id: number; fullName: string; email: string };
  createdAt: string;
}

const AdminPanel = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('manage');
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Состояния для форм
  const [groupName, setGroupName] = useState('');
  const [groupPrefix, setGroupPrefix] = useState('');
  const [groupYear, setGroupYear] = useState(new Date().getFullYear());
  const [studentsInput, setStudentsInput] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // Загрузка данных для просмотра
  useEffect(() => {
    if (activeTab === 'groups' || activeTab === 'users' || activeTab === 'courses') {
      const fetchData = async () => {
        setLoading(true);
        setMessage('');
        try {
          if (activeTab === 'groups') {
            const res = await api.get('/admin/groups');
            setGroups(res.data);
          } else if (activeTab === 'users') {
            const res = await api.get('/admin/users');
            setUsers(res.data);
          } else if (activeTab === 'courses') {
            const res = await api.get('/admin/courses');
            setCourses(res.data);
          }
        } catch (err) {
          let errorMsg = 'Ошибка загрузки данных';
          if (err && typeof err === 'object' && 'response' in err) {
            const errObj = err as { response?: { data?: { error?: string } } };
            errorMsg = errObj.response?.data?.error || errorMsg;
          }
          setMessage(errorMsg);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [activeTab]);

  // Обработчики форм
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/groups', { name: groupName, prefix: groupPrefix, year: groupYear });
      setMessage('✅ Группа создана');
      setGroupName('');
      setGroupPrefix('');
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
          return { fullName: parts[0]?.trim() || '', studentNumber: parseInt(parts[1]?.trim() || '0') };
        })
        .filter(s => s.fullName && s.studentNumber > 0);
      if (students.length === 0) {
        setMessage('❌ Введите данные в формате: ФИО\tНомер (каждый студент с новой строки)');
        return;
      }
      await api.post('/admin/students', { groupId: parseInt(selectedGroupId), students });
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

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/teachers', {
        username: teacherUsername,
        email: teacherEmail,
        fullName: teacherFullName,
        password: teacherPassword,
      });
      setMessage('✅ Преподаватель создан');
      setTeacherUsername('');
      setTeacherEmail('');
      setTeacherFullName('');
      setTeacherPassword('');
    } catch (err) {
      let errorMsg = 'Ошибка создания преподавателя';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setMessage(errorMsg);
    }
  };

  // Обработчик сброса пароля для пользователя (админ)
  const handleResetPasswordForUser = async (username: string) => {
    if (!confirm(`Сбросить пароль для пользователя ${username} до стандартного (123456)?`)) return;
    try {
      await api.post('/admin/reset-password', {
        username: username,
        newPassword: '123456',
      });
      setMessage(`✅ Пароль для ${username} сброшен до 123456`);
    } catch (err) {
      let errorMsg = 'Ошибка сброса пароля';
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
    <div>
      {message && (
        <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-4 border-b mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'manage' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('manage')}
        >
          Управление
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('groups')}
        >
          Группы
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('courses')}
        >
          Курсы
        </button>
      </div>

      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Создание группы */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Создать группу</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Название группы</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Префикс (для логинов)</label>
                <input type="text" value={groupPrefix} onChange={(e) => setGroupPrefix(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Год</label>
                <input type="number" value={groupYear} onChange={(e) => setGroupYear(parseInt(e.target.value))} className="w-full border rounded px-3 py-2" required />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Создать группу</button>
            </form>
          </div>

          {/* Добавление студентов */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Добавить студентов в группу</h2>
            <form onSubmit={handleAddStudents} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Выберите группу</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full border rounded px-3 py-2">
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.prefix})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Список студентов (ФИО\tНомер, каждый с новой строки)</label>
                <textarea value={studentsInput} onChange={(e) => setStudentsInput(e.target.value)} rows={6} className="w-full border rounded px-3 py-2 font-mono text-sm" placeholder="Иванов Иван	1&#10;Петров Петр	2" />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Добавить студентов</button>
            </form>
          </div>

          {/* Создание преподавателя */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Создать преподавателя</h2>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Логин</label>
                <input type="text" value={teacherUsername} onChange={(e) => setTeacherUsername(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Полное имя</label>
                <input type="text" value={teacherFullName} onChange={(e) => setTeacherFullName(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Пароль</label>
                <input type="password" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} className="w-full border rounded px-3 py-2" required minLength={6} />
              </div>
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Создать преподавателя</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-6">
          {loading ? <div className="text-center py-12">Загрузка...</div> : groups.length === 0 ? <p className="text-gray-500">Группы не найдены</p> : groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{group.name} ({group.prefix}) – {group.year} год</h3>
                  <span className="text-sm text-gray-500">Студентов: {group.students.length}</span>
                </div>
              </div>
              {group.students.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th></tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.students.map((student) => (
                      <tr key={student.id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentNumber}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.fullName}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email || '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="px-6 py-4 text-gray-500">В группе нет студентов</div>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? <div className="text-center py-12">Загрузка...</div> : users.length === 0 ? <p className="p-6 text-gray-500">Пользователи не найдены</p> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.groupId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleResetPasswordForUser(u.username)}
                        className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-xs"
                      >
                        Сбросить пароль
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? <div className="text-center py-12">Загрузка...</div> : courses.length === 0 ? <p className="p-6 text-gray-500">Курсы не найдены</p> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Преподаватель</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td><td className="px-6 py-4 text-sm text-gray-500">{course.description || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.teacher.fullName}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;