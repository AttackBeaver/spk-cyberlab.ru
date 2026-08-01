import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useDropzone } from 'react-dropzone';
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  CheckIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

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
  }[];
}

interface User {
  id: number;
  username: string;
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
  teacher: { id: number; fullName: string };
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
  user: { fullName: string };
  responder?: { fullName: string };
}

type ModalType =
  | 'createGroup'
  | 'addStudents'
  | 'editUser'
  | 'createTeacher'
  | 'createCourse'
  | 'editCourse'
  | 'editGroup'
  | null;

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

type CreateCoursePayload = {
  title: string;
  description: string;
  teacherId: number | null;
  groupIds?: number[];
};

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

  // Добавление студентов
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [studentsInput, setStudentsInput] = useState('');
  const [studentsFile, setStudentsFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Редактирование пользователя
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');

  // Создание преподавателя
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // Создание курса
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseTeacherId, setCourseTeacherId] = useState<number | null>(null);
  const [courseGroupIds, setCourseGroupIds] = useState<number[]>([]);

  // ---- Редактирование курса ----
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');
  const [editCourseTeacherId, setEditCourseTeacherId] = useState<number | null>(null);
  const [editCourseGroupIds, setEditCourseGroupIds] = useState<number[]>([]);

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

  // Состояния для drag-and-drop изображения
  const [newsImagePreview, setNewsImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setModalType('editUser');
  };

  // ---- Преподаватели ----
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/teachers', {
        username: teacherUsername,
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

  // ---- Курсы: создание и редактирование ----
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

  const openEditCourse = (course: Course) => {
    setEditCourseId(course.id);
    setEditCourseTitle(course.title);
    setEditCourseDescription(course.description || '');
    setEditCourseTeacherId(course.teacherId);
    setEditCourseGroupIds([]);
    setModalType('editCourse');
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseId) return;
    try {
      const payload: CreateCoursePayload = {
        title: editCourseTitle,
        description: editCourseDescription,
        teacherId: editCourseTeacherId,
      };
      if (editCourseGroupIds.length) payload.groupIds = editCourseGroupIds;
      await api.put(`/courses/${editCourseId}`, payload);
      showMessage('✅ Курс обновлён');
      setEditCourseId(null);
      setEditCourseTitle('');
      setEditCourseDescription('');
      setEditCourseTeacherId(null);
      setEditCourseGroupIds([]);
      setModalType(null);
      await fetchCourses();
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка обновления курса');
    }
  };

  // ---- НОВОСТИ: загрузка изображения через drag-and-drop ----
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setNewsImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/news/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewsImageUrl(res.data.imageUrl);
      showMessage('✅ Изображение загружено');
    } catch (err) {
      const error = err as ApiError;
      showMessage(error.response?.data?.error || '❌ Ошибка загрузки изображения');
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const resetNewsForm = () => {
    setNewsTitle('');
    setNewsContent('');
    setNewsImageUrl('');
    setNewsImagePreview(null);
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
    if (item.imageUrl) {
      setNewsImagePreview(item.imageUrl);
    } else {
      setNewsImagePreview(null);
    }
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
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'WONTFIX': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'CLOSED': return 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // ---- Рендер модальных окон (улучшенный стиль) ----
  const renderModal = () => {
    if (!modalType) return null;

    const closeModal = () => setModalType(null);

    const modalContent = () => {
      switch (modalType) {
        case 'createGroup':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Создать группу
              </h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название группы</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Префикс (для логинов)</label>
                  <input
                    type="text"
                    value={groupPrefix}
                    onChange={(e) => setGroupPrefix(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Год</label>
                  <input
                    type="number"
                    value={groupYear}
                    onChange={(e) => setGroupYear(parseInt(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1">
                    <PlusCircleIcon className="w-5 h-5" />
                    Создать
                  </button>
                </div>
              </form>
            </>
          );

        case 'addStudents':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                Добавить студентов
              </h2>
              <form onSubmit={handleAddStudents} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Выберите группу</label>
                  <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ручной ввод (ФИО\tНомер, каждый с новой строки)</label>
                  <textarea
                    value={studentsInput}
                    onChange={(e) => setStudentsInput(e.target.value)}
                    rows={5}
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Иванов Иван\t1&#10;Петров Петр\t2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Или импортировать из CSV/Excel (первая колонка - ФИО, вторая - номер)</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setStudentsFile(file);
                    }}
                    ref={fileInputRef}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1">
                    <PlusCircleIcon className="w-5 h-5" />
                    Добавить
                  </button>
                </div>
              </form>
            </>
          );

        case 'editUser':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <PencilSquareIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Редактировать пользователя
              </h2>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Логин</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Полное имя</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1">
                    <CheckIcon className="w-5 h-5" />
                    Сохранить
                  </button>
                </div>
              </form>
            </>
          );

        case 'createTeacher':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Создать преподавателя
              </h2>
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Логин</label>
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Полное имя</label>
                  <input
                    type="text"
                    value={teacherFullName}
                    onChange={(e) => setTeacherFullName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Пароль</label>
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1">
                    <PlusCircleIcon className="w-5 h-5" />
                    Создать
                  </button>
                </div>
              </form>
            </>
          );

        case 'createCourse':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                Создать курс
              </h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Преподаватель</label>
                  <select
                    value={courseTeacherId || ''}
                    onChange={(e) => setCourseTeacherId(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Группы (зажмите Ctrl для множественного выбора)</label>
                  <select
                    multiple
                    value={courseGroupIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                      setCourseGroupIds(selected);
                    }}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1">
                    <PlusCircleIcon className="w-5 h-5" />
                    Создать
                  </button>
                </div>
              </form>
            </>
          );

        case 'editCourse':
          return (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <PencilSquareIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Редактировать курс
              </h2>
              <form onSubmit={handleUpdateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                  <input
                    type="text"
                    value={editCourseTitle}
                    onChange={(e) => setEditCourseTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                  <textarea
                    value={editCourseDescription}
                    onChange={(e) => setEditCourseDescription(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Преподаватель</label>
                  <select
                    value={editCourseTeacherId || ''}
                    onChange={(e) => setEditCourseTeacherId(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Группы (зажмите Ctrl для множественного выбора)</label>
                  <select
                    multiple
                    value={editCourseGroupIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                      setEditCourseGroupIds(selected);
                    }}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1">
                    <CheckIcon className="w-5 h-5" />
                    Сохранить
                  </button>
                </div>
              </form>
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          {modalContent()}
        </div>
      </div>
    );
  };

  // ---- Основной рендер ----
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Доступ запрещён</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Только для администратора.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Сообщения */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl shadow-md ${
              message.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-l-4 border-green-500' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-l-4 border-red-500'
            }`}
          >
            {message}
          </div>
        )}

        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Администрирование</h1>
        </div>

        {/* Вкладки */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-6 pb-2">
          {[
            { key: 'groups', label: 'Группы', icon: UserGroupIcon },
            { key: 'students', label: 'Студенты', icon: UserIcon },
            { key: 'teachers', label: 'Преподаватели', icon: AcademicCapIcon },
            { key: 'courses', label: 'Курсы', icon: BookOpenIcon },
            { key: 'news', label: 'Новости', icon: NewspaperIcon },
            { key: 'bugbounty', label: 'Bug Bounty', icon: ShieldCheckIcon },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ---------- ГРУППЫ ---------- */}
        {activeTab === 'groups' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Управление группами</h2>
              <button
                onClick={() => {
                  setGroupName('');
                  setGroupPrefix('');
                  setGroupYear(new Date().getFullYear());
                  setModalType('createGroup');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Создать группу
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <UserGroupIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Группы не найдены</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {group.name} ({group.prefix}) – {group.year} год
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Студентов: {(group.students || []).length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setStudentsInput('');
                            setStudentsFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            setModalType('addStudents');
                          }}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          <PlusCircleIcon className="w-4 h-4" />
                          Добавить студентов
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    </div>
                    {(group.students || []).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">№</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ФИО</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Логин</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(group.students || []).map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{student.studentNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{student.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.username || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-4 text-gray-500 dark:text-gray-400">В группе нет студентов</div>
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
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Студенты</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Группа:</label>
                <select
                  value={filterGroupId}
                  onChange={(e) => setFilterGroupId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <UserIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Студенты не найдены</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ФИО</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Логин</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Группа</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.map((student) => {
                        const group = groups.find((g) => g.id === student.groupId);
                        return (
                          <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{student.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.username || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group ? group.name : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                              <button
                                onClick={() => openEditUserModal(student)}
                                className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition"
                              >
                                <PencilSquareIcon className="w-3 h-3" />
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleResetPassword(student.username || '')}
                                className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-xs transition"
                              >
                                <ArrowPathIcon className="w-3 h-3" />
                                Сброс пароля
                              </button>
                              <button
                                onClick={() => handleDeleteUser(student.id, student.username || student.fullName)}
                                className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition"
                              >
                                <TrashIcon className="w-3 h-3" />
                                Удалить
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- ПРЕПОДАВАТЕЛИ ---------- */}
        {activeTab === 'teachers' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Преподаватели и администраторы</h2>
              <button
                onClick={() => {
                  setTeacherUsername('');
                  setTeacherFullName('');
                  setTeacherPassword('');
                  setModalType('createTeacher');
                }}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-md"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Создать преподавателя
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : sortedTeachers.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <AcademicCapIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Преподаватели не найдены</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ФИО</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Логин</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Роль</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {sortedTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{teacher.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{teacher.username || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{teacher.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                            <button
                              onClick={() => openEditUserModal(teacher)}
                              className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              <PencilSquareIcon className="w-3 h-3" />
                              Редактировать
                            </button>
                            <button
                              onClick={() => handleResetPassword(teacher.username || '')}
                              className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              <ArrowPathIcon className="w-3 h-3" />
                              Сброс пароля
                            </button>
                            {user?.id !== teacher.id && (
                              <button
                                onClick={() => handleDeleteUser(teacher.id, teacher.username || teacher.fullName)}
                                className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition"
                              >
                                <TrashIcon className="w-3 h-3" />
                                Удалить
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- КУРСЫ ---------- */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Управление курсами</h2>
              <button
                onClick={() => {
                  setCourseTitle('');
                  setCourseDescription('');
                  setCourseTeacherId(null);
                  setCourseGroupIds([]);
                  setModalType('createCourse');
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Создать курс
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Курсы не найдены</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Название</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Описание</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Преподаватель</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{course.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{course.description || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{course.teacher.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                            <button
                              onClick={() => openEditCourse(course)}
                              className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              <PencilSquareIcon className="w-3 h-3" />
                              Редактировать
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs transition"
                            >
                              <TrashIcon className="w-3 h-3" />
                              Удалить
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
        )}

        {/* ---------- НОВОСТИ ---------- */}
        {activeTab === 'news' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Управление новостями</h2>
              <button
                onClick={() => {
                  resetNewsForm();
                  setShowNewsForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Создать новость
              </button>
            </div>

            {newsFormSuccess && (
              <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-xl mb-4">
                {newsFormSuccess}
              </div>
            )}
            {newsFormError && (
              <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-4">
                {newsFormError}
              </div>
            )}

            {showNewsForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <NewspaperIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  {editingNewsId ? 'Редактировать новость' : 'Создать новость'}
                </h3>
                <form onSubmit={handleSubmitNews} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                    <input
                      type="text"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Содержание</label>
                    <textarea
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      rows={5}
                      className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  {/* Drag-and-drop загрузка изображения */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Изображение</label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                        isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {newsImagePreview ? (
                        <div className="flex flex-col items-center">
                          <img src={newsImagePreview} alt="Preview" className="max-h-48 object-contain mb-2 rounded" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Нажмите или перетащите, чтобы заменить изображение</p>
                        </div>
                      ) : (
                        <div>
                          <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">Перетащите изображение сюда или нажмите для выбора</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Поддерживаются JPG, PNG, GIF, WebP до 5 МБ</p>
                        </div>
                      )}
                    </div>
                    {uploadingImage && <p className="text-sm text-blue-500 mt-1">Загрузка...</p>}
                    {newsImageUrl && !newsImagePreview && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Текущее изображение: {newsImageUrl}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1">
                      <CheckIcon className="w-5 h-5" />
                      {editingNewsId ? 'Обновить' : 'Создать'}
                    </button>
                    <button type="button" onClick={resetNewsForm} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {newsLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : newsError ? (
              <div className="text-red-500 dark:text-red-400 text-center py-8">{newsError}</div>
            ) : news.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <NewspaperIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Новостей пока нет</p>
              </div>
            ) : (
              <div className="space-y-4">
                {news.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-start gap-4 hover:shadow-lg transition">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{item.content}</p>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="mt-2 h-24 w-auto object-cover rounded" />
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {item.author.fullName} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEditNews(item)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1">
                        <PencilSquareIcon className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button onClick={() => handleDeleteNews(item.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm flex items-center gap-1">
                        <TrashIcon className="w-4 h-4" />
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
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Управление отчётами Bug Bounty</h2>
            </div>

            {bugMessage && (
              <div
                className={`p-4 mb-4 rounded-xl shadow-md ${
                  bugMessage.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-l-4 border-green-500' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-l-4 border-red-500'
                }`}
              >
                {bugMessage}
              </div>
            )}

            {bugLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
            ) : bugError ? (
              <div className="text-red-500 dark:text-red-400 text-center py-8">{bugError}</div>
            ) : bugReports.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                <ShieldCheckIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Нет отчётов</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bugReports.map((report) => (
                  <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{report.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                            {report.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status === 'NEW' && 'Новый'}
                            {report.status === 'IN_PROGRESS' && 'В работе'}
                            {report.status === 'RESOLVED' && 'Решён'}
                            {report.status === 'WONTFIX' && 'Не будет исправлено'}
                            {report.status === 'CLOSED' && 'Закрыт'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{report.description}</p>
                        {report.steps && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            <span className="font-medium">Шаги:</span> {report.steps}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Автор: {report.user.fullName} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        {report.adminResponse && (
                          <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ответ:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{report.adminResponse}</p>
                            {report.responder && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ответил: {report.responder.fullName}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!report.adminResponse && (
                          <button onClick={() => setRespondingId(report.id)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1">
                            <PencilSquareIcon className="w-4 h-4" />
                            Ответить
                          </button>
                        )}
                        <button onClick={() => handleDeleteBugReport(report.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm flex items-center gap-1">
                          <TrashIcon className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    </div>

                    {respondingId === report.id && (
                      <div className="mt-4 border-t dark:border-gray-700 pt-4">
                        <div className="space-y-3">
                          <textarea
                            placeholder="Ваш ответ..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <select
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                              className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="IN_PROGRESS">В работе</option>
                              <option value="RESOLVED">Решён</option>
                              <option value="WONTFIX">Не будет исправлено</option>
                              <option value="CLOSED">Закрыт</option>
                            </select>
                            <button
                              onClick={() => handleRespond(report.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                            >
                              <CheckIcon className="w-5 h-5" />
                              Отправить ответ
                            </button>
                            <button onClick={() => setRespondingId(null)} className="text-gray-500 dark:text-gray-400 hover:underline">
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
    </div>
  );
};

export default AdminPanel;