import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: { fullName: string };
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get('/news');
        setNews(res.data);
      } catch {
        setError('Ошибка загрузки новостей');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const openImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  if (loading) return <Layout><div className="text-center py-8">Загрузка...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 text-center py-8">{error}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Новости</h1>
        <div className="space-y-6">
          {news.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Пока нет новостей</p>
          ) : (
            news.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                {item.imageUrl && (
                  <div
                    className="w-full overflow-hidden rounded-md mb-4 cursor-pointer"
                    onClick={() => openImage(item.imageUrl!)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-auto max-h-96 object-contain hover:opacity-90 transition"
                    />
                  </div>
                )}
                <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>
                <p className="text-gray-700 mb-4">{item.content}</p>
                <div className="text-sm text-gray-500">
                  <span>Автор: {item.author.fullName}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно для просмотра изображения */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImage}
        >
          <div
            className="relative max-w-4xl w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImage}
              className="absolute top-2 right-2 text-white text-3xl hover:text-gray-300 z-10"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Просмотр"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default News;