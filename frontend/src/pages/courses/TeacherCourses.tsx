import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  AcademicCapIcon,
  PlusCircleIcon,
  XMarkIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string };
  createdAt: string;
}

const TeacherCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses/my');
      setCourses(res.data);
    } catch (err) {
      setError('Ошибка загрузки курсов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        await fetchMyCourses();
      }
    };
    load();
  }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);
    try {
      await api.post('/courses', { title, description });
      setFormSuccess('✅ Курс создан');
      setTitle('');
      setDescription('');
      setShowForm(false);
      await fetchMyCourses();
    } catch (err) {
      let msg = 'Ошибка создания курса';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">Доступ запрещён</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
            На главную
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок и кнопки */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <AcademicCapIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Мои курсы
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium text-sm"
            >
              ← На главную
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                showForm
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showForm ? (
                <>
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </>
              ) : (
                <>
                  <PlusCircleIcon className="w-5 h-5" />
                  Создать курс
                </>
              )}
            </button>
          </div>
        </div>

        {/* Сообщение об ошибке загрузки */}
        {error && (
          <div className="flex items-start gap-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-xl mb-6">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Форма создания курса */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <PlusCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Новый курс
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              {formError && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-start gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Сохранить
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список курсов */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Загрузка курсов...</span>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">У вас пока нет курсов</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Создать первый курс
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-1 line-clamp-2">
                  {course.description || 'Нет описания'}
                </p>
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>{new Date(course.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <Link
                    to={`/course/${course.id}/manage`}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    Управление
                  </Link>
                  <button
                    onClick={() => {/* позже реализуем удаление */}}
                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm transition ml-auto"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCourses;