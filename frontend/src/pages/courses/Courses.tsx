import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string };
  createdAt: string;
  lectures: { id: number; title: string; fileUrl: string | null }[];
  groups?: { groupId: number }[];
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        let allCourses = res.data;

        // Если студент — фильтруем курсы по его группе
        if (user?.role === 'STUDENT' && user?.groupId) {
          allCourses = allCourses.filter((course: Course) =>
            course.groups?.some(g => g.groupId === user.groupId)
          );
        }

        setCourses(allCourses);
      } catch (err) {
        setError('Ошибка загрузки курсов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Загрузка курсов...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {user?.role === 'STUDENT' ? 'Мои курсы' : 'Все курсы'}
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium text-sm"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
            На главную
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {user?.role === 'STUDENT'
                ? 'У вас пока нет доступных курсов. Обратитесь к преподавателю.'
                : 'Нет доступных курсов'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition flex flex-col group"
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-1 line-clamp-2">
                  {course.description || 'Нет описания'}
                </p>

                <div className="mt-4 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>Преподаватель: {course.teacher.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>
                      {new Date(course.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>Лекций: {course.lectures?.length || 0}</span>
                  </div>
                </div>

                <Link
                  to={`/course/${course.id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium py-2.5 px-4 rounded-lg transition group-hover:shadow-sm"
                >
                  {course.lectures?.length ? 'Перейти к лекциям' : 'Подробнее'}
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;