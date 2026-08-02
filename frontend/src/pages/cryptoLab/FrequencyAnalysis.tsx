import { useState, useMemo } from 'react';

// Эталонные частоты для русского языка
const RUSSIAN_FREQ: [string, number][] = [
  ['О', 10.97], ['Е', 8.45], ['А', 8.01], ['И', 7.35], ['Н', 6.70],
  ['Т', 6.26], ['С', 5.47], ['Р', 4.73], ['В', 4.54], ['Л', 4.40],
  ['К', 3.49], ['М', 3.21], ['Д', 2.98], ['П', 2.81], ['У', 2.62],
  ['Я', 2.01], ['Ы', 1.90], ['Ь', 1.74], ['Г', 1.70], ['З', 1.65],
  ['Б', 1.59], ['Ч', 1.44], ['Й', 1.21], ['Х', 0.97], ['Ж', 0.94],
  ['Ю', 0.64], ['Ш', 0.60], ['Ц', 0.48], ['Щ', 0.36], ['Э', 0.33],
  ['Ф', 0.13], ['Ъ', 0.02], ['Ё', 0.01],
];

const ENGLISH_FREQ: [string, number][] = [
  ['E', 12.70], ['T', 9.06], ['A', 8.17], ['O', 7.51], ['I', 6.97],
  ['N', 6.75], ['S', 6.33], ['H', 6.09], ['R', 5.99], ['D', 4.25],
  ['L', 4.03], ['C', 2.78], ['U', 2.76], ['M', 2.41], ['W', 2.36],
  ['F', 2.23], ['G', 2.02], ['Y', 1.97], ['P', 1.93], ['B', 1.29],
  ['V', 0.98], ['K', 0.77], ['J', 0.15], ['X', 0.15], ['Q', 0.10],
  ['Z', 0.07],
];

// Большие тексты для примеров
const EXAMPLE_RUSSIAN_OPEN = 
`Вот уже два дня, как я в Петербурге, и все еще никуда не выезжал. Жду приятеля, который обещал приехать ко мне, и оттого не могу никуда выехать. Хорошо, что я взял с собой книгу, а то бы скука одолела. С утра сегодня было пасмурно, к вечеру разгулялось, и я надеюсь, что завтра будет хорошая погода. Впрочем, мне все равно, какая погода, потому что я собираюсь сидеть дома. Я хочу написать письмо, но не знаю, что писать. Ах, как я скучаю по дому.`;

function caesarRussian(text: string, shift: number): string {
  const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  let result = '';
  for (const ch of text.toUpperCase()) {
    const index = alphabet.indexOf(ch);
    if (index === -1) result += ch;
    else result += alphabet[(index + shift) % alphabet.length];
  }
  return result;
}

const EXAMPLE_RUSSIAN_ENCRYPTED = caesarRussian(EXAMPLE_RUSSIAN_OPEN, 3);

const EXAMPLE_ENGLISH_OPEN = 
`It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.`;

function caesarEnglish(text: string, shift: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (const ch of text.toUpperCase()) {
    const index = alphabet.indexOf(ch);
    if (index === -1) result += ch;
    else result += alphabet[(index + shift) % alphabet.length];
  }
  return result;
}

const EXAMPLE_ENGLISH_ENCRYPTED = caesarEnglish(EXAMPLE_ENGLISH_OPEN, 3);

// Функция для подсчёта частот
function calculateFrequencies(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const upper = text.toUpperCase();
  let total = 0;
  for (const char of upper) {
    if (/[А-ЯЁA-Z]/.test(char)) {
      freq.set(char, (freq.get(char) || 0) + 1);
      total++;
    }
  }
  const result = new Map<string, number>();
  if (total === 0) return result;
  for (const [char, count] of freq) {
    result.set(char, (count / total) * 100);
  }
  return result;
}

