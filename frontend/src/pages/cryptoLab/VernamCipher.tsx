import { useState } from 'react';

const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

// Генерация случайного ключа той же длины, что и текст
function generateKey(text: string): string {
  let key = '';
  for (let i = 0; i < text.length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    key += alphabet[randomIndex];
  }
  return key;
}

// Получение индекса символа в алфавите
function getIndex(char: string): number {
  return alphabet.indexOf(char.toUpperCase());
}

// Шифрование Вернама (XOR по модулю длины алфавита)
function vernamEncrypt(text: string, key: string): {
  result: string;
  steps: {
    char: string;
    charCode: number;
    keyChar: string;
    keyCode: number;
    encryptedChar: string;
    encryptedCode: number;
    binaryChar: string;
    binaryKey: string;
    binaryResult: string;
  }[];
} {
  const upperText = text.toUpperCase();
  const upperKey = key.toUpperCase();
  let result = '';
  const steps: {
    char: string;
    charCode: number;
    keyChar: string;
    keyCode: number;
    encryptedChar: string;
    encryptedCode: number;
    binaryChar: string;
    binaryKey: string;
    binaryResult: string;
  }[] = [];
  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    const keyChar = upperKey[i % upperKey.length];
    const charIndex = getIndex(char);
    const keyIndex = getIndex(keyChar);
    if (charIndex === -1 || keyIndex === -1) {
      result += char;
      steps.push({
        char,
        charCode: charIndex,
        keyChar,
        keyCode: keyIndex,
        encryptedChar: char,
        encryptedCode: -1,
        binaryChar: charIndex !== -1 ? charIndex.toString(2).padStart(6, '0') : '—',
        binaryKey: keyIndex !== -1 ? keyIndex.toString(2).padStart(6, '0') : '—',
        binaryResult: '—',
      });
      continue;
    }
    const encryptedIndex = (charIndex + keyIndex) % alphabet.length;
    const encryptedChar = alphabet[encryptedIndex];
    result += encryptedChar;
    steps.push({
      char,
      charCode: charIndex,
      keyChar,
      keyCode: keyIndex,
      encryptedChar,
      encryptedCode: encryptedIndex,
      binaryChar: charIndex.toString(2).padStart(6, '0'),
      binaryKey: keyIndex.toString(2).padStart(6, '0'),
      binaryResult: encryptedIndex.toString(2).padStart(6, '0'),
    });
  }
  return { result, steps };
}

// Дешифрование Вернама (XOR обратно)
function vernamDecrypt(text: string, key: string): {
  result: string;
  steps: {
    char: string;
    charCode: number;
    keyChar: string;
    keyCode: number;
    decryptedChar: string;
    decryptedCode: number;
    binaryChar: string;
    binaryKey: string;
    binaryResult: string;
  }[];
} {
  const upperText = text.toUpperCase();
  const upperKey = key.toUpperCase();
  let result = '';
  const steps: {
    char: string;
    charCode: number;
    keyChar: string;
    keyCode: number;
    decryptedChar: string;
    decryptedCode: number;
    binaryChar: string;
    binaryKey: string;
    binaryResult: string;
  }[] = [];
  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    const keyChar = upperKey[i % upperKey.length];
    const charIndex = getIndex(char);
    const keyIndex = getIndex(keyChar);
    if (charIndex === -1 || keyIndex === -1) {
      result += char;
      steps.push({
        char,
        charCode: charIndex,
        keyChar,
        keyCode: keyIndex,
        decryptedChar: char,
        decryptedCode: -1,
        binaryChar: charIndex !== -1 ? charIndex.toString(2).padStart(6, '0') : '—',
        binaryKey: keyIndex !== -1 ? keyIndex.toString(2).padStart(6, '0') : '—',
        binaryResult: '—',
      });
      continue;
    }
    let decryptedIndex = (charIndex - keyIndex) % alphabet.length;
    if (decryptedIndex < 0) decryptedIndex += alphabet.length;
    const decryptedChar = alphabet[decryptedIndex];
    result += decryptedChar;
    steps.push({
      char,
      charCode: charIndex,
      keyChar,
      keyCode: keyIndex,
      decryptedChar,
      decryptedCode: decryptedIndex,
      binaryChar: charIndex.toString(2).padStart(6, '0'),
      binaryKey: keyIndex.toString(2).padStart(6, '0'),
      binaryResult: decryptedIndex.toString(2).padStart(6, '0'),
    });
  }
  return { result, steps };
}

