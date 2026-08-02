import React, { useState, useRef, useEffect } from 'react';

// -------------------- Функции стеганографии --------------------

// Скрытие сообщения в изображении
function hideMessage(
  imageData: ImageData,
  message: string
): { imageData: ImageData } {
  const data = imageData.data;
  const messageBytes = new TextEncoder().encode(message);
  const messageLength = messageBytes.length;

  // Проверяем, что сообщение помещается в изображение
  const maxBytes = Math.floor(data.length / 8) - 4; // 4 байта на длину
  if (messageLength > maxBytes) {
    throw new Error(`Сообщение слишком длинное (макс. ${maxBytes} байт)`);
  }
  if (messageLength === 0) {
    throw new Error('Сообщение не может быть пустым');
  }

  // Формируем полные данные: 4 байта длины + сообщение
  const lengthBytes = new Uint8Array(4);
  new DataView(lengthBytes.buffer).setUint32(0, messageLength, false); // big-endian
  const fullMessage = new Uint8Array([...lengthBytes, ...messageBytes]);

  // Встраиваем биты (используем только красный канал каждого пикселя)
  let bitIndex = 0;
  for (let i = 0; i < fullMessage.length; i++) {
    const byte = fullMessage[i];
    for (let bit = 7; bit >= 0; bit--) {
      const pixelIndex = bitIndex * 8; // индекс в data (красный канал i-го пикселя)
      if (pixelIndex >= data.length) {
        throw new Error('Недостаточно места в изображении');
      }
      const bitValue = (byte >> bit) & 1;
      data[pixelIndex] = (data[pixelIndex] & 0xfe) | bitValue;
      bitIndex++;
    }
  }

  // *** КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ***
  // Устанавливаем альфа-канал всех пикселей в 255, чтобы избежать premultiplied alpha
  // при сохранении в PNG. Это гарантирует, что значения красного канала не изменятся.
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 255;
  }

  return { imageData: new ImageData(data, imageData.width, imageData.height) };
}

// Извлечение сообщения из изображения
function extractMessage(imageData: ImageData): string {
  const data = imageData.data;
  // Проверяем минимальный размер данных
  if (data.length < 4 * 8) {
    throw new Error('Изображение слишком маленькое для извлечения сообщения');
  }

  // Читаем длину (4 байта, big-endian)
  const lengthBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const pixelIndex = i * 8 + bit;
      if (pixelIndex >= data.length) {
        throw new Error('Недостаточно данных для чтения длины');
      }
      const bitValue = data[pixelIndex] & 1;
      byte = (byte << 1) | bitValue;
    }
    lengthBytes[i] = byte;
  }
  const messageLength = new DataView(lengthBytes.buffer).getUint32(0, false);

  // Проверяем разумность длины (максимум 1 МБ для безопасности)
  const maxPossible = Math.floor(data.length / 8) - 4;
  if (messageLength > maxPossible || messageLength < 0 || messageLength > 1024 * 1024) {
    throw new Error('Обнаружена некорректная длина сообщения, возможно, изображение не содержит скрытых данных');
  }

  // Извлекаем сообщение
  const messageBytes = new Uint8Array(messageLength);
  for (let i = 0; i < messageLength; i++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const pixelIndex = (4 + i) * 8 + bit;
      if (pixelIndex >= data.length) {
        throw new Error('Недостаточно данных для чтения сообщения');
      }
      const bitValue = data[pixelIndex] & 1;
      byte = (byte << 1) | bitValue;
    }
    messageBytes[i] = byte;
  }

  return new TextDecoder().decode(messageBytes);
}

// -------------------- Компонент --------------------
const Steganography = () => {
  const [mode, setMode] = useState<'hide' | 'extract'>('hide');
  const [message, setMessage] = useState('Hello, world!');
  const [extractedMessage, setExtractedMessage] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ pixels: number; hiddenBytes: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция сброса состояния при смене режима
  const resetState = () => {
    setExtractedMessage('');
    setProcessedImageUrl(null);
    setStats(null);
    setError('');
    setSuccessMessage('');
    // Очищаем обработанный canvas
    const processedCanvas = processedCanvasRef.current;
    if (processedCanvas) {
      const ctx = processedCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
      }
    }
  };

  // Обработчики смены режима
  const handleModeChange = (newMode: 'hide' | 'extract') => {
    if (newMode === mode) return;
    setMode(newMode);
    resetState();
  };

  // При загрузке нового изображения отображаем его на canvasRef
  useEffect(() => {
    if (!originalImageUrl) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение для предпросмотра');
    };
    img.src = originalImageUrl;
  }, [originalImageUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setOriginalImageUrl(url);
      setProcessedImageUrl(null);
      setExtractedMessage('');
      setStats(null);
      setError('');
      setSuccessMessage('');
      // Очищаем обработанный canvas
      const processedCanvas = processedCanvasRef.current;
      if (processedCanvas) {
        const ctx = processedCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!originalImageUrl) {
      setError('Сначала загрузите изображение');
      return;
    }
    if (mode === 'hide' && !message.trim()) {
      setError('Введите сообщение для сокрытия');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    setExtractedMessage('');

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Внутренняя ошибка: canvas не найден');
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Не удалось получить контекст canvas');
        }
        // Убеждаемся, что размеры совпадают с загруженным изображением
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        if (mode === 'hide') {
          const { imageData: newImageData } = hideMessage(imageData, message);
          setStats({ pixels: imageData.data.length / 4, hiddenBytes: message.length });

          const processedCanvas = processedCanvasRef.current;
          if (!processedCanvas) {
            throw new Error('Внутренняя ошибка: обработанный canvas не найден');
          }
          const pCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
          if (!pCtx) {
            throw new Error('Не удалось получить контекст обработанного canvas');
          }
          processedCanvas.width = img.width;
          processedCanvas.height = img.height;
          pCtx.putImageData(newImageData, 0, 0);
          const url = processedCanvas.toDataURL('image/png');
          setProcessedImageUrl(url);
          setSuccessMessage(`Сообщение успешно скрыто! Размер изображения: ${imageData.data.length / 4} пикселей, скрыто ${message.length} байт.`);
        } else {
          // Режим извлечения
          const extracted = extractMessage(imageData);
          setExtractedMessage(extracted);
          setStats({ pixels: imageData.data.length / 4, hiddenBytes: 0 });
          // Показываем оригинал как обработанный (для визуализации)
          setProcessedImageUrl(originalImageUrl);
          // Также копируем оригинал на processedCanvas, чтобы показать его
          const processedCanvas = processedCanvasRef.current;
          if (processedCanvas) {
            const pCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
            if (pCtx) {
              processedCanvas.width = img.width;
              processedCanvas.height = img.height;
              pCtx.drawImage(img, 0, 0);
            }
          }
          setSuccessMessage(`Сообщение успешно извлечено!`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка обработки';
        setError(errorMessage);
        // В случае ошибки сбрасываем обработанное изображение
        setProcessedImageUrl(null);
        const processedCanvas = processedCanvasRef.current;
        if (processedCanvas) {
          const ctx = processedCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
          }
        }
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение для обработки');
      setIsProcessing(false);
    };
    img.src = originalImageUrl;
  };

  const downloadProcessedImage = () => {
    if (!processedImageUrl) return;
    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = 'stego_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setExtractedMessage('');
    setStats(null);
    setError('');
    setSuccessMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Очищаем оба canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const pCanvas = processedCanvasRef.current;
    if (pCanvas) {
      const ctx = pCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Стеганография — сокрытие данных в изображении (LSB)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Режим</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModeChange('hide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'hide'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Скрыть сообщение
                </button>
                <button
                  onClick={() => handleModeChange('extract')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'extract'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Извлечь сообщение
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Загрузите изображение (PNG)</label>
              <input
                type="file"
                accept="image/png"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Рекомендуется PNG (без потерь)</div>
            </div>

            {mode === 'hide' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Сообщение для сокрытия</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  placeholder="Введите секретное сообщение"
                />
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={processImage}
                disabled={isProcessing || !originalImageUrl}
                className={`flex-1 ${isProcessing ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'} text-white font-medium py-2 rounded-lg transition disabled:opacity-50`}
              >
                {isProcessing ? 'Обработка...' : mode === 'hide' ? 'Скрыть сообщение' : 'Извлечь сообщение'}
              </button>
              {processedImageUrl && mode === 'hide' && (
                <button
                  onClick={downloadProcessedImage}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Скачать изображение (PNG)
                </button>
              )}
              <button
                onClick={resetAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сбросить
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                ✅ {successMessage}
              </div>
            )}

            {stats && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                <div>Размер изображения: {stats.pixels} пикселей</div>
                {mode === 'hide' && <div>Скрыто байт: {stats.hiddenBytes}</div>}
              </div>
            )}

            {mode === 'extract' && extractedMessage && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">Извлечённое сообщение:</div>
                <div className="font-mono text-sm break-all text-green-700 dark:text-green-300">{extractedMessage}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Визуализация</h4>
            {originalImageUrl ? (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Оригинал</div>
                  <canvas
                    ref={canvasRef}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    style={{ maxHeight: '200px', objectFit: 'contain', width: '100%' }}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    {mode === 'hide' ? 'С изменёнными битами (сообщение скрыто)' : 'Извлечение'}
                  </div>
                  <canvas
                    ref={processedCanvasRef}
                    className="w-full border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800"
                    style={{ maxHeight: '200px', objectFit: 'contain', width: '100%' }}
                  />
                  {!processedImageUrl && mode === 'hide' && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      После скрытия здесь появится изображение с изменёнными битами.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-400 dark:text-gray-500">Загрузите изображение</p>
              </div>
            )}
            {processedImageUrl && mode === 'hide' && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                <span className="font-medium">Визуально изображение не изменилось</span>, но в младших битах спрятано сообщение.
                <br />
                <span className="font-medium">Скачайте</span> полученное изображение, чтобы позже извлечь сообщение.
              </div>
            )}
            {mode === 'extract' && extractedMessage && (
              <div className="text-xs text-green-600 dark:text-green-400">
                Сообщение успешно извлечено из загруженного изображения.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает LSB-стеганография?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Младший значащий бит (LSB) каждого пикселя (красный канал) заменяется на бит сообщения.</li>
          <li>Изменения незаметны для глаза, так как меняется всего 1 бит из 8 на канал.</li>
          <li>Для сокрытия сообщения требуется достаточно много пикселей (8 пикселей на байт).</li>
          <li>Метод устойчив к сжатию с потерями (JPEG), поэтому рекомендуется использовать PNG.</li>
          <li>В демонстрации сообщение начинается с 4-байтовой длины, чтобы можно было извлечь.</li>
        </ul>
      </div>
    </div>
  );
};

export default Steganography;