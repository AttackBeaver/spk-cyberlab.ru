import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  NewspaperIcon,
  UserIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Загрузка новостей...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800">
          <div className="text-red-500 dark:text-red-400">
            <p className="text-lg font-medium">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <NewspaperIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Новости
        </h1>

        {news.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <NewspaperIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Пока нет новостей</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                {item.imageUrl && (
                  <div
                    className="w-full overflow-hidden rounded-lg mb-4 cursor-pointer relative group/image"
                    onClick={() => openImage(item.imageUrl!)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-auto max-h-80 object-cover rounded-lg transition-transform duration-300 group-hover/image:scale-[1.01]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300">
                      <PhotoIcon className="w-10 h-10 text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {item.content}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    {item.author.fullName}
                  </span>
                  <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра изображения */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeImage}
        >
          <div
            className="relative max-w-4xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImage}
              className="absolute -top-12 right-0 sm:top-2 sm:right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
              aria-label="Закрыть"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Просмотр изображения"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default News;