import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
        <div className="text-center py-8">Загрузка...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-8">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {user?.role === 'STUDENT' ? '📚 Мои курсы' : '📚 Все курсы'}
        </h1>
        <Link to="/" className="text-blue-600 hover:underline">← На главную</Link>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {user?.role === 'STUDENT'
            ? 'У вас пока нет доступных курсов. Обратитесь к преподавателю.'
            : 'Нет доступных курсов'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex flex-col">
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                {course.description || 'Нет описания'}
              </p>
              <div className="text-sm text-gray-500">
                <p>Преподаватель: {course.teacher.fullName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Лекций: {course.lectures?.length || 0}
                </p>
              </div>
              <Link
                to={`/course/${course.id}`}
                className="mt-4 inline-block text-blue-600 hover:underline text-center bg-gray-50 py-2 rounded hover:bg-gray-100 transition"
              >
                {course.lectures?.length ? 'Перейти к лекциям →' : 'Подробнее →'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Courses;