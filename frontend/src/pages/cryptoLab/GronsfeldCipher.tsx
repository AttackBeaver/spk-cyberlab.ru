import { useState } from 'react';

const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

const gronsfeldEncrypt = (text: string, key: string): { result: string; steps: { char: string; shift: number; encrypted: string }[] } => {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; shift: number; encrypted: string }[] = [];
  let keyIndex = 0;
  for (const char of upper) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, shift: 0, encrypted: char });
      continue;
    }
    const keyDigit = parseInt(key[keyIndex % key.length]);
    const shift = isNaN(keyDigit) ? 0 : keyDigit;
    const newIndex = (index + shift) % alphabet.length;
    const encryptedChar = alphabet[newIndex];
    result += encryptedChar;
    steps.push({ char, shift, encrypted: encryptedChar });
    keyIndex++;
  }
  return { result, steps };
};

const gronsfeldDecrypt = (text: string, key: string): { result: string; steps: { char: string; shift: number; decrypted: string }[] } => {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; shift: number; decrypted: string }[] = [];
  let keyIndex = 0;
  for (const char of upper) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, shift: 0, decrypted: char });
      continue;
    }
    const keyDigit = parseInt(key[keyIndex % key.length]);
    const shift = isNaN(keyDigit) ? 0 : keyDigit;
    let newIndex = (index - shift) % alphabet.length;
    if (newIndex < 0) newIndex += alphabet.length;
    const decryptedChar = alphabet[newIndex];
    result += decryptedChar;
    steps.push({ char, shift, decrypted: decryptedChar });
    keyIndex++;
  }
  return { result, steps };
};

const GronsfeldCipher = () => {
  const [text, setText] = useState('ПРИВЕТ');
  const [key, setKey] = useState('31415');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState<{ char: string; shift: number; resultChar: string }[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const handleAction = () => {
    let output;
    if (mode === 'encrypt') {
      output = gronsfeldEncrypt(text, key);
      setResult(output.result);
      setSteps(output.steps.map(s => ({ char: s.char, shift: s.shift, resultChar: s.encrypted })));
    } else {
      output = gronsfeldDecrypt(text, key);
      setResult(output.result);
      setSteps(output.steps.map(s => ({ char: s.char, shift: s.shift, resultChar: s.decrypted })));
    }
    setShowSteps(true);
  };

  const clearAll = () => {
    setResult('');
    setSteps([]);
    setShowSteps(false);
  };

  const generateRandomKey = () => {
    let newKey = '';
    for (let i = 0; i < 6; i++) {
      newKey += Math.floor(Math.random() * 10);
    }
    setKey(newKey);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Гронсфельда
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цифровой ключ</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Только цифры"
                />
                <button
                  onClick={generateRandomKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                >
                  Сгенерировать
                </button>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Результат</label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg break-all text-gray-900 dark:text-gray-100 min-h-[48px]">
                {result || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Повторяющийся ключ</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="font-mono text-sm break-all">
                <span className="text-gray-500 dark:text-gray-400">Текст: </span>
                <span className="text-gray-800 dark:text-gray-200">{text}</span>
              </div>
              <div className="font-mono text-sm break-all mt-1">
                <span className="text-gray-500 dark:text-gray-400">Ключ: </span>
                <span className="text-blue-600 dark:text-blue-400">{key}</span>
              </div>
              <div className="font-mono text-sm break-all mt-1">
                <span className="text-gray-500 dark:text-gray-400">Повтор: </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {key.repeat(Math.ceil(text.length / key.length)).slice(0, text.length)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Каждая буква сдвигается на соответствующую цифру ключа (циклически).
            </div>
          </div>
        </div>
      </div>

      {showSteps && steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Пошаговое преобразование</h4>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1 p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded shadow-sm text-sm">
                <span className="text-gray-700 dark:text-gray-300">{step.char}</span>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">+{step.shift}</span>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{step.resultChar}</span>
                {idx < steps.length - 1 && <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает шифр Гронсфельда?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Аналогичен шифру Виженера, но ключ — цифры (0-9).</li>
          <li>Каждая буква сдвигается на цифру ключа.</li>
          <li>Ключ повторяется циклически до длины текста.</li>
          <li>Пример: ключ "31415" даёт сдвиги 3,1,4,1,5,3,1,4,...</li>
        </ul>
      </div>
    </div>
  );
};

export default GronsfeldCipher;