// -------------------- Компонент --------------------
const VernamCipher = () => {
  const [text, setText] = useState('ПРИВЕТ');
  const [key, setKey] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [result, setResult] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [steps, setSteps] = useState<any[]>([]);

  const handleAction = () => {
    let output;
    if (mode === 'encrypt') {
      if (!key || key.length < text.length) {
        alert('Ключ должен быть не короче текста. Сгенерируйте ключ.');
        return;
      }
      output = vernamEncrypt(text, key);
      setResult(output.result);
      setSteps(output.steps);
    } else {
      if (!key) {
        alert('Введите ключ для дешифрования');
        return;
      }
      output = vernamDecrypt(text, key);
      setResult(output.result);
      setSteps(output.steps);
    }
  };

  const generateRandomKey = () => {
    const newKey = generateKey(text);
    setKey(newKey);
  };

  const clearAll = () => {
    setResult('');
    setSteps([]);
  };

  // Формула для отображения
  const formula = mode === 'encrypt' 
    ? 'C = (P + K) mod N' 
    : 'P = (C - K) mod N';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Вернама (одноразовый блокнот)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMode('encrypt')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'encrypt'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Шифрование
              </button>
              <button
                onClick={() => setMode('decrypt')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'decrypt'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Дешифрование
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текст</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ключ (должен быть той же длины, что и текст)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Введите ключ или сгенерируйте"
                />
                <button
                  onClick={generateRandomKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm whitespace-nowrap"
                >
                  Сгенерировать
                </button>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Длина ключа: {key.length} / {text.length} {key.length >= text.length ? '✅' : '❌'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAction}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                {mode === 'encrypt' ? 'Зашифровать' : 'Расшифровать'}
              </button>
              <button
                onClick={clearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Очистить
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-mono">
                <div><span className="text-gray-500 dark:text-gray-400">Формула:</span> {formula}</div>
                <div><span className="text-gray-500 dark:text-gray-400">Алфавит:</span> {alphabet.length} символов</div>
                <div><span className="text-gray-500 dark:text-gray-400">Результат:</span> <span className="text-amber-600 dark:text-amber-400 font-bold">{result || '—'}</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Визуализация процесса</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-wrap gap-2 text-sm font-mono">
                <div className="w-full flex gap-4">
                  <span className="text-gray-500 dark:text-gray-400 w-8">#</span>
                  <span className="text-gray-500 dark:text-gray-400 w-12">Символ</span>
                  <span className="text-gray-500 dark:text-gray-400 w-16">Код</span>
                  <span className="text-gray-500 dark:text-gray-400 w-12">Ключ</span>
                  <span className="text-gray-500 dark:text-gray-400 w-16">Код</span>
                  <span className="text-gray-500 dark:text-gray-400 w-20">Результат</span>
                </div>
                {steps.length > 0 ? (
                  steps.map((step, idx) => (
                    <div key={idx} className="w-full flex gap-4 items-center p-1 bg-white dark:bg-gray-800 rounded">
                      <span className="text-gray-400 dark:text-gray-500 w-8 text-center">{idx + 1}</span>
                      <span className="text-gray-800 dark:text-gray-200 w-12 text-center">{step.char}</span>
                      <span className="text-blue-600 dark:text-blue-400 w-16 text-center font-mono">{step.charCode !== -1 ? step.charCode : '—'}</span>
                      <span className="text-gray-800 dark:text-gray-200 w-12 text-center">{step.keyChar}</span>
                      <span className="text-blue-600 dark:text-blue-400 w-16 text-center font-mono">{step.keyCode !== -1 ? step.keyCode : '—'}</span>
                      <span className="text-amber-600 dark:text-amber-400 w-20 text-center font-mono font-bold">{step.encryptedChar || step.decryptedChar}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 p-2">Нет данных</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Бинарное представление */}
      {steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Бинарное представление (XOR)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border px-2 py-1 text-left">№</th>
                  <th className="border px-2 py-1 text-left">Символ</th>
                  <th className="border px-2 py-1 text-left">Бит</th>
                  <th className="border px-2 py-1 text-left">⊕</th>
                  <th className="border px-2 py-1 text-left">Ключ</th>
                  <th className="border px-2 py-1 text-left">Бит</th>
                  <th className="border px-2 py-1 text-left">=</th>
                  <th className="border px-2 py-1 text-left">Результат</th>
                  <th className="border px-2 py-1 text-left">Бит</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, idx) => {
                  const isInvalid = step.charCode === -1 || step.keyCode === -1;
                  return (
                    <tr key={idx} className={isInvalid ? 'opacity-50' : ''}>
                      <td className="border px-2 py-1 text-center">{idx + 1}</td>
                      <td className="border px-2 py-1 font-mono">{step.char}</td>
                      <td className="border px-2 py-1 font-mono text-blue-600 dark:text-blue-400">{step.binaryChar}</td>
                      <td className="border px-2 py-1 text-center text-gray-400">⊕</td>
                      <td className="border px-2 py-1 font-mono">{step.keyChar}</td>
                      <td className="border px-2 py-1 font-mono text-blue-600 dark:text-blue-400">{step.binaryKey}</td>
                      <td className="border px-2 py-1 text-center text-gray-400">=</td>
                      <td className="border px-2 py-1 font-mono font-bold text-amber-600 dark:text-amber-400">{step.encryptedChar || step.decryptedChar}</td>
                      <td className="border px-2 py-1 font-mono text-green-600 dark:text-green-400">{step.binaryResult}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Для каждого символа вычисляется XOR (сложение по модулю 2) кодов символа и ключа в двоичной системе.
            Длина кода — {Math.ceil(Math.log2(alphabet.length))} бит.
          </div>
        </div>
      )}

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает одноразовый блокнот?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Абсолютно стойкий шифр при условии: 1) ключ той же длины, 2) ключ случайный, 3) ключ используется один раз.</li>
          <li>Шифрование: C = (P + K) mod N, дешифрование: P = (C - K) mod N.</li>
          <li>В таблице показан каждый шаг: коды символов, побитовый XOR и результат.</li>
          <li>Даже теоретически невзламываемый, но сложен в практическом применении.</li>
        </ul>
      </div>
    </div>
  );
};

export default VernamCipher;