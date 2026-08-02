import { useState, useMemo } from 'react';

// Генерация псевдослучайного ключа (байтов)
function generateKey(length: number): number[] {
  const key: number[] = [];
  for (let i = 0; i < length; i++) {
    key.push(Math.floor(Math.random() * 256));
  }
  return key;
}

// XOR двух массивов байтов
function xorBytes(a: number[], b: number[]): number[] {
  const result: number[] = [];
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    result.push(a[i] ^ b[i]);
  }
  return result;
}

// Преобразование строки в байты (UTF-8)
function stringToBytes(str: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(str));
}

// Преобразование байтов в строку (UTF-8)
function bytesToString(bytes: number[]): string {
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

// Визуализация байтов в hex
function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

const StreamCipherCryptoanalysis = () => {
  const [plaintext1, setPlaintext1] = useState('Привет, мир!');
  const [plaintext2, setPlaintext2] = useState('Секретное сообщение');
  const [keyLength, setKeyLength] = useState(32);
  const [key, setKey] = useState<number[]>([]);
  const [cipher1, setCipher1] = useState<number[]>([]);
  const [cipher2, setCipher2] = useState<number[]>([]);
  const [recoveredPlaintext2, setRecoveredPlaintext2] = useState<string>('');
  const [showBytes, setShowBytes] = useState(false);

  // Генерация ключа и шифрование
  const encrypt = () => {
    const bytes1 = stringToBytes(plaintext1);
    const bytes2 = stringToBytes(plaintext2);
    const maxLen = Math.max(bytes1.length, bytes2.length);
    const keyBytes = generateKey(maxLen);
    setKey(keyBytes);

    // Дополняем короткие сообщения нулями до длины ключа
    const padded1 = [...bytes1, ...new Array(maxLen - bytes1.length).fill(0)];
    const padded2 = [...bytes2, ...new Array(maxLen - bytes2.length).fill(0)];

    const c1 = xorBytes(padded1, keyBytes);
    const c2 = xorBytes(padded2, keyBytes);
    setCipher1(c1);
    setCipher2(c2);

    // Восстановление plaintext2, если известен plaintext1 и cipher1
    // plaintext2_recovered = cipher1 XOR cipher2 XOR plaintext1
    // (c1 = p1 xor k, c2 = p2 xor k => c1 xor c2 = p1 xor p2 => p2 = c1 xor c2 xor p1)
    const recovered = xorBytes(xorBytes(c1, c2), padded1);
    // Обрезаем до длины оригинального plaintext2
    const trimmed = recovered.slice(0, bytes2.length);
    setRecoveredPlaintext2(bytesToString(trimmed));
  };

  const generateNewKey = () => {
    encrypt();
  };

  // При изменении текстов или длины ключа перешифровываем автоматически
  useMemo(() => {
    // eslint-disable-next-line react-hooks/set-state-in-render
    encrypt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plaintext1, plaintext2, keyLength]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Криптоанализ поточного шифра (XOR с повторным использованием ключа)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Открытый текст 1 (известен атакующему)
              </label>
              <input
                type="text"
                value={plaintext1}
                onChange={(e) => setPlaintext1(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Открытый текст 2 (секретный)
              </label>
              <input
                type="text"
                value={plaintext2}
                onChange={(e) => setPlaintext2(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Длина ключа (байт)
              </label>
              <input
                type="number"
                value={keyLength}
                onChange={(e) => setKeyLength(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <button
              onClick={generateNewKey}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              Сгенерировать новый ключ и зашифровать
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Зашифрованный текст 1 (перехвачен)
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-gray-100 min-h-[48px]">
                {cipher1.length > 0 ? bytesToHex(cipher1) : '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Зашифрованный текст 2 (перехвачен)
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-gray-100 min-h-[48px]">
                {cipher2.length > 0 ? bytesToHex(cipher2) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Блок с атакой */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          🔍 Атака восстановления второго открытого текста
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Известный открытый текст 1</label>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{plaintext1}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Восстановленный открытый текст 2</label>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm font-mono text-green-700 dark:text-green-300">
              {recoveredPlaintext2 || '—'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Оригинальный открытый текст 2 (для сравнения)</label>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{plaintext2}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Атака работает, если один и тот же ключ используется для шифрования двух сообщений. Зная одно сообщение и его шифр, можно восстановить другое.</p>
        </div>
      </div>

      {/* Дополнительная визуализация байтов */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowBytes(!showBytes)}
          className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          {showBytes ? 'Скрыть байтовое представление' : 'Показать байтовое представление'}
        </button>
        {showBytes && key.length > 0 && (
          <div className="mt-3 space-y-2 text-sm font-mono">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ключ (hex):</span>
              <span className="ml-2 text-gray-800 dark:text-gray-200">{bytesToHex(key)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Шифр 1 (hex):</span>
              <span className="ml-2 text-gray-800 dark:text-gray-200">{bytesToHex(cipher1)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Шифр 2 (hex):</span>
              <span className="ml-2 text-gray-800 dark:text-gray-200">{bytesToHex(cipher2)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Восстановленный текст 2 (байты):</span>
              <span className="ml-2 text-green-600 dark:text-green-400">
                {bytesToHex(stringToBytes(recoveredPlaintext2))}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает атака?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Поточный шифр с XOR использует псевдослучайный ключ той же длины, что и сообщение.</li>
          <li>Если один и тот же ключ используется для двух сообщений, то C1 ⊕ C2 = P1 ⊕ P2.</li>
          <li>Зная P1, можно восстановить P2: P2 = C1 ⊕ C2 ⊕ P1.</li>
          <li>Атака демонстрирует критическую ошибку — повторное использование ключа.</li>
        </ul>
      </div>
    </div>
  );
};

export default StreamCipherCryptoanalysis;