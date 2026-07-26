import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Meme {
  id: number;
  title: string;
  imageUrl: string;
  category: string;
  author: { fullName: string };
  createdAt: string;
  approved: boolean;
}

const Memes = () => {
  const { user } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [pendingMemes, setPendingMemes] = useState<Meme[]>([]);
  const [showModeration, setShowModeration] = useState(false);

  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

  const fetchMemes = async () => {
    try {
      const res = await api.get('/memes');
      setMemes(res.data);
    } catch {
      setError('Ошибка загрузки мемов');
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/memes/pending');
      setPendingMemes(res.data);
    } catch {
      console.error('Ошибка загрузки ожидающих мемов');
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchMemes();
      if (user?.role === 'ADMIN') await fetchPending();
    };
    load();
  }, [user]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      const allowed = ['jpeg', 'jpg', 'png', 'gif', 'mp4', 'webm', 'ogg', 'avi', 'mov'];
      if (ext && allowed.includes(ext)) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
      } else {
        setMessage('❌ Неподдерживаемый формат файла. Разрешены: jpg, png, gif, mp4, webm, ogg, avi, mov');
      }
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
    if (category) formData.append('category', category);

    try {
      await api.post('/memes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('✅ Мем отправлен на модерацию (или сразу добавлен, если вы админ)');
      setTitle('');
      setCategory('');
      setFile(null);
      setPreview(null);
      setShowForm(false);
      await fetchMemes();
      if (user?.role === 'ADMIN') await fetchPending();
    } catch {
      setMessage('❌ Ошибка отправки мема');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/memes/${id}/approve`);
      setMessage('✅ Мем одобрен');
      await fetchPending();
      await fetchMemes();
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
      await fetchMemes();
      if (user?.role === 'ADMIN') await fetchPending();
    } catch {
      setMessage('❌ Ошибка удаления');
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

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IT-мемы</h1>
        <div className="space-x-2">
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
            <input
              type="text"
              placeholder="Категория (необязательно)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
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

            {file && (
              <p className="text-sm text-gray-600">Выбран файл: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} МБ)</p>
            )}

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
                      <video src={meme.imageUrl} className="h-24 w-auto object-contain mt-2" controls />
                    ) : (
                      <img src={meme.imageUrl} alt={meme.title} className="h-24 w-auto object-contain mt-2" />
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

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : memes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Пока нет одобренных мемов</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {memes.map((meme) => (
            <div
              key={meme.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col"
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
                <p className="text-xs text-gray-400">Категория: {meme.category || 'Без категории'}</p>
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
      )}

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
              <p>Категория: {selectedMeme.category || 'Без категории'}</p>
              <p>Дата: {new Date(selectedMeme.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Memes;