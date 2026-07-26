import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: number;
}

interface Topic {
  id: number;
  title: string;
  content: string;
  order: number;
  tasks: Task[];
}

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  topics: Topic[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string; email: string };
  modules: Module[];
  createdAt: string;
}

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        setError('Ошибка загрузки курса');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id]);

  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error || !course) return <Layout><div className="text-red-500 text-center py-8">{error || 'Курс не найден'}</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/courses" className="text-blue-600 hover:underline">← Назад к курсам</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-600 mb-4">{course.description || 'Нет описания'}</p>
        <div className="text-sm text-gray-500">
          <p>Преподаватель: {course.teacher.fullName} ({course.teacher.email})</p>
          <p>Дата создания: {new Date(course.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        {course.modules.length === 0 ? (
          <p className="text-gray-500">В этом курсе пока нет модулей</p>
        ) : (
          course.modules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-xl font-semibold">
                  Модуль {module.order}: {module.title}
                </h2>
                <p className="text-sm text-gray-500">{module.description}</p>
              </div>
              <div className="p-6 space-y-4">
                {module.topics.length === 0 ? (
                  <p className="text-gray-500">В этом модуле нет тем</p>
                ) : (
                  module.topics.map((topic) => (
                    <div key={topic.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold">{topic.title}</h3>
                      <p className="text-sm text-gray-600">{topic.content}</p>
                      {topic.tasks.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-500">Задания: {topic.tasks.length}</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {topic.tasks.map((task) => (
                              <li key={task.id}>
                                <Link to={`/task/${task.id}`} className="text-blue-600 hover:underline">
                                  {task.title} (сложность: {task.difficulty})
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default CourseDetails;