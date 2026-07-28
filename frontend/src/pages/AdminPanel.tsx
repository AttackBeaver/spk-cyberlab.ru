import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ---------- Интерфейсы ----------
interface Group {
  id: number;
  name: string;
  prefix: string;
  year: number;
  students: {
    id: number;
    fullName: string;
    studentNumber: number;
    username: string;
    // email удалён
  }[];
}

interface User {
  id: number;
  username: string;
  // email удалён
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
  teacher: { id: number; fullName: string }; // email удалён
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
  user: { fullName: string }; // email удалён
  responder?: { fullName: string };
}

// Тип для модального окна
type ModalType =
  | 'createGroup'
  | 'addStudents'
  | 'editUser'
  | 'createTeacher'
  | 'createCourse'
  | 'editCourse'
  | 'editGroup'
  | null;

// Тип для ошибки API
type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

// Тип для payload при создании курса
type CreateCoursePayload = {
  title: string;
  description: string;
  teacherId: number | null;
  groupIds?: number[];
};

// ---------- Компонент ----------
const AdminPanel = () => {
  const { user } = useAuth();

  // ---- Вкладки ----
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'teachers' | 'courses' | 'news' | 'bugbounty'>('groups');

  // ---- Данные ----
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);

  // ---- Состояния загрузки и ошибок ----
  const [loading] = useState(false);
  const [message, setMessage] = useState('');

  // ---- Фильтры для студентов ----
  const [filterGroupId, setFilterGroupId] = useState<number | 'all'>('all');

  // ---- Модальные окна ----
  const [modalType, setModalType] = useState<ModalType>(null);

  // ---- Формы ----
  // Создание группы
  const [groupName, setGroupName] = useState('');
  const [groupPrefix, setGroupPrefix] = useState('');
  const [groupYear, setGroupYear] = useState(new Date().getFullYear());

  // Добавление студентов (ручной ввод и файл)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [studentsInput, setStudentsInput] = useState('');
  const [studentsFile, setStudentsFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Редактирование пользователя
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  // editEmail удалён

  // Создание преподавателя
  const [teacherUsername, setTeacherUsername] = useState('');
  // teacherEmail удалён
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // Создание курса
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseTeacherId, setCourseTeacherId] = useState<number | null>(null);
  const [courseGroupIds, setCourseGroupIds] = useState<number[]>([]);

  // ---- Новости ----
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsFormError, setNewsFormError] = useState('');
  const [newsFormSuccess, setNewsFormSuccess] = useState('');

  // ---- Bug Bounty ----
  const [bugLoading, setBugLoading] = useState(false);
  const [bugError, setBugError] = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [bugMessage, setBugMessage] = useState('');

  // ---- Загрузка данных ----
  const fetchGroups = async () => {
    try {
      const res = await api.get('/admin/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Ошибка загрузки групп', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Ошибка загрузки курсов', err);
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      const res = await api.get('/news');
      setNews(res.data);
    } catch {
      setNewsError('Ошибка загрузки новостей');
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchBugReports = async () => {
    setBugLoading(true);
    setBugError('');
    try {
      const res = await api.get('/bug-reports');
      setBugReports(res.data);
    } catch {
      setBugError('Ошибка загрузки отчётов');
    } finally {
      setBugLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'groups') {
        await fetchGroups();
      } else if (activeTab === 'students' || activeTab === 'teachers') {
        await fetchUsers();
      } else if (activeTab === 'courses') {
        await fetchCourses();
      } else if (activeTab === 'news') {
        await fetchNews();
      } else if (activeTab === 'bugbounty') {
        await fetchBugReports();
      }
    };
    loadData();
  }, [activeTab]);

  // ---- Вспомогательные функции ----
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  // ---- Группы ----
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/groups', { name: groupName, prefix: groupPrefix, year: groupYear });
      showMessage('✅ Группа создана');
      setGroupName('');
      setGroupPrefix('');
      setGroupYear(new Date().getFullYear());
      setModalType(null);
      await fetchGroups();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка создания группы');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Удалить группу и всех студентов в ней?')) return;
    try {
      await api.delete(`/admin/groups/${groupId}`);
      showMessage('✅ Группа удалена');
      await fetchGroups();
      await fetchUsers();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка удаления группы');
    }
  };

  const handleAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      showMessage('❌ Выберите группу');
      return;
    }
    // Сначала парсим ручной ввод
    let studentsList: { fullName: string; studentNumber: number }[] = [];
    if (studentsInput.trim()) {
      studentsList = studentsInput
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          let parts = line.split('\t');
          if (parts.length < 2) {
            const lastSpaceIdx = line.lastIndexOf(' ');
            if (lastSpaceIdx === -1) return null;
            parts = [line.substring(0, lastSpaceIdx).trim(), line.substring(lastSpaceIdx + 1).trim()];
          }
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const num = parseInt(parts[1].trim());
            if (name && !isNaN(num)) {
              return { fullName: name, studentNumber: num };
            }
          }
          return null;
        })
        .filter((s): s is { fullName: string; studentNumber: number } => s !== null);
    }

    // Если есть файл, читаем его
    if (studentsFile) {
      try {
        const text = await studentsFile.text();
        const lines = text.split('\n').filter((line) => line.trim());
        let sep = '\t';
        if (lines.length > 0) {
          const first = lines[0];
          if (first.includes('\t')) sep = '\t';
          else if (first.includes(';')) sep = ';';
          else if (first.includes(',')) sep = ',';
        }
        const fileStudents = lines
          .map((line) => {
            const parts = line.split(sep);
            if (parts.length >= 2) {
              const name = parts[0].trim();
              const num = parseInt(parts[1].trim());
              if (name && !isNaN(num)) {
                return { fullName: name, studentNumber: num };
              }
            }
            return null;
          })
          .filter((s): s is { fullName: string; studentNumber: number } => s !== null);
        studentsList = [...studentsList, ...fileStudents];
      } catch {
        showMessage('❌ Ошибка чтения файла');
        return;
      }
    }

    if (studentsList.length === 0) {
      showMessage('❌ Нет студентов для добавления');
      return;
    }

    try {
      await api.post('/admin/students', { groupId: selectedGroupId, students: studentsList });
      showMessage(`✅ Добавлено ${studentsList.length} студентов`);
      setStudentsInput('');
      setStudentsFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setModalType(null);
      await fetchGroups();
      await fetchUsers();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка добавления студентов');
    }
  };

  // ---- Студенты и преподаватели ----
  const getStudents = () => users.filter((u) => u.role === 'STUDENT');
  const getTeachers = () => users.filter((u) => u.role === 'TEACHER' || u.role === 'ADMIN');

  const filteredStudents = getStudents()
    .filter((s) => {
      if (filterGroupId === 'all') return true;
      return s.groupId === filterGroupId;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const sortedTeachers = getTeachers().sort((a, b) => {
    if (a.role === 'ADMIN') return -1;
    if (b.role === 'ADMIN') return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  const handleResetPassword = async (username: string) => {
    if (!confirm(`Сбросить пароль пользователю ${username} на "123456"?`)) return;
    try {
      await api.post('/admin/reset-password', { username, newPassword: '123456' });
      showMessage(`✅ Пароль пользователя ${username} сброшен на 123456`);
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка сброса пароля');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Удалить пользователя ${username}?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showMessage(`✅ Пользователь ${username} удалён`);
      await fetchUsers();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка удаления пользователя');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;
    try {
      await api.put(`/admin/users/${editUserId}`, {
        username: editUsername,
        fullName: editFullName,
        // email удалён
      });
      showMessage('✅ Данные пользователя обновлены');
      setModalType(null);
      await fetchUsers();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка обновления данных');
    }
  };

  const openEditUserModal = (user: User) => {
    setEditUserId(user.id);
    setEditUsername(user.username || '');
    setEditFullName(user.fullName);
    // editEmail не используется
    setModalType('editUser');
  };

  // ---- Преподаватели ----
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/teachers', {
        username: teacherUsername,
        // email удалён
        fullName: teacherFullName,
        password: teacherPassword,
      });
      showMessage('✅ Преподаватель создан');
      setTeacherUsername('');
      setTeacherFullName('');
      setTeacherPassword('');
      setModalType(null);
      await fetchUsers();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка создания преподавателя');
    }
  };

  // ---- Курсы ----
  const handleCreateCourse = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const payload: CreateCoursePayload = {
          title: courseTitle,
          description: courseDescription,
          teacherId: courseTeacherId,
        };
        if (courseGroupIds.length) payload.groupIds = courseGroupIds;
        await api.post('/courses', payload);
        showMessage('✅ Курс создан');
        setCourseTitle('');
        setCourseDescription('');
        setCourseTeacherId(null);
        setCourseGroupIds([]);
        setModalType(null);
        await fetchCourses();
      } catch (err) {
        const error = err as ApiError;
        showMessage(error.response?.data?.error || '❌ Ошибка создания курса');
      }
    };

  const handleDeleteCourse = async (courseId: number) => {
      if (!confirm('Удалить курс?')) return;
      try {
        await api.delete(`/courses/${courseId}`);
        showMessage('✅ Курс удалён');
        await fetchCourses();
      } catch (err) {
        const error = err as ApiError;
        showMessage(error.response?.data?.error || '❌ Ошибка удаления курса');
      }
    };

  // ---- Новости ----
  const resetNewsForm = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsImageUrl('');
    setEditingNewsId(null);
    setNewsFormError('');
    setNewsFormSuccess('');
    setShowNewsForm(false);
  };

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
    } catch {
      setNewsFormError('Ошибка сохранения новости');
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Удалить новость?')) return;
    try {
      await api.delete(`/news/${id}`);
      showMessage('✅ Новость удалена');
      await fetchNews();
    } catch {
      showMessage('❌ Ошибка удаления новости');
    }
  };

  // ---- Bug Bounty ----
  const handleRespond = async (id: number) => {
    try {
      await api.put(`/bug-reports/${id}/respond`, { adminResponse: responseText, status });
      setBugMessage('✅ Ответ отправлен');
      setRespondingId(null);
      setResponseText('');
      setStatus('IN_PROGRESS');
      await fetchBugReports();
    } catch {
      setBugMessage('❌ Ошибка отправки ответа');
    }
  };

  const handleDeleteBugReport = async (id: number) => {
    if (!confirm('Удалить отчёт?')) return;
    try {
      await api.delete(`/bug-reports/${id}`);
      setBugMessage('✅ Отчёт удалён');
      await fetchBugReports();
    } catch {
      setBugMessage('❌ Ошибка удаления отчёта');
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

  // ---- Рендер модальных окон ----
  const renderModal = () => {
    if (!modalType) return null;

    const closeModal = () => setModalType(null);

    switch (modalType) {
      case 'createGroup':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-full overflow-auto">
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
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Отмена
                  </button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'addStudents':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-full overflow-auto">
              <h2 className="text-xl font-semibold mb-4">Добавить студентов</h2>
              <form onSubmit={handleAddStudents} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Выберите группу</label>
                  <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">-- Выберите --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.prefix})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Ручной ввод (ФИО\tНомер, каждый с новой строки)</label>
                  <textarea
                    value={studentsInput}
                    onChange={(e) => setStudentsInput(e.target.value)}
                    rows={5}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    placeholder="Иванов Иван\t1&#10;Петров Петр\t2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Или импортировать из CSV/Excel (первая колонка - ФИО, вторая - номер)</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setStudentsFile(file);
                    }}
                    ref={fileInputRef}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Отмена
                  </button>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'editUser':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Редактировать пользователя</h2>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Логин</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Полное имя</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                {/* поле Email удалено */}
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Отмена
                  </button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'createTeacher':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Создать преподавателя</h2>
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Логин</label>
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                {/* поле Email удалено */}
                <div>
                  <label className="block text-sm font-medium">Полное имя</label>
                  <input
                    type="text"
                    value={teacherFullName}
                    onChange={(e) => setTeacherFullName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Пароль</label>
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Отмена
                  </button>
                  <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'createCourse':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Создать курс</h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Название</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Описание</label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Преподаватель</label>
                  <select
                    value={courseTeacherId || ''}
                    onChange={(e) => setCourseTeacherId(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">-- Выберите --</option>
                    {getTeachers().map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Группы (зажмите Ctrl для множественного выбора)</label>
                  <select
                    multiple
                    value={courseGroupIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                      setCourseGroupIds(selected);
                    }}
                    className="w-full border rounded px-3 py-2"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Отмена
                  </button>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ---- Основной рендер ----
  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-red-500">Доступ запрещён. Только для администратора.</div>;
  }

  return (
    <div>
      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Вкладки */}
      <div className="flex space-x-4 border-b mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('groups')}
        >
          Группы
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'students' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('students')}
        >
          Студенты
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'teachers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('teachers')}
        >
          Преподаватели
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('courses')}
        >
          Курсы
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'news' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('news')}
        >
          Новости
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === 'bugbounty' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('bugbounty')}
        >
          Bug Bounty
        </button>
      </div>

      {/* ---------- ГРУППЫ ---------- */}
      {activeTab === 'groups' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Управление группами</h2>
            <button
              onClick={() => {
                setGroupName('');
                setGroupPrefix('');
                setGroupYear(new Date().getFullYear());
                setModalType('createGroup');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Создать группу
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : groups.length === 0 ? (
            <p className="text-gray-500">Группы не найдены</p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {group.name} ({group.prefix}) – {group.year} год
                      </h3>
                      <span className="text-sm text-gray-500">Студентов: {(group.students || []).length}</span>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setStudentsInput('');
                          setStudentsFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          setModalType('addStudents');
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        + Добавить студентов
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Удалить группу
                      </button>
                    </div>
                  </div>
                  {(group.students || []).length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th>
                          {/* столбец Email удалён */}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(group.students || []).map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-6 py-4 text-gray-500">В группе нет студентов</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- СТУДЕНТЫ ---------- */}
      {activeTab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Студенты</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Группа:</label>
              <select
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                <option value="all">Все</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500">Студенты не найдены</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const group = groups.find((g) => g.id === student.groupId);
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group ? group.name : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => openEditUserModal(student)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mr-1"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleResetPassword(student.username || '')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs mr-1"
                          >
                            Сброс пароля
                          </button>
                          <button
                            onClick={() => handleDeleteUser(student.id, student.username || student.fullName)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- ПРЕПОДАВАТЕЛИ ---------- */}
      {activeTab === 'teachers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Преподаватели и администраторы</h2>
            <button
              onClick={() => {
                setTeacherUsername('');
                setTeacherFullName('');
                setTeacherPassword('');
                setModalType('createTeacher');
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              + Создать преподавателя
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : sortedTeachers.length === 0 ? (
            <p className="text-gray-500">Преподаватели не найдены</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Логин</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.username || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openEditUserModal(teacher)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mr-1"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleResetPassword(teacher.username || '')}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs mr-1"
                        >
                          Сброс пароля
                        </button>
                        {user?.id !== teacher.id && (
                          <button
                            onClick={() => handleDeleteUser(teacher.id, teacher.username || teacher.fullName)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Удалить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- КУРСЫ ---------- */}
      {activeTab === 'courses' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Управление курсами</h2>
            <button
              onClick={() => {
                setCourseTitle('');
                setCourseDescription('');
                setCourseTeacherId(null);
                setCourseGroupIds([]);
                setModalType('createCourse');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Создать курс
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : courses.length === 0 ? (
            <p className="text-gray-500">Курсы не найдены</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Преподаватель</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{course.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.teacher.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            // TODO: добавить редактирование курса
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mr-1"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- НОВОСТИ ---------- */}
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
                  <label className="block text-sm font-medium">Ссылка на изображение</label>
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
                  <button type="button" onClick={resetNewsForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
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
                    <button onClick={() => handleEditNews(item)} className="text-blue-600 hover:underline text-sm">
                      Редактировать
                    </button>
                    <button onClick={() => handleDeleteNews(item.id)} className="text-red-600 hover:underline text-sm">
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- BUG BOUNTY ---------- */}
      {activeTab === 'bugbounty' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Управление отчётами Bug Bounty</h2>
          </div>

          {bugMessage && (
            <div
              className={`p-3 mb-4 rounded ${
                bugMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
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
                      {report.steps && (
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">Шаги:</span> {report.steps}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Автор: {report.user.fullName} • {new Date(report.createdAt).toLocaleDateString()}
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
                        <button onClick={() => setRespondingId(report.id)} className="text-blue-600 hover:underline text-sm">
                          Ответить
                        </button>
                      )}
                      <button onClick={() => handleDeleteBugReport(report.id)} className="text-red-600 hover:underline text-sm">
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
                          <button onClick={() => setRespondingId(null)} className="text-gray-500 hover:underline">
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

      {/* Модальные окна */}
      {renderModal()}
    </div>
  );
};

export default AdminPanel;