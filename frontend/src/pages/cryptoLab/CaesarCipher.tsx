import { useState, useMemo } from 'react';

const RUSSIAN_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const ENGLISH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const caesarEncrypt = (text: string, shift: number, alphabet: string): string => {
  const upper = text.toUpperCase();
  let result = '';
  for (const char of upper) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      result += char;
    } else {
      const newIndex = (index + shift) % alphabet.length;
      result += alphabet[newIndex];
    }
  }
  return result;
};

const CaesarCipher = () => {
  const [language, setLanguage] = useState<'russian' | 'english'>('russian');
  const [text, setText] = useState('ПРИВЕТМИР');
  const [shift, setShift] = useState(3);
  const [encrypted, setEncrypted] = useState('');

  const alphabet = language === 'russian' ? RUSSIAN_ALPHABET : ENGLISH_ALPHABET;

  const handleEncrypt = () => {
    setEncrypted(caesarEncrypt(text, shift, alphabet));
  };

  const shiftedAlphabet = useMemo(() => {
    return alphabet
      .split('')
      .map((char, index) => {
        const newIndex = (index + shift) % alphabet.length;
        return { original: char, shifted: alphabet[newIndex] };
      });
  }, [shift, alphabet]);

  const renderHighlightedText = (source: string, target: string) => {
    const sourceUpper = source.toUpperCase();
    const targetUpper = target.toUpperCase();
    const chars = sourceUpper.split('');
    return chars.map((char, i) => {
      const isInAlphabet = alphabet.includes(char);
      if (!isInAlphabet) {
        return <span key={i} className="text-gray-400 dark:text-gray-500">{char}</span>;
      }
      const mappedChar = targetUpper[i] || char;
      return (
        <span key={i} className="inline-block relative group text-center">
          <span className="text-blue-600 dark:text-blue-400 font-bold block">{char}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 block -mt-1">↓</span>
          <span className="text-green-600 dark:text-green-400 font-bold block">{mappedChar}</span>
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Цезаря
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Язык</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLanguage('russian');
                    setText('ПРИВЕТМИР');
                    setEncrypted('');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    language === 'russian'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Русский
                </button>
                <button
                  onClick={() => {
                    setLanguage('english');
                    setText('HELLOWORLD');
                    setEncrypted('');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    language === 'english'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Открытый текст
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder={language === 'russian' ? 'Введите текст на русском' : 'Enter text in English'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сдвиг: {shift}
              </label>
              <input
                type="range"
                min="0"
                max={alphabet.length - 1}
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>0</span>
                <span>{alphabet.length - 1}</span>
              </div>
            </div>

            <button
              onClick={handleEncrypt}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              Зашифровать
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

            {encrypted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пошаговое соответствие
                </label>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg flex flex-wrap gap-1 justify-center">
                  {renderHighlightedText(text, encrypted)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Алфавит со сдвигом {shift}
        </h4>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-16 lg:grid-cols-33 gap-1">
          {shiftedAlphabet.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-1 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
            >
              <span className="text-gray-500 dark:text-gray-400 text-xs">{item.original}</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">→</span>
              <span className="text-green-600 dark:text-green-400 font-bold">{item.shifted}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Каждая буква заменяется на букву, сдвинутую на {shift} позиций вперёд по алфавиту.
        </p>
      </div>
    </div>
  );
};

export default CaesarCipher;