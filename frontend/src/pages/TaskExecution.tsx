import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const TaskExecution = () => {
  const { taskId, attemptId } = useParams<{ taskId: string; attemptId: string }>();

  return (
    <Layout>
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Выполнение задания</h1>
        <p>Задание ID: {taskId}, Попытка ID: {attemptId}</p>
        <p className="text-gray-500">Страница выполнения в разработке.</p>
      </div>
    </Layout>
  );
};

export default TaskExecution;