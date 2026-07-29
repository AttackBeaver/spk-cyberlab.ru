import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTaskToGroups,
  getTaskGroups,
} from '../controllers/sandboxTaskController';
import {
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptDetails,
  executeCodeHandler,
} from '../controllers/sandboxExecutionController';
import {
  initSqlTask,
  executeSqlQuery,
  closeSqlTask,
} from '../controllers/sandboxSqlController';
import {
  submitReport,
  getReportsByTask,
  getReportById,
  gradeReport,
  getMyReports,
  getTaskStatistics,
  exportTaskResultsCSV, // <-- добавлен импорт
} from '../controllers/sandboxReportController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

console.log('🔵 Registering sandbox routes...');

// Все маршруты требуют аутентификации
router.use(authenticate);

// ===== Специфические маршруты для tasks (должны быть выше общих) =====
console.log('   POST /tasks/:taskId/start');
router.post('/tasks/:taskId/start', startAttempt);
console.log('   POST /tasks/:taskId/submit');
router.post('/tasks/:taskId/submit', submitAttempt);
console.log('   POST /tasks/:taskId/sql/init');
router.post('/tasks/:taskId/sql/init', initSqlTask);
console.log('   POST /tasks/:taskId/sql/execute');
router.post('/tasks/:taskId/sql/execute', executeSqlQuery);
console.log('   POST /tasks/:taskId/sql/close');
router.post('/tasks/:taskId/sql/close', closeSqlTask);
console.log('   POST /tasks/:taskId/execute');
router.post('/tasks/:taskId/execute', executeCodeHandler);
console.log('   GET /my-attempts');
router.get('/my-attempts', getMyAttempts);
console.log('   GET /attempts/:attemptId');
router.get('/attempts/:attemptId', getAttemptDetails);

// ===== Отчёты и ручная проверка =====
console.log('   POST /attempts/:attemptId/report');
router.post('/attempts/:attemptId/report', submitReport);
console.log('   GET /reports/my');
router.get('/reports/my', getMyReports);
console.log('   GET /tasks/:taskId/reports');
router.get('/tasks/:taskId/reports', allowRoles('TEACHER', 'ADMIN'), getReportsByTask);
console.log('   GET /reports/:reportId');
router.get('/reports/:reportId', allowRoles('TEACHER', 'ADMIN'), getReportById);
console.log('   PUT /reports/:reportId/grade');
router.put('/reports/:reportId/grade', allowRoles('TEACHER', 'ADMIN'), gradeReport);
console.log('   GET /tasks/:taskId/statistics');
router.get('/tasks/:taskId/statistics', allowRoles('TEACHER', 'ADMIN'), getTaskStatistics);
console.log('   GET /tasks/:taskId/export-csv'); // <-- новый маршрут для CSV
router.get('/tasks/:taskId/export-csv', allowRoles('TEACHER', 'ADMIN'), exportTaskResultsCSV);

// ===== Общие CRUD маршруты =====
console.log('   GET /');
router.get('/', getTasks);
console.log('   GET /:id');
router.get('/:id', getTaskById);
console.log('   POST /');
router.post('/', allowRoles('TEACHER', 'ADMIN'), createTask);
console.log('   PUT /:id');
router.put('/:id', allowRoles('TEACHER', 'ADMIN'), updateTask);
console.log('   DELETE /:id');
router.delete('/:id', allowRoles('TEACHER', 'ADMIN'), deleteTask);
console.log('   POST /:id/assign');
router.post('/:id/assign', allowRoles('TEACHER', 'ADMIN'), assignTaskToGroups);
console.log('   GET /:id/groups');
router.get('/:id/groups', allowRoles('TEACHER', 'ADMIN'), getTaskGroups);

console.log('✅ Sandbox routes registered.');
export default router;