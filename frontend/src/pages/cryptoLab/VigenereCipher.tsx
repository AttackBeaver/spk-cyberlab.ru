import { useState } from 'react';

const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

const vigenereEncrypt = (text: string, key: string): string => {
  const upperText = text.toUpperCase();
  const upperKey = key.toUpperCase();
  let result = '';
  let keyIndex = 0;
  for (const char of upperText) {
    const textPos = alphabet.indexOf(char);
    if (textPos === -1) {
      result += char;
      continue;
    }
    const keyChar = upperKey[keyIndex % upperKey.length];
    const keyPos = alphabet.indexOf(keyChar);
    if (keyPos === -1) {
      result += char;
      keyIndex++;
      continue;
    }
    const newPos = (textPos + keyPos) % alphabet.length;
    result += alphabet[newPos];
    keyIndex++;
  }
  return result;
};

const vigenereDecrypt = (text: string, key: string): string => {
  const upperText = text.toUpperCase();
  const upperKey = key.toUpperCase();
  let result = '';
  let keyIndex = 0;
  for (const char of upperText) {
    const textPos = alphabet.indexOf(char);
    if (textPos === -1) {
      result += char;
      continue;
    }
    const keyChar = upperKey[keyIndex % upperKey.length];
    const keyPos = alphabet.indexOf(keyChar);
    if (keyPos === -1) {
      result += char;
      keyIndex++;
      continue;
    }
    let newPos = (textPos - keyPos) % alphabet.length;
    if (newPos < 0) newPos += alphabet.length;
    result += alphabet[newPos];
    keyIndex++;
  }
  return result;
};

const VigenereCipher = () => {
  const [text, setText] = useState('ПРИВЕТМИР');
  const [key, setKey] = useState('КЛЮЧ');
  const [encrypted, setEncrypted] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [showKeyTable, setShowKeyTable] = useState(false);

  const handleEncrypt = () => {
    const result = vigenereEncrypt(text, key);
    setEncrypted(result);
    setDecrypted('');
  };

  const handleDecrypt = () => {
    if (!encrypted) return;
    const result = vigenereDecrypt(encrypted, key);
    setDecrypted(result);
  };

  // Генерация таблицы Виженера для визуализации
  const generateVigenereTable = () => {
    const rows = [];
    for (let i = 0; i < alphabet.length; i++) {
      const row = [];
      for (let j = 0; j < alphabet.length; j++) {
        row.push(alphabet[(i + j) % alphabet.length]);
      }
      rows.push(row);
    }
    return rows;
  };

  const table = generateVigenereTable();

  // Получить индексы для подсветки
  const getKeyIndices = () => {
    const upperKey = key.toUpperCase();
    return upperKey.split('').map(char => alphabet.indexOf(char)).filter(idx => idx !== -1);
  };

  const keyIndices = getKeyIndices();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Виженера
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Открытый текст
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Введите текст на русском"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ключевое слово
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Введите ключ"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                Зашифровать
              </button>
              <button
                onClick={handleDecrypt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                disabled={!encrypted}
              >
                Расшифровать
              </button>
            </div>

            <button
              onClick={() => setShowKeyTable(!showKeyTable)}
              className="w-full text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              {showKeyTable ? 'Скрыть таблицу Виженера' : 'Показать таблицу Виженера'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Зашифрованный текст
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-[48px] font-mono text-lg break-all text-gray-900 dark:text-gray-100">
                {encrypted || '—'}
              </div>
            </div>

            {decrypted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Расшифрованный текст
                </label>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg min-h-[48px] font-mono text-lg break-all text-green-700 dark:text-green-300">
                  {decrypted}
                </div>
              </div>
            )}

            {encrypted && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Ключ:</span>{' '}
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {key.toUpperCase().repeat(Math.ceil(text.length / key.length)).slice(0, text.length)}
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Ключ повторяется до длины текста
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Таблица Виженера */}
      {showKeyTable && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 overflow-auto">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            Таблица Виженера (алфавит {alphabet.length} букв)
          </h4>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    ↓
                  </th>
                  {alphabet.split('').map((char, idx) => (
                    <th
                      key={idx}
                      className={`p-1 border border-gray-200 dark:border-gray-700 min-w-[24px] ${
                        keyIndices.includes(idx) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      {char}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td
                      className={`p-1 border border-gray-200 dark:border-gray-700 font-bold text-xs ${
                        keyIndices.includes(rowIdx) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      {alphabet[rowIdx]}
                    </td>
                    {row.map((char, colIdx) => (
                      <td
                        key={colIdx}
                        className={`p-1 border border-gray-200 dark:border-gray-700 text-center min-w-[24px] ${
                          keyIndices.includes(rowIdx) && keyIndices.includes(colIdx)
                            ? 'bg-amber-200 dark:bg-amber-800/40 font-bold text-amber-700 dark:text-amber-300'
                            : keyIndices.includes(rowIdx) || keyIndices.includes(colIdx)
                            ? 'bg-amber-50 dark:bg-amber-900/10'
                            : ''
                        }`}
                      >
                        {char}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Зелёным выделены строки и столбцы, соответствующие буквам ключа.
          </p>
        </div>
      )}
    </div>
  );
};

export default VigenereCipher;