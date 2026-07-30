import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useDropzone } from 'react-dropzone';

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
      setMessage('❌ Название обязательно');
      return;
    }
    if (!lectureFile) {
      setMessage('❌ Загрузите PDF-файл');
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
      setMessage('✅ Лекция добавлена');
      setLectureTitle('');
      setLectureDescription('');
      setLectureFile(null);
      setLectureFilePreview(null);
      setShowLectureForm(false);
      await fetchCourse();
    } catch {
      setMessage('❌ Ошибка добавления лекции');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLecture = async (lectureId: number) => {
    if (!confirm('Удалить лекцию?')) return;
    try {
      await api.delete(`/courses/lectures/${lectureId}`);
      setMessage('✅ Лекция удалена');
      await fetchCourse();
    } catch {
      setMessage('❌ Ошибка удаления лекции');
    }
  };

  // === Группы ===
  const handleAssignGroups = async () => {
    if (selectedGroupIds.length === 0) {
      setMessage('❌ Выберите хотя бы одну группу');
      return;
    }
    try {
      await api.post(`/courses/${courseId}/groups`, { groupIds: selectedGroupIds });
      setMessage('✅ Группы назначены');
      await fetchCourse();
    } catch {
      setMessage('❌ Ошибка назначения групп');
    }
  };

  const toggleGroup = (groupId: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (loading) return <Layout><div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div></Layout>;
  if (error || !course) return <Layout><div className="text-red-500 dark:text-red-400 text-center py-8">{error || 'Курс не найден'}</div></Layout>;

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  if (!isTeacherOrAdmin) {
    return <Layout><div className="text-red-500 dark:text-red-400 text-center py-8">Доступ запрещён</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <Link to="/teacher/courses" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              ← К моим курсам
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2">Управление курсом: {course.title}</h1>
          </div>
          <button
            onClick={() => setShowLectureForm(!showLectureForm)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            {showLectureForm ? 'Отмена' : '+ Добавить лекцию'}
          </button>
        </div>

        {message && (
          <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
            {message}
          </div>
        )}

        {/* Форма добавления лекции */}
        {showLectureForm && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Новая лекция</h2>
            <form onSubmit={handleAddLecture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание (необязательно)</label>
                <textarea
                  value={lectureDescription}
                  onChange={(e) => setLectureDescription(e.target.value)}
                  rows={2}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PDF-файл</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {lectureFilePreview ? (
                    <div className="flex flex-col items-center">
                      <p className="text-green-600 dark:text-green-400">✅ {lectureFile?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Нажмите или перетащите, чтобы заменить</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Перетащите PDF-файл сюда или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Максимум 20 МБ</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 transition"
                >
                  {uploading ? 'Загрузка...' : 'Добавить лекцию'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLectureForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список лекций */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Лекции</h2>
        {course.lectures.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Лекций пока нет</p>
        ) : (
          <div className="space-y-3">
            {course.lectures.map((lecture) => (
              <div key={lecture.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{lecture.title}</h3>
                  {lecture.description && <p className="text-sm text-gray-500 dark:text-gray-400">{lecture.description}</p>}
                  {lecture.fileUrl && (
                    <a
                      href={lecture.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      Открыть
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLecture(lecture.id)}
                  className="text-red-600 hover:underline dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Назначение групп */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Доступ к курсу</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Выберите группы, которые будут иметь доступ к этому курсу.</p>
          <div className="space-y-2">
            {allGroups.map((group) => (
              <label key={group.id} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span>{group.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleAssignGroups}
            className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Сохранить группы
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CourseManage;