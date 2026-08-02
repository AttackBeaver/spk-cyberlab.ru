import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  PlusCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  FilmIcon,
  ArrowUpTrayIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface Lecture {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  order: number;
}

interface Group {
  id: number;
  name: string;
  prefix: string;
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  teacherId: number;
  lectures: Lecture[];
  groups: { groupId: number }[];
}

const CourseManage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Состояния для лекций
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDescription, setLectureDescription] = useState('');
  const [lectureFile, setLectureFile] = useState<File | null>(null);
  const [lectureFilePreview, setLectureFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Состояния для групп
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // Загрузка данных
  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
      setSelectedGroupIds(res.data.groups.map((g: { groupId: number }) => g.groupId));
    } catch {
      setError('Ошибка загрузки курса');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/auth/groups');
      setAllGroups(res.data);
    } catch {
      console.error('Ошибка загрузки групп');
    }
  };

  useEffect(() => {
    const load = async () => {
      if (courseId) {
        await fetchCourse();
        await fetchGroups();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // === Лекции ===
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setLectureFile(file);
      setLectureFilePreview(URL.createObjectURL(file));
    } else {
      alert('Пожалуйста, выберите PDF-файл');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureTitle) {
      setMessage('Название обязательно');
      return;
    }
    if (!lectureFile) {
      setMessage('Загрузите PDF-файл');
      return;
    }

    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('title', lectureTitle);
    formData.append('description', lectureDescription || '');
    formData.append('file', lectureFile);

    try {
      await api.post(`/courses/${courseId}/lectures`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Лекция добавлена');
      setLectureTitle('');
      setLectureDescription('');
      setLectureFile(null);
      setLectureFilePreview(null);
      setShowLectureForm(false);
      await fetchCourse();
    } catch {
      setMessage('Ошибка добавления лекции');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLecture = async (lectureId: number) => {
    if (!confirm('Удалить лекцию?')) return;
    try {
      await api.delete(`/courses/lectures/${lectureId}`);
      setMessage('Лекция удалена');
      await fetchCourse();
    } catch {
      setMessage('Ошибка удаления лекции');
    }
  };

  // === Группы ===
  const handleAssignGroups = async () => {
    if (selectedGroupIds.length === 0) {
      setMessage('Выберите хотя бы одну группу');
      return;
    }
    try {
      await api.post(`/courses/${courseId}/groups`, { groupIds: selectedGroupIds });
      setMessage('Группы назначены');
      await fetchCourse();
    } catch {
      setMessage('Ошибка назначения групп');
    }
  };

  const toggleGroup = (groupId: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Загрузка курса...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <div className="text-red-500 dark:text-red-400">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-3" />
            <p className="text-lg font-medium">{error || 'Курс не найден'}</p>
            <Link to="/teacher/courses" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
              <ArrowLeftIcon className="w-4 h-4" />
              Вернуться к курсам
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  if (!isTeacherOrAdmin) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Доступ запрещён</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Навигация и заголовок */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <Link
              to="/teacher/courses"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              К моим курсам
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-2 flex items-center gap-2">
              <AcademicCapIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Управление: {course.title}
            </h1>
          </div>
          <button
            onClick={() => setShowLectureForm(!showLectureForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
              showLectureForm
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showLectureForm ? (
              <>
                <XMarkIcon className="w-5 h-5" />
                Отмена
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5" />
                Добавить лекцию
              </>
            )}
          </button>
        </div>

        {/* Сообщения */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl shadow-md flex items-start gap-3 ${
              message.includes('✅')
                ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300'
            }`}
          >
            {message.includes('✅') ? (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Форма добавления лекции */}
        {showLectureForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Новая лекция
            </h2>
            <form onSubmit={handleAddLecture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание (необязательно)</label>
                <textarea
                  value={lectureDescription}
                  onChange={(e) => setLectureDescription(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PDF-файл</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {lectureFilePreview ? (
                    <div className="flex flex-col items-center">
                      <FilmIcon className="w-12 h-12 text-green-600 dark:text-green-400 mb-2" />
                      <p className="font-medium text-gray-800 dark:text-gray-200">{lectureFile?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Нажмите или перетащите, чтобы заменить</p>
                    </div>
                  ) : (
                    <div>
                      <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Перетащите PDF-файл сюда или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Максимум 20 МБ</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="w-5 h-5" />
                      Добавить лекцию
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLectureForm(false)}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список лекций */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Лекции
          </h2>
          {course.lectures.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-100 dark:border-gray-700">
              <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Лекций пока нет</p>
              <button
                onClick={() => setShowLectureForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Добавить первую лекцию
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {course.lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-wrap justify-between items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FilmIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {lecture.title}
                      </h3>
                    </div>
                    {lecture.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {lecture.description}
                      </p>
                    )}
                    {lecture.fileUrl && (
                      <a
                        href={lecture.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Открыть PDF
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLecture(lecture.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Назначение групп */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Доступ к курсу
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Выберите группы, которые будут иметь доступ к этому курсу.
          </p>
          {allGroups.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Нет доступных групп</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {allGroups.map((group) => (
                <label
                  key={group.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition cursor-pointer ${
                    selectedGroupIds.includes(group.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    {group.name}
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            onClick={handleAssignGroups}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition shadow-md"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Сохранить группы
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CourseManage;