// Применение подстановки
function applySubstitution(text: string, mapping: Map<string, string>): string {
  let result = '';
  for (const char of text) {
    const upper = char.toUpperCase();
    if (mapping.has(upper)) {
      const replacement = mapping.get(upper)!;
      result += char === upper ? replacement : replacement.toLowerCase();
    } else {
      result += char;
    }
  }
  return result;
}

// Построение замен на основе частот открытого и зашифрованного текстов
function buildMappingFromFreqs(openFreq: Map<string, number>, encryptedFreq: Map<string, number>): Map<string, string> {
  const mapping = new Map<string, string>();
  const sortedOpen = Array.from(openFreq.entries()).sort((a, b) => b[1] - a[1]).map(([ch]) => ch);
  const sortedEncrypted = Array.from(encryptedFreq.entries()).sort((a, b) => b[1] - a[1]).map(([ch]) => ch);
  const len = Math.min(sortedEncrypted.length, sortedOpen.length);
  for (let i = 0; i < len; i++) {
    mapping.set(sortedEncrypted[i], sortedOpen[i]);
  }
  return mapping;
}

// Построение замен на основе эталонных частот
function buildMappingFromReference(encryptedFreq: Map<string, number>, referenceFreq: [string, number][]): Map<string, string> {
  const mapping = new Map<string, string>();
  const sortedEncrypted = Array.from(encryptedFreq.entries()).sort((a, b) => b[1] - a[1]).map(([ch]) => ch);
  const sortedReference = referenceFreq.map(([ch]) => ch);
  const len = Math.min(sortedEncrypted.length, sortedReference.length);
  for (let i = 0; i < len; i++) {
    mapping.set(sortedEncrypted[i], sortedReference[i]);
  }
  return mapping;
}

// -------------------- Компонент --------------------
const FrequencyAnalysis = () => {
  const [openText, setOpenText] = useState(EXAMPLE_RUSSIAN_OPEN);
  const [encryptedText, setEncryptedText] = useState(EXAMPLE_RUSSIAN_ENCRYPTED);
  const [decryptedText, setDecryptedText] = useState('');
  const [mapping, setMapping] = useState<Map<string, string>>(new Map());
  const [language, setLanguage] = useState<'russian' | 'english'>('russian');

  const openFreq = useMemo(() => calculateFrequencies(openText), [openText]);
  const encryptedFreq = useMemo(() => calculateFrequencies(encryptedText), [encryptedText]);
  const referenceFreq = language === 'russian' ? RUSSIAN_FREQ : ENGLISH_FREQ;

  const loadExample = (lang: 'russian' | 'english') => {
    if (lang === 'russian') {
      setOpenText(EXAMPLE_RUSSIAN_OPEN);
      setEncryptedText(EXAMPLE_RUSSIAN_ENCRYPTED);
    } else {
      setOpenText(EXAMPLE_ENGLISH_OPEN);
      setEncryptedText(EXAMPLE_ENGLISH_ENCRYPTED);
    }
    setLanguage(lang);
    setDecryptedText('');
    setMapping(new Map());
  };

  const buildFromOpenText = () => {
    if (openFreq.size === 0 || encryptedFreq.size === 0) {
      alert('Недостаточно данных для построения таблицы замен.');
      return;
    }
    const newMapping = buildMappingFromFreqs(openFreq, encryptedFreq);
    setMapping(newMapping);
    const decrypted = applySubstitution(encryptedText, newMapping);
    setDecryptedText(decrypted);
  };

  const buildFromReference = () => {
    if (encryptedFreq.size === 0) {
      alert('Сначала введите зашифрованный текст.');
      return;
    }
    const newMapping = buildMappingFromReference(encryptedFreq, referenceFreq);
    setMapping(newMapping);
    const decrypted = applySubstitution(encryptedText, newMapping);
    setDecryptedText(decrypted);
  };

  const handleMappingChange = (from: string, to: string) => {
    const newMapping = new Map(mapping);
    if (to === '') newMapping.delete(from);
    else newMapping.set(from, to);
    setMapping(newMapping);
    const decrypted = applySubstitution(encryptedText, newMapping);
    setDecryptedText(decrypted);
  };

  const resetAll = () => {
    setOpenText('');
    setEncryptedText('');
    setDecryptedText('');
    setMapping(new Map());
  };

  const sortedEncryptedChars = useMemo(() => {
    return Array.from(encryptedFreq.entries()).sort((a, b) => b[1] - a[1]);
  }, [encryptedFreq]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Криптоанализ методом частотного анализа
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Язык (эталонные частоты)</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Открытый текст (художественный)</label>
              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => loadExample('russian')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                >
                  Пример (русский)
                </button>
                <button
                  onClick={() => loadExample('english')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                >
                  Пример (английский)
                </button>
                <button
                  onClick={() => setOpenText('')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition"
                >
                  Очистить
                </button>
              </div>
              <textarea
                value={openText}
                onChange={(e) => setOpenText(e.target.value)}
                rows={6}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-sm"
                placeholder="Вставьте большой художественный текст"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Зашифрованный текст</label>
              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => loadExample('russian')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                >
                  Пример (русский)
                </button>
                <button
                  onClick={() => loadExample('english')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                >
                  Пример (английский)
                </button>
                <button
                  onClick={() => setEncryptedText('')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition"
                >
                  Очистить
                </button>
              </div>
              <textarea
                value={encryptedText}
                onChange={(e) => setEncryptedText(e.target.value)}
                rows={6}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-sm"
                placeholder="Вставьте зашифрованный текст (метод простой замены)"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={buildFromOpenText}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                Построить замены (по открытому тексту)
              </button>
              <button
                onClick={buildFromReference}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Использовать эталонные частоты
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сброс
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Расшифрованный текст</label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-[48px] font-mono text-sm break-all text-gray-900 dark:text-gray-100 max-h-60 overflow-y-auto">
                {decryptedText || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Частотный анализ</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Открытый текст</div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  {Array.from(openFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([ch, freq]) => (
                    <div key={ch} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold w-6">{ch}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 h-2 rounded">
                        <div className="bg-amber-500 h-full rounded" style={{ width: `${Math.min(freq * 1.5, 100)}%` }} />
                      </div>
                      <span className="font-mono w-12">{freq.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Зашифрованный текст</div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  {Array.from(encryptedFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([ch, freq]) => (
                    <div key={ch} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold w-6">{ch}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 h-2 rounded">
                        <div className="bg-amber-500 h-full rounded" style={{ width: `${Math.min(freq * 1.5, 100)}%` }} />
                      </div>
                      <span className="font-mono w-12">{freq.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Таблица замен (вручную)</h4>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                {sortedEncryptedChars.slice(0, 20).map(([from]) => (
                  <div key={from} className="flex items-center gap-2 text-xs py-0.5">
                    <span className="font-mono font-bold w-6">{from}</span>
                    <span className="text-gray-400">→</span>
                    <input
                      type="text"
                      maxLength={1}
                      className="w-8 border rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-center font-mono text-xs"
                      value={mapping.get(from) || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        if (val.length <= 1 && (/[А-ЯA-Z]/.test(val) || val === '')) {
                          handleMappingChange(from, val);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Вручную корректируйте замены. Изменения применяются сразу.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает частотный анализ?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Загрузите большой открытый текст (художественный) для получения частот символов языка.</li>
          <li>Загрузите зашифрованный текст (полученный простой заменой).</li>
          <li>Программа сопоставляет наиболее частые символы шифротекста с наиболее частыми символами открытого текста.</li>
          <li>Вы можете вручную корректировать замены для достижения читаемого текста.</li>
          <li>Чем длиннее тексты, тем точнее анализ.</li>
          <li>Если открытого текста нет, используйте кнопку "Эталонные частоты".</li>
        </ul>
      </div>
    </div>
  );
};

export default FrequencyAnalysis;