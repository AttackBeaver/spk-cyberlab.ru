import { useState, useMemo } from 'react';

// -------------------- Base64 (UTF-8 совместимый) --------------------
function base64Encode(str: string): string {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = '';
    data.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  } catch {
    return 'Ошибка кодирования';
  }
}

function base64Decode(str: string): string {
  try {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return 'Ошибка декодирования';
  }
}

// -------------------- ASCII --------------------
function stringToAsciiCodes(str: string): number[] {
  return str.split('').map(ch => ch.charCodeAt(0));
}

// -------------------- CRC32 --------------------
function crc32(str: string): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) crc = (crc >>> 1) ^ 0xEDB88320;
      else crc >>>= 1;
    }
  }
  return crc ^ 0xFFFFFFFF;
}

function crc32Hex(str: string): string {
  return (crc32(str) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// -------------------- Компонент --------------------
const EncodingTools = () => {
  const [inputText, setInputText] = useState('Привет, мир!');
  const [base64Result, setBase64Result] = useState('');
  const [asciiResult, setAsciiResult] = useState<number[]>([]);
  const [crcResult, setCrcResult] = useState('');

  const handleBase64Encode = () => {
    setBase64Result(base64Encode(inputText));
  };

  const handleBase64Decode = () => {
    setBase64Result(base64Decode(inputText));
  };

  const handleAsciiEncode = () => {
    setAsciiResult(stringToAsciiCodes(inputText));
  };

  const handleCrc = () => {
    setCrcResult(crc32Hex(inputText));
  };

  // Автоматический пересчёт при изменении текста
  useMemo(() => {
    if (inputText) {
      // eslint-disable-next-line react-hooks/set-state-in-render
      handleCrc();
      // eslint-disable-next-line react-hooks/set-state-in-render
      handleAsciiEncode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Кодирование и декодирование
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Входной текст</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Base64 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Base64</h4>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleBase64Encode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 rounded transition"
                >
                  Кодировать
                </button>
                <button
                  onClick={handleBase64Decode}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-1 rounded transition"
                >
                  Декодировать
                </button>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 font-mono text-sm break-all min-h-[32px]">
                {base64Result || '—'}
              </div>
            </div>

            {/* ASCII */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">ASCII коды</h4>
              <div className="flex flex-wrap gap-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 min-h-[32px]">
                {asciiResult.length > 0 ? (
                  asciiResult.map((code, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs">
                      <span className="text-gray-700 dark:text-gray-300">{String.fromCharCode(code)}</span>
                      <span className="text-gray-400 dark:text-gray-500">→</span>
                      <span className="font-mono text-amber-700 dark:text-amber-300">{code}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </div>
            </div>

            {/* CRC32 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">CRC32</h4>
              <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 font-mono text-sm break-all min-h-[32px] text-center">
                {crcResult ? (
                  <span className="text-green-700 dark:text-green-300 font-bold">{crcResult}</span>
                ) : (
                  '—'
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Хеш-сумма CRC32 (8 символов в hex)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Что это?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li><span className="font-medium">Base64</span> — кодирование двоичных данных в текстовый формат (используется в MIME, JSON).</li>
          <li><span className="font-medium">ASCII</span> — таблица символов, каждый символ имеет числовой код (0–127).</li>
          <li><span className="font-medium">CRC32</span> — циклический избыточный код, используется для проверки целостности данных.</li>
        </ul>
      </div>
    </div>
  );
};

export default EncodingTools;