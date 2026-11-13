import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  NewspaperIcon,
  UserIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowPathIcon,
  HeartIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

// ============================================================================
// Типы
// ============================================================================
type MediaType = 'IMAGE' | 'VIDEO';

interface NewsMedia {
  id: number;
  url: string;
  type: MediaType;
  order: number;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  createdAt: string;
  author: { fullName: string };
  media: NewsMedia[];
}

interface SelectedMedia {
  url: string;
  type: MediaType;
}

// ============================================================================
// Компонент
// ============================================================================
const News = () => {
  const { user } = useAuth();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [votingId, setVotingId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);

  // adjust-during-render: при смене пользователя сбрасываем лайкнутые
  const currentUserId = user?.id;
  const [lastUserId, setLastUserId] = useState<number | undefined>(currentUserId);
  if (currentUserId !== lastUserId) {
    setLastUserId(currentUserId);
    setLikedIds(new Set());
  }

  // Загрузка новостей
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

  // Загрузка лайкнутых новостей текущего пользователя
  useEffect(() => {
    if (!currentUserId) return;
    const fetchVotes = async () => {
      try {
        const res = await api.get('/news/my-votes');
        setLikedIds(new Set(res.data.newsIds ?? []));
      } catch {
        // тихо: если не получилось — кнопки покажут «не лайкнуто»
      }
    };
    fetchVotes();
  }, [currentUserId]);

  // =========================================================================
  // Голосование
  // =========================================================================
  const handleLike = useCallback(
    async (id: number) => {
      if (!user || votingId === id) return;
      setVotingId(id);
      try {
        const res = await api.post(`/news/${id}/vote`);
        const { liked, likes } = res.data as { liked: boolean; likes: number };
        setNews((prev) => prev.map((n) => (n.id === id ? { ...n, likes } : n)));
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(id);
          else next.delete(id);
          return next;
        });
      } catch {
        // тихо: сеть/сервер — пользователь повторит
      } finally {
        setVotingId(null);
      }
    },
    [user, votingId]
  );

  // =========================================================================
  // Модалка
  // =========================================================================
  const closeMedia = () => setSelectedMedia(null);

  useEffect(() => {
    if (!selectedMedia) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMedia();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedMedia]);

  // =========================================================================
  // Рендер
  // =========================================================================
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
          <p className="text-lg font-medium text-red-500 dark:text-red-400">{error}</p>
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
            {news.map((item) => {
              const gallery: SelectedMedia[] =
                item.media.length > 0
                  ? item.media.map((m) => ({ url: m.url, type: m.type }))
                  : item.imageUrl
                    ? [{ url: item.imageUrl, type: 'IMAGE' }]
                    : [];

              const isLiked = likedIds.has(item.id);
              const isVoting = votingId === item.id;

              return (
                <article
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition overflow-hidden"
                >
                  {/* Галерея медиа */}
                  {gallery.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/30">
                      {gallery.length === 1 && gallery[0] ? (
                        <MediaTile
                          media={gallery[0]}
                          onClick={() => setSelectedMedia(gallery[0] ?? null)}
                          large
                        />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1">
                          {gallery.map((m, idx) => (
                            <MediaTile
                              key={`${m.url}-${idx}`}
                              media={m}
                              onClick={() => setSelectedMedia(m)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Контент */}
                  <div className="p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                      {item.title}
                    </h2>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.content}
                      </ReactMarkdown>
                    </div>

                    {/* Подвал карточки */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                      <div className="flex flex-wrap items-center gap-3">
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

                      <button
                        type="button"
                        onClick={() => handleLike(item.id)}
                        disabled={!user || isVoting}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                          isLiked
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                        } ${!user ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'} ${
                          isVoting ? 'opacity-50 cursor-wait' : ''
                        }`}
                        title={
                          !user
                            ? 'Войдите, чтобы поставить лайк'
                            : isLiked
                              ? 'Убрать лайк'
                              : 'Поставить лайк'
                        }
                      >
                        {isLiked ? (
                          <HeartIconSolid className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">{item.likes}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка просмотра медиа */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={closeMedia}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-5xl w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeMedia}
              className="absolute -top-12 right-0 sm:top-2 sm:right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
              aria-label="Закрыть"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            {selectedMedia.type === 'IMAGE' ? (
              <img
                src={selectedMedia.url}
                alt="Просмотр изображения"
                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

// ============================================================================
// Миниатюра медиа
// ============================================================================
interface MediaTileProps {
  media: SelectedMedia;
  onClick: () => void;
  large?: boolean;
}

const MediaTile = ({ media, onClick, large = false }: MediaTileProps) => {
  if (large) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative group block w-full cursor-pointer overflow-hidden"
      >
        {media.type === 'IMAGE' ? (
          <img
            src={media.url}
            alt=""
            loading="lazy"
            className="w-full max-h-80 object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <>
            <video
              src={media.url}
              preload="metadata"
              muted
              className="w-full max-h-80 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <PlayCircleIcon className="w-14 h-14 text-white opacity-90 drop-shadow-lg" />
            </div>
          </>
        )}
        {media.type === 'IMAGE' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <PhotoIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group block w-full aspect-square overflow-hidden cursor-pointer"
    >
      {media.type === 'IMAGE' ? (
        <img
          src={media.url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <>
          <video
            src={media.url}
            preload="metadata"
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
            <PlayCircleIcon className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </>
      )}
    </button>
  );
};

export default News;