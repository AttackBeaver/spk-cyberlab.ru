import { useState } from 'react';

const RUSSIAN_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const ENGLISH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Атбаш для русского алфавита
function atbashRussian(text: string): { result: string; steps: { char: string; mapped: string }[] } {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; mapped: string }[] = [];
  for (const char of upper) {
    const index = RUSSIAN_ALPHABET.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, mapped: char });
      continue;
    }
    const mappedIndex = RUSSIAN_ALPHABET.length - 1 - index;
    const mappedChar = RUSSIAN_ALPHABET[mappedIndex];
    result += mappedChar;
    steps.push({ char, mapped: mappedChar });
  }
  return { result, steps };
}

// Атбаш для английского алфавита
function atbashEnglish(text: string): { result: string; steps: { char: string; mapped: string }[] } {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; mapped: string }[] = [];
  for (const char of upper) {
    const index = ENGLISH_ALPHABET.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, mapped: char });
      continue;
    }
    const mappedIndex = ENGLISH_ALPHABET.length - 1 - index;
    const mappedChar = ENGLISH_ALPHABET[mappedIndex];
    result += mappedChar;
    steps.push({ char, mapped: mappedChar });
  }
  return { result, steps };
}

// -------------------- Компонент --------------------
const AtbashCipher = () => {
  const [text, setText] = useState('ПРИВЕТ');
  const [language, setLanguage] = useState<'russian' | 'english'>('russian');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState<{ char: string; mapped: string }[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const handleEncrypt = () => {
    const output = language === 'russian' ? atbashRussian(text) : atbashEnglish(text);
    setResult(output.result);
    setSteps(output.steps);
    setShowSteps(true);
  };

  const clearAll = () => {
    setResult('');
    setSteps([]);
    setShowSteps(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Атбаш — визуализация
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Язык</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('russian')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    language === 'russian'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Русский
                </button>
                <button
                  onClick={() => setLanguage('english')}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текст</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Введите текст"
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
                onClick={clearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Очистить
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Результат</label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg break-all text-gray-900 dark:text-gray-100 min-h-[48px]">
                {result || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Таблица замены</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="font-mono text-sm">
                {language === 'russian' ? (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {RUSSIAN_ALPHABET.split('').map((ch, idx) => (
                        <span key={idx} className="p-1 bg-white dark:bg-gray-800 rounded text-xs">
                          {ch}→{RUSSIAN_ALPHABET[RUSSIAN_ALPHABET.length - 1 - idx]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {ENGLISH_ALPHABET.split('').map((ch, idx) => (
                        <span key={idx} className="p-1 bg-white dark:bg-gray-800 rounded text-xs">
                          {ch}→{ENGLISH_ALPHABET[ENGLISH_ALPHABET.length - 1 - idx]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Пошаговый вывод */}
      {showSteps && steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Пошаговое преобразование</h4>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1 p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded shadow-sm text-sm">
                <span className="text-gray-700 dark:text-gray-300">{step.char}</span>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{step.mapped}</span>
                {idx < steps.length - 1 && <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает шифр Атбаш?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Каждая буква заменяется на противоположную по алфавиту (первая ↔ последняя).</li>
          <li>Шифрование и дешифрование идентичны (инволютивный шифр).</li>
          <li>Простой моноалфавитный шифр, нестойкий к криптоанализу.</li>
          <li>А = Я, Б = Ю, В = Э и т.д. для русского алфавита.</li>
        </ul>
      </div>
    </div>
  );
};

export default AtbashCipher;