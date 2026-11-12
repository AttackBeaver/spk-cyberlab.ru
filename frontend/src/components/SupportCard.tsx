import { useState, useEffect } from 'react';
import {
  HeartIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// НОМЕР ДЛЯ СБП
// ============================================================================
const DONATION_PHONE = '+7 (962) 046-58-67';       // как показываем
const DONATION_PHONE_RAW = '+79620465867';         // для копирования (без пробелов)
// ============================================================================

const SupportCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ESC + блокировка скролла при открытой модалке
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_PHONE_RAW);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен (http, старый браузер) — просто ничего не делаем
    }
  };

  return (
    <>
      {/* Компактная плашка */}
      <div className="relative bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-4 sm:p-5 shadow border border-rose-100/60 dark:border-rose-800/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-900/40 flex-shrink-0">
          <HeartIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200">
            Нравится проект? Вы можете добровольно поддержать его развитие.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Средства идут на оплату хостинга, домена и SSL-сертификата.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow transition-colors flex-shrink-0"
        >
          Поддержать
        </button>
      </div>

      {/* Модалка */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/40">
                  <HeartIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Поддержать проект
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Вводный текст */}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>SPK CyberLab</strong> — независимый образовательный проект,
                который развивается силами автора без финансирования со стороны.
                Хостинг, домен и SSL-сертификат оплачиваются из личных средств.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Если вы хотите помочь проекту — можно сделать добровольный перевод
                по СБП. Любая сумма — приятный бонус, но <strong>не обязательство</strong>.
              </p>

              {/* Реквизиты */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Реквизиты для СБП
                </p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Номер телефона</p>
                    <p className="text-base font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {DONATION_PHONE}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Инструкция СБП */}
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Как перевести через СБП:
                </p>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Откройте приложение вашего банка.</li>
                  <li>Выберите «Перевод по номеру телефона» (СБП).</li>
                  <li>Введите номер из реквизитов выше.</li>
                  <li>Укажите сумму и подтвердите перевод.</li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Банк получателя определится автоматически по номеру телефона.
                </p>
              </div>

              {/* Юридический дисклеймер */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ Это добровольное пожертвование на развитие проекта.
                  Перевод <strong>не является оплатой услуг</strong>, не даёт
                  доступа к закрытому контенту и никак не влияет на оценки
                  или успеваемость. Реквизиты приведены для тех, кто хочет
                  поддержать инфраструктуру проекта.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportCard;