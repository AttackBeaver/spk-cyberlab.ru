import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  FaceSmileIcon,
  PlusCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  HeartIcon,
  HandThumbDownIcon,
  CheckIcon,
  XCircleIcon,
  TrashIcon,
  UserIcon,
  CalendarDaysIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface Meme {
  id: number;
  title: string;
  imageUrl: string;
  category: 'PHOTO' | 'VIDEO' | 'OTHER';
  author: { fullName: string };
  createdAt: string;
  approved: boolean;
  likes: number;
  dislikes: number;
}

interface AuthorRank {
  id: number;
  fullName: string;
  _count: { memes: number };
}

const Memes = () => {
  const { user } = useAuth();

  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [pendingMemes, setPendingMemes] = useState<Meme[]>([]);
  const [showModeration, setShowModeration] = useState(false);

  const [authorRanking, setAuthorRanking] = useState<AuthorRank[]>([]);

  // --- Модальное окно ---
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

  const fetchMemes = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(category !== 'ALL' && { category }),
        ...(search && { search }),
        ...(sort && { sort }),
      });
      const res = await api.get(`/memes?${params.toString()}`);
      setMemes(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError('Ошибка загрузки мемов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort]);

  const fetchPending = async () => {
    try {
      const res = await api.get('/memes/pending');
      setPendingMemes(res.data);
    } catch {
      console.error('Ошибка загрузки ожидающих мемов');
    }
  };

  const fetchAuthorRanking = async () => {
    try {
      const res = await api.get('/memes/authors/ranking');
      setAuthorRanking(res.data);
    } catch {
      console.error('Ошибка загрузки рейтинга авторов');
    }
  };

  useEffect(() => {
    const loadMemes = async () => {
      await fetchMemes(1);
    };
    loadMemes();
  }, [fetchMemes]);

  useEffect(() => {
    const loadExtra = async () => {
      if (user?.role === 'ADMIN') {
        await fetchPending();
      }
      await fetchAuthorRanking();
    };
    loadExtra();
  }, [user]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { '*/*': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Выберите файл');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      await api.post('/memes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Мем отправлен на модерацию');
      setTitle('');
      setFile(null);
      setPreview(null);
      setShowForm(false);
      await fetchMemes(currentPage);
      if (user?.role === 'ADMIN') await fetchPending();
      await fetchAuthorRanking();
    } catch {
      setMessage('Ошибка отправки мема');
    } finally {
      setUploading(false);
    }
  };

  const handleVote = async (memeId: number, voteType: 'LIKE' | 'DISLIKE') => {
    if (!user) {
      setMessage('Только авторизованные пользователи могут голосовать');
      return;
    }
    try {
      const res = await api.post(`/memes/${memeId}/vote`, { voteType });
      setMemes(prev =>
        prev.map(m =>
          m.id === memeId
            ? { ...m, likes: res.data.likes, dislikes: res.data.dislikes }
            : m
        )
      );
    } catch (err) {
      let msg = 'Ошибка голосования';
      if (err && typeof err === 'object' && 'response' in err) {
        const errObj = err as { response?: { data?: { error?: string } } };
        msg = errObj.response?.data?.error || msg;
      }
      setMessage(msg);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/memes/${id}/approve`);
      setMessage('Мем одобрен');
      await fetchPending();
      await fetchMemes(currentPage);
    } catch {
      setMessage('Ошибка одобрения');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.delete(`/memes/${id}/reject`);
      setMessage('Мем отклонён');
      await fetchPending();
    } catch {
      setMessage('Ошибка отклонения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот мем?')) return;
    try {
      await api.delete(`/memes/${id}`);
      setMessage('Мем удалён');
      await fetchMemes(currentPage);
      if (user?.role === 'ADMIN') await fetchPending();
      await fetchAuthorRanking();
    } catch {
      setMessage('Ошибка удаления');
    }
  };

  const handleOpenMeme = (meme: Meme) => {
    setSelectedMeme(meme);
  };

  const handleCloseModal = () => {
    setSelectedMeme(null);
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  const isGif = (url: string) => /\.(gif)$/i.test(url);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PHOTO': return <PhotoIcon className="w-4 h-4" />;
      case 'VIDEO': return <VideoCameraIcon className="w-4 h-4" />;
      default: return <DocumentIcon className="w-4 h-4" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и кнопки */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <FaceSmileIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
            Мемная
          </h1>
          <div className="flex flex-wrap gap-2">
            {user && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                  showForm
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {showForm ? (
                  <>
                    <XMarkIcon className="w-5 h-5" />
                    Отмена
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="w-5 h-5" />
                    Предложить мем
                  </>
                )}
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setShowModeration(!showModeration);
                  if (!showModeration) fetchPending();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                  showModeration
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                {showModeration ? 'Скрыть модерацию' : 'Модерация'}
              </button>
            )}
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Название или автор"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">Все</option>
                <option value="PHOTO">Фото</option>
                <option value="VIDEO">Видео</option>
                <option value="OTHER">Другое</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сортировка</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="date">По дате (свежие)</option>
                <option value="popular">По популярности</option>
              </select>
            </div>
            <button
              onClick={() => { setCategory('ALL'); setSearch(''); setSort('date'); }}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Сбросить
            </button>
          </div>
        </div>

        {/* Сообщения */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl shadow-md flex items-start gap-3 ${
              message.includes('✅')
                ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300'
            }`}
          >
            {message.includes('✅') ? (
              <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Форма добавления мема */}
        {showForm && user && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <PlusCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Предложить мем
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Файл</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="flex flex-col items-center">
                      {isVideo(preview) ? (
                        <video src={preview} className="max-h-48 object-contain rounded" controls />
                      ) : (
                        <img src={preview} alt="Preview" className="max-h-48 object-contain rounded" />
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Нажмите или перетащите, чтобы заменить файл</p>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Перетащите файл сюда или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, WebM, OGG, AVI, MOV) до 10 МБ
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-5 h-5" />
                      Отправить
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Модерация */}
        {showModeration && user?.role === 'ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              Модерация мемов
            </h2>
            {pendingMemes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Нет мемов на модерацию</p>
            ) : (
              <div className="space-y-4">
                {pendingMemes.map((meme) => (
                  <div key={meme.id} className="border dark:border-gray-700 rounded-lg p-4 flex flex-wrap justify-between items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{meme.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          {meme.author.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(meme.category)}
                          {meme.category}
                        </span>
                      </div>
                      <div className="mt-2">
                        {isVideo(meme.imageUrl) ? (
                          <video src={meme.imageUrl} className="h-24 w-auto object-cover rounded" controls />
                        ) : (
                          <img src={meme.imageUrl} alt={meme.title} className="h-24 w-auto object-cover rounded" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(meme.id)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleReject(meme.id)}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Топ авторов */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Топ авторов мемов
          </h2>
          <div className="flex flex-wrap gap-2">
            {authorRanking.slice(0, 10).map((author, idx) => (
              <span
                key={author.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  idx === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {idx + 1}. {author.fullName} ({author._count.memes} мемов)
              </span>
            ))}
          </div>
        </div>

        {/* Список мемов */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Загрузка мемов...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
            <XCircleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : memes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <FaceSmileIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {memes.map((meme) => (
                <div
                  key={meme.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition cursor-pointer group"
                  onClick={() => handleOpenMeme(meme)}
                >
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {isVideo(meme.imageUrl) ? (
                      <video
                        src={meme.imageUrl}
                        className="w-full h-full object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : isGif(meme.imageUrl) ? (
                      <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-contain" />
                    ) : (
                      <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-300" />
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {getCategoryIcon(meme.category)}
                      <span>{meme.category}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate text-gray-800 dark:text-gray-200">{meme.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <UserIcon className="w-3 h-3" />
                      {meme.author.fullName}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVote(meme.id, 'LIKE'); }}
                          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                        >
                          <HeartIcon className="w-4 h-4" />
                          {meme.likes}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVote(meme.id, 'DISLIKE'); }}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
                        >
                          <HandThumbDownIcon className="w-4 h-4" />
                          {meme.dislikes}
                        </button>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(meme.id); }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Удалить"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => fetchMemes(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {[...Array(totalPages).keys()].map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchMemes(p + 1)}
                    className={`px-4 py-2 rounded-lg transition font-medium ${
                      currentPage === p + 1
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
                <button
                  onClick={() => fetchMemes(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно */}
      {selectedMeme && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate">{selectedMeme.title}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex justify-center items-center bg-gray-50 dark:bg-gray-900/50 min-h-[200px]">
              {isVideo(selectedMeme.imageUrl) ? (
                <video
                  src={selectedMeme.imageUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded"
                />
              ) : (
                <img src={selectedMeme.imageUrl} alt={selectedMeme.title} className="max-w-full max-h-[70vh] rounded" />
              )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                {selectedMeme.author.fullName}
              </span>
              <span className="flex items-center gap-1">
                {getCategoryIcon(selectedMeme.category)}
                {selectedMeme.category}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="w-4 h-4" />
                {new Date(selectedMeme.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4 text-red-500" />
                {selectedMeme.likes}
              </span>
              <span className="flex items-center gap-1">
                <HandThumbDownIcon className="w-4 h-4 text-gray-500" />
                {selectedMeme.dislikes}
              </span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Memes;