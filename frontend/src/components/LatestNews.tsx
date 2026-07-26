import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: { fullName: string };
}

const LatestNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/news/latest?limit=3');
        setNews(res.data);
      } catch {
        setError('Не удалось загрузить новости');
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500 text-center">Загрузка новостей...</p>
    </div>
  );

  if (error || news.length === 0) {
    return null; // не показываем блок, если нет новостей
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Последние новости</h2>
        <Link to="/news" className="text-blue-600 hover:underline text-sm">Все новости →</Link>
      </div>
      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
            <h3 className="font-medium text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(item.createdAt).toLocaleDateString()} • {item.author.fullName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestNews;