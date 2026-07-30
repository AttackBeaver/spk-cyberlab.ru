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

  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error || !course) return <Layout><div className="text-red-500 text-center py-8">{error || 'Курс не найден'}</div></Layout>;

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  if (!isTeacherOrAdmin) {
    return <Layout><div className="text-red-500 text-center py-8">Доступ запрещён</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/teacher/courses" className="text-blue-600 hover:underline">← К моим курсам</Link>
            <h1 className="text-2xl font-bold mt-2">Управление курсом: {course.title}</h1>
          </div>
          <button
            onClick={() => setShowLectureForm(!showLectureForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showLectureForm ? 'Отмена' : '+ Добавить лекцию'}
          </button>
        </div>

        {message && (
          <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Форма добавления лекции */}
        {showLectureForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Новая лекция</h2>
            <form onSubmit={handleAddLecture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Название</label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Описание (необязательно)</label>
                <textarea
                  value={lectureDescription}
                  onChange={(e) => setLectureDescription(e.target.value)}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">PDF-файл</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {lectureFilePreview ? (
                    <div className="flex flex-col items-center">
                      <p className="text-green-600">✅ {lectureFile?.name}</p>
                      <p className="text-sm text-gray-500">Нажмите или перетащите, чтобы заменить</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600">Перетащите PDF-файл сюда или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 mt-1">Максимум 20 МБ</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Загрузка...' : 'Добавить лекцию'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLectureForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список лекций */}
        <h2 className="text-xl font-semibold mb-4">Лекции</h2>
        {course.lectures.length === 0 ? (
          <p className="text-gray-500">Лекций пока нет</p>
        ) : (
          <div className="space-y-3">
            {course.lectures.map((lecture) => (
              <div key={lecture.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{lecture.title}</h3>
                  {lecture.description && <p className="text-sm text-gray-500">{lecture.description}</p>}
                  {lecture.fileUrl && (
                    <a
                      href={lecture.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Открыть
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLecture(lecture.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Назначение групп */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Доступ к курсу</h2>
          <p className="text-sm text-gray-600 mb-4">Выберите группы, которые будут иметь доступ к этому курсу.</p>
          <div className="space-y-2">
            {allGroups.map((group) => (
              <label key={group.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                />
                <span>{group.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleAssignGroups}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Сохранить группы
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CourseManage;