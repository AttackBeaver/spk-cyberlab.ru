import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
      setMessage('❌ Выберите файл');
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
      setMessage('✅ Мем отправлен на модерацию');
      setTitle('');
      setFile(null);
      setPreview(null);
      setShowForm(false);
      await fetchMemes(currentPage);
      if (user?.role === 'ADMIN') await fetchPending();
      await fetchAuthorRanking();
    } catch {
      setMessage('❌ Ошибка отправки мема');
    } finally {
      setUploading(false);
    }
  };

  const handleVote = async (memeId: number, voteType: 'LIKE' | 'DISLIKE') => {
    if (!user) {
      setMessage('❌ Только авторизованные пользователи могут голосовать');
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
      setMessage('✅ Мем одобрен');
      await fetchPending();
      await fetchMemes(currentPage);
    } catch {
      setMessage('❌ Ошибка одобрения');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.delete(`/memes/${id}/reject`);
      setMessage('✅ Мем отклонён');
      await fetchPending();
    } catch {
      setMessage('❌ Ошибка отклонения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот мем?')) return;
    try {
      await api.delete(`/memes/${id}`);
      setMessage('✅ Мем удалён');
      await fetchMemes(currentPage);
      if (user?.role === 'ADMIN') await fetchPending();
      await fetchAuthorRanking();
    } catch {
      setMessage('❌ Ошибка удаления');
    }
  };

  // --- Открытие модалки ---
  const handleOpenMeme = (meme: Meme) => {
    setSelectedMeme(meme);
  };

  const handleCloseModal = () => {
    setSelectedMeme(null);
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
  const isGif = (url: string) => /\.(gif)$/i.test(url);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Мемная</h1>
          <div className="flex items-center space-x-2">
            {user && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {showForm ? 'Отмена' : '+ Предложить мем'}
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setShowModeration(!showModeration);
                  if (!showModeration) fetchPending();
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                {showModeration ? 'Скрыть модерацию' : 'Модерация'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-end bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="ALL">Все</option>
              <option value="PHOTO">Фото</option>
              <option value="VIDEO">Видео</option>
              <option value="OTHER">Другое</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700">Поиск</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Название или автор"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Сортировка</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="date">По дате (свежие)</option>
              <option value="popular">По популярности</option>
            </select>
          </div>
          <button
            onClick={() => { setCategory('ALL'); setSearch(''); setSort('date'); }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Сбросить
          </button>
        </div>

        {message && (
          <div className={`p-3 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && user && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Предложить мем</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Название"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="flex flex-col items-center">
                    {isVideo(preview) ? (
                      <video src={preview} className="max-h-48 object-contain" controls />
                    ) : (
                      <img src={preview} alt="Preview" className="max-h-48 object-contain" />
                    )}
                    <p className="text-sm text-gray-500 mt-2">Нажмите или перетащите, чтобы заменить файл</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">Перетащите файл сюда или нажмите для выбора</p>
                    <p className="text-xs text-gray-400 mt-1">Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, WebM, OGG, AVI, MOV) до 10 МБ</p>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={uploading || !file}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Загрузка...' : 'Отправить'}
              </button>
            </form>
          </div>
        )}

        {showModeration && user?.role === 'ADMIN' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Модерация мемов</h2>
            {pendingMemes.length === 0 ? (
              <p className="text-gray-500">Нет мемов на модерацию</p>
            ) : (
              <div className="space-y-4">
                {pendingMemes.map((meme) => (
                  <div key={meme.id} className="border p-4 rounded flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{meme.title}</h3>
                      <p className="text-sm text-gray-500">Автор: {meme.author.fullName}</p>
                      <p className="text-sm text-gray-500">Категория: {meme.category || 'Без категории'}</p>
                      {isVideo(meme.imageUrl) ? (
                        <video src={meme.imageUrl} className="h-24 w-auto object-cover mt-2" controls />
                      ) : (
                        <img src={meme.imageUrl} alt={meme.title} className="h-24 w-auto object-cover mt-2" />
                      )}
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleApprove(meme.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Одобрить</button>
                      <button onClick={() => handleReject(meme.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Отклонить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Топ авторов мемов</h2>
          <div className="flex flex-wrap gap-2">
            {authorRanking.slice(0, 10).map((author, idx) => (
              <span key={author.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {idx+1}. {author.fullName} ({author._count.memes} мемов)
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : memes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">По вашему запросу ничего не найдено</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {memes.map((meme) => (
                <div
                  key={meme.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition flex flex-col cursor-pointer"
                  onClick={() => handleOpenMeme(meme)}
                >
                  <div className="h-48 bg-gray-100 flex-shrink-0 flex items-center justify-center">
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
                      <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm truncate">{meme.title}</h3>
                    <p className="text-xs text-gray-500">Автор: {meme.author.fullName}</p>
                    <p className="text-xs text-gray-400">Категория: {meme.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVote(meme.id, 'LIKE'); }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ❤️ {meme.likes}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVote(meme.id, 'DISLIKE'); }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        👎 {meme.dislikes}
                      </button>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(meme.id); }}
                        className="mt-2 text-red-600 hover:underline text-xs self-start"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                {[...Array(totalPages).keys()].map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchMemes(p + 1)}
                    className={`px-4 py-2 rounded ${
                      currentPage === p + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно */}
      {selectedMeme && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-semibold">{selectedMeme.title}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex justify-center">
              {isVideo(selectedMeme.imageUrl) ? (
                <video
                  src={selectedMeme.imageUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh]"
                />
              ) : (
                <img src={selectedMeme.imageUrl} alt={selectedMeme.title} className="max-w-full max-h-[80vh]" />
              )}
            </div>
            <div className="p-4 border-t text-sm text-gray-500">
              <p>Автор: {selectedMeme.author.fullName}</p>
              <p>Категория: {selectedMeme.category}</p>
              <p>Дата: {new Date(selectedMeme.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Memes;