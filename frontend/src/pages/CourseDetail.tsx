import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  topics: { id: number; title: string; content: string; order: number }[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string; email: string };
  modules: Module[];
  createdAt: string;
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch {
        setError('Не удалось загрузить курс');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Загрузка курса...</div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-500">{error || 'Курс не найден'}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/courses" className="text-blue-600 hover:underline">← Назад к курсам</Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
      <p className="text-gray-600 mb-4">{course.description || 'Нет описания'}</p>
      <p className="text-sm text-gray-400 mb-6">Преподаватель: {course.teacher.fullName}</p>

      {course.modules.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500">В этом курсе пока нет модулей.</div>
      ) : (
        <div className="space-y-4">
          {course.modules.sort((a, b) => a.order - b.order).map((module) => (
            <div key={module.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold">{module.title}</h3>
              <p className="text-gray-600 text-sm">{module.description}</p>
              {module.topics.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {module.topics.sort((a, b) => a.order - b.order).map((topic) => (
                    <li key={topic.id} className="text-sm text-gray-700">
                      • {topic.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default CourseDetail;