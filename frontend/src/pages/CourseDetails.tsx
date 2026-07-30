import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="text-red-500 dark:text-red-400 text-center py-8">{error || 'Курс не найден'}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link to="/courses" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
            ← Назад к курсам
          </Link>
        </div>

        {/* Информация о курсе */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{course.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description || 'Нет описания'}</p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Преподаватель: {course.teacher.fullName}</p>
            <p>Дата создания: {new Date(course.createdAt).toLocaleDateString()}</p>
            <p>Лекций: {course.lectures.length}</p>
          </div>
          {isTeacherOrAdmin && (
            <div className="mt-4 flex space-x-2">
              <Link
                to={`/course/${course.id}/manage`}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition"
              >
                Управление курсом
              </Link>
            </div>
          )}
        </div>

        {/* Список лекций */}
        {course.lectures.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 text-gray-500 dark:text-gray-400 text-center">
            В этом курсе пока нет лекций
          </div>
        ) : (
          <div className="space-y-4">
            {course.lectures.map((lecture) => (
              <div key={lecture.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {lecture.order ? `${lecture.order}. ` : ''}{lecture.title}
                    </h3>
                    {lecture.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{lecture.description}</p>
                    )}
                  </div>
                  {lecture.fileUrl && (
                    <a
                      href={lecture.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap transition"
                    >
                      Открыть
                    </a>
                  )}
                </div>
                {isTeacherOrAdmin && (
                  <div className="mt-3 flex space-x-2 text-sm">
                    <button
                      onClick={() => alert('Редактирование лекции будет доступно в управлении курсом')}
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => alert('Удаление лекции будет доступно в управлении курсом')}
                      className="text-red-600 hover:underline dark:text-red-400 dark:hover:text-red-300"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseDetails;