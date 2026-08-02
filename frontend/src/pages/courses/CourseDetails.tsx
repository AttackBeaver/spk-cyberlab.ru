import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  BookOpenIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  FolderOpenIcon,
  ClockIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';

interface Lecture {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  teacher: { fullName: string };
  lectures: Lecture[];
  groups: { groupId: number }[];
  createdAt: string;
}

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        setError('Не удалось загрузить курс');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="text-red-500 dark:text-red-400 text-center">
            <p className="text-lg font-medium">{error || 'Курс не найден'}</p>
            <Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400">
              <ArrowLeftIcon className="w-4 h-4" />
              Вернуться к курсам
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Навигация назад */}
        <div className="mb-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад к курсам
          </Link>
        </div>

        {/* Информация о курсе */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <BookOpenIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>
            {isTeacherOrAdmin && (
              <Link
                to={`/course/${course.id}/manage`}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition shadow-md flex-shrink-0"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Управление
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Преподаватель:</span>
              <span className="text-gray-800 dark:text-gray-200">{course.teacher.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Создан:</span>
              <span className="text-gray-800 dark:text-gray-200">
                {new Date(course.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Лекций:</span>
              <span className="text-gray-800 dark:text-gray-200">{course.lectures.length}</span>
            </div>
          </div>
        </div>

        {/* Список лекций */}
        {course.lectures.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-100 dark:border-gray-700">
            <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">В этом курсе пока нет лекций</p>
            {isTeacherOrAdmin && (
              <Link
                to={`/course/${course.id}/manage`}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Добавить лекцию
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {course.lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <FilmIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      {lecture.order ? `${lecture.order}. ` : ''}{lecture.title}
                    </h3>
                    {lecture.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {lecture.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(lecture.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {lecture.fileUrl && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          Материал прикреплён
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {lecture.fileUrl && (
                      <a
                        href={lecture.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition shadow-sm"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Открыть
                      </a>
                    )}
                    {isTeacherOrAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alert('Редактирование лекции будет доступно в управлении курсом')}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          title="Редактировать"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert('Удаление лекции будет доступно в управлении курсом')}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Удалить"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseDetails;