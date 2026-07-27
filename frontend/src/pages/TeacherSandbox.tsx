import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description: string;
  instructions: string | null;
  type: string;
  difficulty: number;
  timeLimit: number | null;
  attemptsLimit: number | null;
  points: number;
  answerTemplate: string | null;
  htmlTemplate: string | null;
  expectedResult: string | null;
  creator: { fullName: string };
  groups: { group: { id: number; name: string } }[];
}

interface Group {
  id: number;
  name: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const TeacherSandbox = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [difficulty, setDifficulty] = useState(1);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [attemptsLimit, setAttemptsLimit] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [answerTemplate, setAnswerTemplate] = useState('');
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [assignTaskId, setAssignTaskId] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/sandbox');
      setTasks(res.data);
    } catch {
      setError('Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/auth/groups');
      setGroups(res.data);
    } catch {
      console.error('Ошибка загрузки групп');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchTasks();
        await fetchGroups();
      }
    };
    loadData();
  }, [user]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setInstructions('');
    setType('CUSTOM');
    setDifficulty(1);
    setTimeLimit(null);
    setAttemptsLimit(null);
    setPoints(0);
    setAnswerTemplate('');
    setHtmlTemplate('');
    setExpectedResult('');
    setFormError('');
    setFormSuccess('');
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setInstructions(task.instructions || '');
    setType(task.type);
    setDifficulty(task.difficulty);
    setTimeLimit(task.timeLimit);
    setAttemptsLimit(task.attemptsLimit);
    setPoints(task.points);
    setAnswerTemplate(task.answerTemplate || '');
    setHtmlTemplate(task.htmlTemplate || '');
    setExpectedResult(task.expectedResult || '');
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      const payload = {
        title,
        description,
        instructions,
        type,
        difficulty,
        timeLimit,
        attemptsLimit,
        points,
        answerTemplate,
        htmlTemplate,
        expectedResult,
      };
      if (editingId) {
        await api.put(`/sandbox/${editingId}`, payload);
        setFormSuccess('✅ Задание обновлено');
      } else {
        await api.post('/sandbox', payload);
        setFormSuccess('✅ Задание создано');
      }
      resetForm();
      await fetchTasks();
    } catch (err) {
      let msg = 'Ошибка сохранения задания';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as ApiError;
        msg = errObj.response?.data?.error || msg;
      }
      setFormError(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это задание?')) return;
    try {
      await api.delete(`/sandbox/${id}`);
      await fetchTasks();
    } catch (err) {
      let msg = 'Ошибка удаления';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as ApiError;
        msg = errObj.response?.data?.error || msg;
      }
      alert(msg);
    }
  };

  const openAssignModal = (taskId: number, currentGroupIds: number[]) => {
    setAssignTaskId(taskId);
    setSelectedGroups(currentGroupIds);
  };

  const handleAssign = async () => {
    if (assignTaskId === null) return;
    try {
      await api.post(`/sandbox/${assignTaskId}/assign`, { groupIds: selectedGroups });
      alert('✅ Назначения обновлены');
      setAssignTaskId(null);
      await fetchTasks();
    } catch (err) {
      let msg = 'Ошибка назначения';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as ApiError;
        msg = errObj.response?.data?.error || msg;
      }
      alert(msg);
    }
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return <Layout><div className="text-red-500">Доступ запрещён</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold">Управление заданиями полигона</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Создать задание
            </button>
            <Link
              to="/teacher/sandbox/sql/create"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + SQL-задание
            </Link>
          </div>
        </div>

        {formError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{formError}</div>}
        {formSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{formSuccess}</div>}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Редактировать задание' : 'Новое задание'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium">Тип</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="SQL_INJECTION">SQL-инъекция</option>
                    <option value="XSS">XSS-атака</option>
                    <option value="PHISHING">Фишинг</option>
                    <option value="CODE">Программирование</option>
                    <option value="CUSTOM">Кастомное</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Сложность (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Баллы</label>
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Лимит времени (мин, необязательно)</label>
                  <input
                    type="number"
                    min="1"
                    value={timeLimit ?? ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Лимит попыток (необязательно)</label>
                  <input
                    type="number"
                    min="1"
                    value={attemptsLimit ?? ''}
                    onChange={(e) => setAttemptsLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Инструкции для студента</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Шаблон правильного ответа (для CUSTOM)</label>
                <input
                  type="text"
                  value={answerTemplate}
                  onChange={(e) => setAnswerTemplate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Например: hello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">HTML-макет (для интерактивных заданий)</label>
                <textarea
                  value={htmlTemplate}
                  onChange={(e) => setHtmlTemplate(e.target.value)}
                  rows={6}
                  className="w-full border rounded px-3 py-2 font-mono text-sm"
                  placeholder="Вставьте HTML-код макета уязвимого сайта..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Ожидаемый результат (текст после успешной атаки)</label>
                <input
                  type="text"
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Например: Добро пожаловать, admin"
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  {editingId ? 'Обновить' : 'Создать'}
                </button>
                <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет заданий</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-gray-600 text-sm">{task.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Тип: {task.type}</span>
                    <span className="ml-3">Сложность: {task.difficulty}</span>
                    <span className="ml-3">Баллы: {task.points}</span>
                    {task.timeLimit && <span className="ml-3">⏱️ {task.timeLimit} мин</span>}
                    {task.attemptsLimit && <span className="ml-3">📝 {task.attemptsLimit}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Автор: {task.creator.fullName}
                  </div>
                </div>
                <div className="flex space-x-2 items-center flex-wrap">
                  <button
                    onClick={() => openAssignModal(task.id, task.groups.map(g => g.group.id))}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Назначить группы
                  </button>
                  <Link
                    to={`/sandbox/preview/${task.id}`}
                    target="_blank"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Предпросмотр
                  </Link>
                  {task.type === 'DATABASE' && (
                    <Link
                      to={`/teacher/sandbox/sql/edit/${task.id}`}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Редактировать SQL
                    </Link>
                  )}
                  <button onClick={() => handleEdit(task)} className="text-blue-600 hover:underline text-sm">
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:underline text-sm">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {assignTaskId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Назначить группы</h2>
            <div className="space-y-2">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => toggleGroupSelection(group.id)}
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={handleAssign} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Сохранить
              </button>
              <button onClick={() => setAssignTaskId(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherSandbox;