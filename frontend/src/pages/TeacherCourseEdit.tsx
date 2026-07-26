import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

// Интерфейсы (оставляем как есть)
interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  solutionTemplate?: string;
  timeLimit?: number;
  attemptsLimit?: number;
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
  teacherId: number;
  modules: Module[];
}

const TeacherCourseEdit = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Состояния для форм (оставляем как есть)
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);

  const [showTopicForm, setShowTopicForm] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [topicOrder, setTopicOrder] = useState(1);

  const [showTaskForm, setShowTaskForm] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('TEXT');
  const [taskDifficulty, setTaskDifficulty] = useState(1);
  const [taskSolutionTemplate, setTaskSolutionTemplate] = useState('');
  const [taskTimeLimit, setTaskTimeLimit] = useState<number | undefined>(undefined);
  const [taskAttemptsLimit, setTaskAttemptsLimit] = useState<number | undefined>(undefined);

  const [message, setMessage] = useState('');

  // Загрузка курса – обёрнута в useCallback
  const fetchCourse = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
    } catch (err) {
      setError('Ошибка загрузки курса');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Эффект с правильной зависимостью
  useEffect(() => {
  const load = async () => {
    if (courseId) {
      await fetchCourse();
    }
  };
  load();
}, [courseId, fetchCourse]);

  // ---- Обработчики (оставляем без изменений) ----
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${courseId}/modules`, {
        title: moduleTitle,
        description: moduleDescription,
        order: moduleOrder,
      });
      setMessage('✅ Модуль добавлен');
      setModuleTitle('');
      setModuleDescription('');
      setModuleOrder(1);
      setShowModuleForm(false);
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка добавления модуля');
      console.error(err);
    }
  };

  const handleAddTopic = async (e: React.FormEvent, moduleId: number) => {
    e.preventDefault();
    try {
      await api.post(`/modules/${moduleId}/topics`, {
        title: topicTitle,
        content: topicContent,
        order: topicOrder,
      });
      setMessage('✅ Тема добавлена');
      setTopicTitle('');
      setTopicContent('');
      setTopicOrder(1);
      setShowTopicForm(null);
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка добавления темы');
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent, topicId: number) => {
    e.preventDefault();
    try {
      await api.post(`/topics/${topicId}/tasks`, {
        title: taskTitle,
        description: taskDescription,
        type: taskType,
        difficulty: taskDifficulty,
        solutionTemplate: taskSolutionTemplate,
        timeLimit: taskTimeLimit,
        attemptsLimit: taskAttemptsLimit,
      });
      setMessage('✅ Задание добавлено');
      setTaskTitle('');
      setTaskDescription('');
      setTaskType('TEXT');
      setTaskDifficulty(1);
      setTaskSolutionTemplate('');
      setTaskTimeLimit(undefined);
      setTaskAttemptsLimit(undefined);
      setShowTaskForm(null);
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка добавления задания');
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Удалить модуль и всё его содержимое?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setMessage('✅ Модуль удалён');
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка удаления модуля');
      console.error(err);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm('Удалить тему и все задания?')) return;
    try {
      await api.delete(`/topics/${topicId}`);
      setMessage('✅ Тема удалена');
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка удаления темы');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Удалить задание?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setMessage('✅ Задание удалено');
      fetchCourse();
    } catch (err) {
      setMessage('❌ Ошибка удаления задания');
      console.error(err);
    }
  };

  // Рендер (оставляем без изменений)
  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error || !course) return <Layout><div className="text-red-500 text-center py-8">{error || 'Курс не найден'}</div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/teacher/courses" className="text-blue-600 hover:underline">← К моим курсам</Link>
          <h1 className="text-2xl font-bold mt-2">Редактирование курса: {course.title}</h1>
        </div>
        <button
          onClick={() => setShowModuleForm(!showModuleForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showModuleForm ? 'Отмена' : '+ Добавить модуль'}
        </button>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Форма добавления модуля */}
      {showModuleForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Новый модуль</h2>
          <form onSubmit={handleAddModule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Название</label>
              <input type="text" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Описание</label>
              <textarea value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Порядок (число)</label>
              <input type="number" value={moduleOrder} onChange={(e) => setModuleOrder(parseInt(e.target.value))} className="w-full border rounded px-3 py-2" required />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Сохранить модуль</button>
          </form>
        </div>
      )}

      {/* Список модулей */}
      <div className="space-y-6">
        {course.modules.length === 0 ? (
          <p className="text-gray-500">Модулей пока нет</p>
        ) : (
          course.modules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Модуль {module.order}: {module.title}</h2>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowTopicForm(showTopicForm === module.id ? null : module.id)}
                    className="text-blue-600 hover:underline"
                  >
                    + Тему
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-600 hover:underline"
                  >
                    Удалить модуль
                  </button>
                </div>
              </div>

              {/* Форма добавления темы */}
              {showTopicForm === module.id && (
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h3 className="font-semibold mb-2">Новая тема</h3>
                  <form onSubmit={(e) => handleAddTopic(e, module.id)} className="space-y-3">
                    <input type="text" placeholder="Название темы" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
                    <textarea placeholder="Содержание" value={topicContent} onChange={(e) => setTopicContent(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
                    <input type="number" placeholder="Порядок" value={topicOrder} onChange={(e) => setTopicOrder(parseInt(e.target.value))} className="w-24 border rounded px-3 py-2" required />
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Добавить тему</button>
                    <button type="button" onClick={() => setShowTopicForm(null)} className="text-gray-500 hover:underline ml-2">Отмена</button>
                  </form>
                </div>
              )}

              {/* Темы внутри модуля */}
              <div className="p-6 space-y-4">
                {module.topics.length === 0 ? (
                  <p className="text-gray-500">В этом модуле нет тем</p>
                ) : (
                  module.topics.map((topic) => (
                    <div key={topic.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{topic.title}</h3>
                          <p className="text-sm text-gray-600">{topic.content}</p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => setShowTaskForm(showTaskForm === topic.id ? null : topic.id)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            + Задание
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Удалить тему
                          </button>
                        </div>
                      </div>

                      {/* Форма добавления задания */}
                      {showTaskForm === topic.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                          <h4 className="font-semibold mb-2">Новое задание</h4>
                          <form onSubmit={(e) => handleAddTask(e, topic.id)} className="space-y-3">
                            <input type="text" placeholder="Название" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
                            <textarea placeholder="Описание" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" required />
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium">Тип</label>
                                <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full border rounded px-3 py-2">
                                  <option value="TEXT">Текст</option>
                                  <option value="SQL_INJECTION">SQL-инъекция</option>
                                  <option value="CRYPTO_ANALYSIS">Криптоанализ</option>
                                  <option value="CODE">Код</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Сложность (1-5)</label>
                                <input type="number" min="1" max="5" value={taskDifficulty} onChange={(e) => setTaskDifficulty(parseInt(e.target.value))} className="w-full border rounded px-3 py-2" required />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium">Шаблон правильного ответа</label>
                              <input type="text" value={taskSolutionTemplate} onChange={(e) => setTaskSolutionTemplate(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Например: hello или SELECT * FROM users" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium">Лимит времени (мин)</label>
                                <input type="number" value={taskTimeLimit || ''} onChange={(e) => setTaskTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full border rounded px-3 py-2" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">Кол-во попыток</label>
                                <input type="number" value={taskAttemptsLimit || ''} onChange={(e) => setTaskAttemptsLimit(e.target.value ? parseInt(e.target.value) : undefined)} className="w-full border rounded px-3 py-2" />
                              </div>
                            </div>
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Добавить задание</button>
                            <button type="button" onClick={() => setShowTaskForm(null)} className="text-gray-500 hover:underline ml-2">Отмена</button>
                          </form>
                        </div>
                      )}

                      {/* Список заданий внутри темы */}
                      {topic.tasks.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                          {topic.tasks.map((task) => (
                            <li key={task.id} className="flex justify-between items-center">
                              <span>{task.title} (сложность: {task.difficulty})</span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 hover:underline text-xs"
                              >
                                Удалить
                              </button>
                            </li>
                          ))}
                        </ul>
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

export default TeacherCourseEdit;