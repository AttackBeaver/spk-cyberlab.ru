import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import {
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Типы
// ============================================================================
export type MediaItem = {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  order: number;
};

export type NewsFormData = {
  title: string;
  content: string;
  media: MediaItem[];
};

export type NewsFormInitial = {
  id?: number;
  title: string;
  content: string;
  imageUrl?: string | null; // legacy
  media?: MediaItem[];
};

interface NewsFormProps {
  initial?: NewsFormInitial | null;
  onSave: (data: NewsFormData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

// ============================================================================
// Ограничения (синхронизированы с backend)
// ============================================================================
const MAX_FILES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const ACCEPTED = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.webm', '.mov', '.ogg'],
};

// ============================================================================
// Компонент
// ============================================================================
const NewsForm = ({ initial = null, onSave, onCancel, isSaving = false }: NewsFormProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [media, setMedia] = useState<MediaItem[]>(initial?.media ?? []);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Если родитель подменяет initial (переключение между новостями) — синхронизируем.
  // Паттерн "adjust state during render" (react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // вместо useEffect: избегаем каскадных рендеров.
  const initialId = initial?.id;
  const [lastInitialId, setLastInitialId] = useState<number | undefined>(initialId);
  if (initialId !== lastInitialId) {
    setLastInitialId(initialId);
    setTitle(initial?.title ?? '');
    setContent(initial?.content ?? '');
    setMedia(initial?.media ?? []);
    setActiveTab('edit');
    setError(null);
  }

  // =========================================================================
  // Загрузка файлов
  // =========================================================================
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const remaining = MAX_FILES - media.length;
      if (remaining <= 0) {
        setError(`Можно загрузить не более ${MAX_FILES} файлов`);
        return;
      }

      const toUpload = files.slice(0, remaining);
      if (files.length > remaining) {
        setError(`Можно загрузить ещё ${remaining} файл(ов). Лишние отфильтрованы.`);
      } else {
        setError(null);
      }

      // Клиентская валидация размеров
      for (const f of toUpload) {
        const isVideo = f.type.startsWith('video/');
        const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (f.size > limit) {
          setError(`Файл «${f.name}» больше ${isVideo ? '50' : '5'} MB`);
          return;
        }
      }

      setUploading(true);
      try {
        const form = new FormData();
        toUpload.forEach((f) => form.append('media', f));
        const res = await api.post('/news/upload-media', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploaded: { url: string; type: 'IMAGE' | 'VIDEO' }[] = res.data.media ?? [];
        setMedia((prev) => [
          ...prev,
          ...uploaded.map((u, i) => ({
            url: u.url,
            type: u.type,
            order: prev.length + i,
          })),
        ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e?.response?.data?.error ?? 'Не удалось загрузить файлы');
      } finally {
        setUploading(false);
      }
    },
    [media.length]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      void uploadFiles(accepted);
    },
    [uploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: MAX_FILES,
    disabled: uploading || media.length >= MAX_FILES,
  });

  // =========================================================================
  // Работа с медиа
  // =========================================================================
  const removeMedia = (index: number) => {
    setMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((m, i) => ({ ...m, order: i }));
    });
  };

  const moveMedia = (from: number, to: number) => {
    if (to < 0 || to >= media.length) return;
    setMedia((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (!item) return prev;
      next.splice(to, 0, item);
      return next.map((m, i) => ({ ...m, order: i }));
    });
  };

  // Нативный HTML5 drag-n-drop
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== targetIndex) {
      moveMedia(draggingIndex, targetIndex);
    }
    setDraggingIndex(null);
  };

  // =========================================================================
  // Submit
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Заголовок обязателен');
      return;
    }
    if (!content.trim()) {
      setError('Содержание обязательно');
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        content,
        media,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Ошибка сохранения');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Заголовок */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Заголовок новости
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите заголовок"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          disabled={isSaving}
        />
      </div>

      {/* Markdown: вкладки редактор / предпросмотр */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Содержание (поддерживается Markdown)
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              Редактор
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <EyeIcon className="w-3.5 h-3.5" />
              Просмотр
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'# Заголовок\n\nТекст новости...\n\n- **жирный**, *курсив*\n- списки, [ссылки](https://...)\n- `код`, таблицы'}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
            disabled={isSaving}
          />
        ) : (
          <div className="min-h-[200px] px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 prose prose-sm dark:prose-invert max-w-none">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">Пока ничего не введено</p>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Поддерживается: **жирный**, *курсив*, # заголовки, - списки, [ссылки](url), `код`, таблицы, цитаты
        </p>
      </div>

      {/* Медиа */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Медиафайлы ({media.length}/{MAX_FILES})
        </label>

        {/* Уже загруженные */}
        {media.length > 0 && (
          <div className="mb-3 space-y-2">
            {media.map((m, i) => (
              <div
                key={m.url}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(i)}
                className={`flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-opacity ${
                  draggingIndex === i ? 'opacity-40' : ''
                }`}
              >
                {/* Превью */}
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  {m.type === 'IMAGE' ? (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" muted />
                  )}
                </div>

                {/* Тип + имя */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {m.type === 'IMAGE' ? (
                      <PhotoIcon className="w-3.5 h-3.5" />
                    ) : (
                      <VideoCameraIcon className="w-3.5 h-3.5" />
                    )}
                    {m.type === 'IMAGE' ? 'Изображение' : 'Видео'} #{i + 1}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {m.url}
                  </p>
                </div>

                {/* Управление */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveMedia(i, i - 1)}
                    disabled={i === 0}
                    className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Выше"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMedia(i, i + 1)}
                    disabled={i === media.length - 1}
                    className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Ниже"
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Удалить"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Порядок можно менять перетаскиванием или стрелками. Первый файл — обложка.
            </p>
          </div>
        )}

        {/* Drag-n-drop зона */}
        {media.length < MAX_FILES && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive
                    ? 'Отпустите файлы'
                    : 'Перетащите файлы сюда или кликните для выбора'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Изображения до 5 MB, видео до 50 MB. Максимум {MAX_FILES} файлов.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving || uploading}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSaving || uploading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};

export default NewsForm;