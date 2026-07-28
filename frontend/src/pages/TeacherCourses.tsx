import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { fullName: string }; // email удалён
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
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">✏️ Мои курсы (преподаватель)</h1>
        <div className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">← На главную</Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Отмена' : '+ Создать курс'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-center py-8">{error}</div>}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Новый курс</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
            {formSuccess && <div className="text-green-500 text-sm">{formSuccess}</div>}
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Сохранить
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center">У вас пока нет курсов</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{course.description || 'Нет описания'}</p>
                <div className="text-sm text-gray-500">
                  <p>Дата: {new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 space-x-2">
                  <Link
                    to={`/teacher/course/${course.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => {/* позже реализуем удаление */}}
                    className="text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default TeacherCourses;