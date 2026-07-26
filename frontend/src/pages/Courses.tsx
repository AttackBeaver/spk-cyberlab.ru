import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string; email: string };
  createdAt: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (err) {
        setError('Ошибка загрузки курсов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📚 Мои курсы</h1>
        <Link to="/" className="text-blue-600 hover:underline">← На главную</Link>
      </div>

      {loading && <div className="text-center py-8">Загрузка...</div>}
      {error && <div className="text-red-500 text-center py-8">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center">Нет доступных курсов</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{course.description || 'Нет описания'}</p>
                <div className="text-sm text-gray-500">
                  <p>Преподаватель: {course.teacher.fullName}</p>
                  <p>Дата: {new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
                <Link
                  to={`/course/${course.id}`}
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Подробнее →
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default Courses;