import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import courseRoutes from './routes/courseRoutes';
import moduleRoutes from './routes/moduleRoutes';
import topicRoutes from './routes/topicRoutes';
import taskRoutes from './routes/taskRoutes';
import taskRootRoutes from './routes/taskRootRoutes';
import memeRoutes from './routes/memeRoutes';
import profileRoutes from './routes/profileRoutes';
import newsRoutes from './routes/newsRoutes';
import bugReportRoutes from './routes/bugReportRoutes';
import sandboxRoutes from './routes/sandboxRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Раздача статики из папки uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:courseId/modules', moduleRoutes);
app.use('/api/modules/:moduleId/topics', topicRoutes);
app.use('/api/topics/:topicId/tasks', taskRoutes);
app.use('/api/tasks', taskRootRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/bug-reports', bugReportRoutes);
app.use('/api/sandbox', sandboxRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});