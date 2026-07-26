import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import courseRoutes from './routes/courseRoutes';
import moduleRoutes from './routes/moduleRoutes';
import topicRoutes from './routes/topicRoutes';
import taskRoutes from './routes/taskRoutes';
import memeRoutes from './routes/memeRoutes';
import profileRoutes from './routes/profileRoutes';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Принудительная установка кодировки UTF-8 для всех ответов
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:courseId/modules', moduleRoutes);
app.use('/api/modules/:moduleId/topics', topicRoutes);
app.use('/api/topics/:topicId/tasks', taskRoutes);
app.use('/api/memes', memeRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});