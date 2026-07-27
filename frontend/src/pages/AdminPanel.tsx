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

interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  published: boolean;
  author: { fullName: string };
  createdAt: string;
  updatedAt: string;
}

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
  user: { fullName: string; email: string };
  responder?: { fullName: string };
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

  // Состояния для сброса пароля
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Состояния для новостей
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsFormError, setNewsFormError] = useState('');
  const [newsFormSuccess, setNewsFormSuccess] = useState('');

  // Состояния для Bug Bounty
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [bugLoading, setBugLoading] = useState(false);
  const [bugError, setBugError] = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [bugMessage, setBugMessage] = useState('');

  // --- Загрузка новостей ---
  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      const res = await api.get('/news');
      setNews(res.data);
    } catch (err) {
      let errorMsg = 'Ошибка загрузки новостей';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setNewsError(errorMsg);
    } finally {
      setNewsLoading(false);
    }
  };

  // --- Загрузка отчётов Bug Bounty ---
  const fetchBugReports = async () => {
    setBugLoading(true);
    setBugError('');
    try {
      const res = await api.get('/bug-reports');
      setBugReports(res.data);
    } catch (err) {
      let errorMsg = 'Ошибка загрузки отчётов';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setBugError(errorMsg);
    } finally {
      setBugLoading(false);
    }
  };

  // --- useEffect ---
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'groups' || activeTab === 'users' || activeTab === 'courses') {
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
      }
      if (activeTab === 'news') {
        await fetchNews();
      }
      if (activeTab === 'bugbounty') {
        await fetchBugReports();
      }
    };
    loadData();
  }, [activeTab]);

  // --- Обработчики форм (управление, группы, пользователи, курсы) ---

  const resetNewsForm = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsImageUrl('');
    setEditingNewsId(null);
    setNewsFormError('');
    setNewsFormSuccess('');
    setShowNewsForm(false);
  };

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/reset-password', {
        username: resetUsername,
        newPassword: resetNewPassword,
      });
      setMessage('✅ Пароль успешно сброшен');
      setResetUsername('');
      setResetNewPassword('');
    } catch (err) {
      let errorMsg = 'Ошибка сброса пароля';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setMessage(errorMsg);
    }
  };

  // --- Обработчики новостей ---
  const handleEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsContent(item.content);
    setNewsImageUrl(item.imageUrl || '');
    setShowNewsForm(true);
    setNewsFormError('');
    setNewsFormSuccess('');
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsFormError('');
    setNewsFormSuccess('');

    if (!newsTitle || !newsContent) {
      setNewsFormError('Название и содержание обязательны');
      return;
    }

    try {
      const payload = { title: newsTitle, content: newsContent, imageUrl: newsImageUrl || null };
      if (editingNewsId) {
        await api.put(`/news/${editingNewsId}`, payload);
        setNewsFormSuccess('✅ Новость обновлена');
      } else {
        await api.post('/news', payload);
        setNewsFormSuccess('✅ Новость создана');
      }
      resetNewsForm();
      await fetchNews();
    } catch (err) {
      let errorMsg = 'Ошибка сохранения новости';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setNewsFormError(errorMsg);
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return;
    try {
      await api.delete(`/news/${id}`);
      setMessage('✅ Новость удалена');
      await fetchNews();
    } catch (err) {
      let errorMsg = 'Ошибка удаления новости';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      setMessage(errorMsg);
    }
  };

  // --- Обработчики Bug Bounty ---
  const handleRespond = async (id: number) => {
    try {
      await api.put(`/bug-reports/${id}/respond`, { adminResponse: responseText, status });
      setBugMessage('✅ Ответ отправлен');
      setRespondingId(null);
      setResponseText('');
      setStatus('IN_PROGRESS');
      await fetchBugReports();
    } catch (err) {
      let msg = 'Ошибка отправки ответа';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setBugMessage(msg);
    }
  };

  const handleDeleteBugReport = async (id: number) => {
    if (!confirm('Удалить этот отчёт?')) return;
    try {
      await api.delete(`/bug-reports/${id}`);
      setBugMessage('✅ Отчёт удалён');
      await fetchBugReports();
    } catch (err) {
      let msg = 'Ошибка удаления отчёта';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setBugMessage(msg);
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
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'news' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('news')}
        >
          Новости
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'bugbounty' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          onClick={() => setActiveTab('bugbounty')}
        >
          Bug Bounty
        </button>
      </div>

      {/* Вкладка: Управление */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* ... (все формы управления) ... */}
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Сброс пароля пользователя</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Логин или Email пользователя</label>
                <input type="text" value={resetUsername} onChange={(e) => setResetUsername(e.target.value)} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Новый пароль</label>
                <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className="w-full border rounded px-3 py-2" required minLength={6} />
              </div>
              <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Сбросить пароль</button>
            </form>
          </div>
        </div>
      )}

      {/* Вкладка: Группы */}
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

      {/* Вкладка: Пользователи */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? <div className="text-center py-12">Загрузка...</div> : users.length === 0 ? <p className="p-6 text-gray-500">Пользователи не найдены</p> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.fullName}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.groupId || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Вкладка: Курсы */}
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

      {/* Вкладка: Новости */}
      {activeTab === 'news' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Управление новостями</h2>
            <button
              onClick={() => {
                resetNewsForm();
                setShowNewsForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Создать новость
            </button>
          </div>

          {newsFormSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{newsFormSuccess}</div>}
          {newsFormError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{newsFormError}</div>}

          {showNewsForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">{editingNewsId ? 'Редактировать новость' : 'Создать новость'}</h3>
              <form onSubmit={handleSubmitNews} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Название</label>
                  <input
                    type="text"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Содержание</label>
                  <textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    rows={5}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Ссылка на изображение (необязательно)</label>
                  <input
                    type="text"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    {editingNewsId ? 'Обновить' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={resetNewsForm}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          {newsLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : newsError ? (
            <div className="text-red-500 text-center py-8">{newsError}</div>
          ) : news.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Новостей пока нет</p>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.content}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.author.fullName} • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditNews(item)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Bug Bounty */}
      {activeTab === 'bugbounty' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Управление отчётами Bug Bounty</h2>
          </div>

          {bugMessage && (
            <div className={`p-3 mb-4 rounded ${bugMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {bugMessage}
            </div>
          )}

          {bugLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : bugError ? (
            <div className="text-red-500 text-center py-8">{bugError}</div>
          ) : bugReports.length === 0 ? (
            <p className="text-gray-500">Нет отчётов</p>
          ) : (
            <div className="space-y-4">
              {bugReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
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
                      <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                      {report.steps && <p className="text-gray-500 text-sm mt-1"><span className="font-medium">Шаги:</span> {report.steps}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Автор: {report.user.fullName} ({report.user.email}) • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      {report.adminResponse && (
                        <div className="mt-2 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-gray-700">Ответ:</p>
                          <p className="text-sm text-gray-600">{report.adminResponse}</p>
                          {report.responder && (
                            <p className="text-xs text-gray-400 mt-1">Ответил: {report.responder.fullName}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {!report.adminResponse && (
                        <button
                          onClick={() => setRespondingId(report.id)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ответить
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBugReport(report.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {respondingId === report.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="space-y-3">
                        <textarea
                          placeholder="Ваш ответ..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          className="w-full border rounded px-3 py-2"
                        />
                        <div className="flex items-center space-x-4">
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border rounded px-3 py-2"
                          >
                            <option value="IN_PROGRESS">В работе</option>
                            <option value="RESOLVED">Решён</option>
                            <option value="WONTFIX">Не будет исправлено</option>
                            <option value="CLOSED">Закрыт</option>
                          </select>
                          <button
                            onClick={() => handleRespond(report.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Отправить ответ
                          </button>
                          <button
                            onClick={() => setRespondingId(null)}
                            className="text-gray-500 hover:underline"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;