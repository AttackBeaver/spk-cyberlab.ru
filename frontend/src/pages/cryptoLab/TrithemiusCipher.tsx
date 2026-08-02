import { useState, useMemo } from 'react';

const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

const trithemiusEncrypt = (text: string, shiftStart: number, shiftStep: number): { result: string; steps: { char: string; shift: number; encrypted: string }[] } => {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; shift: number; encrypted: string }[] = [];
  let currentShift = shiftStart;
  for (const char of upper) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, shift: currentShift, encrypted: char });
      continue;
    }
    const newIndex = (index + currentShift) % alphabet.length;
    const encryptedChar = alphabet[newIndex];
    result += encryptedChar;
    steps.push({ char, shift: currentShift, encrypted: encryptedChar });
    currentShift += shiftStep;
  }
  return { result, steps };
};

const trithemiusDecrypt = (text: string, shiftStart: number, shiftStep: number): { result: string; steps: { char: string; shift: number; decrypted: string }[] } => {
  const upper = text.toUpperCase();
  let result = '';
  const steps: { char: string; shift: number; decrypted: string }[] = [];
  let currentShift = shiftStart;
  for (const char of upper) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      result += char;
      steps.push({ char, shift: currentShift, decrypted: char });
      continue;
    }
    let newIndex = (index - currentShift) % alphabet.length;
    if (newIndex < 0) newIndex += alphabet.length;
    const decryptedChar = alphabet[newIndex];
    result += decryptedChar;
    steps.push({ char, shift: currentShift, decrypted: decryptedChar });
    currentShift += shiftStep;
  }
  return { result, steps };
};

const TrithemiusCipher = () => {
  const [text, setText] = useState('ПРИВЕТМИР');
  const [shiftStart, setShiftStart] = useState(1);
  const [shiftStep, setShiftStep] = useState(1);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState<{ char: string; shift: number; resultChar: string }[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const handleAction = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: { result: string; steps: any[] };
    if (mode === 'encrypt') {
      output = trithemiusEncrypt(text, shiftStart, shiftStep);
      setResult(output.result);
      setSteps(output.steps.map(s => ({ char: s.char, shift: s.shift, resultChar: s.encrypted })));
    } else {
      output = trithemiusDecrypt(text, shiftStart, shiftStep);
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

  // Генерация таблицы сдвигов для визуализации
  const shiftTable = useMemo(() => {
    const table: { shift: number; letters: string[] }[] = [];
    for (let s = 0; s < alphabet.length; s++) {
      const shifted = alphabet.slice(s) + alphabet.slice(0, s);
      table.push({ shift: s, letters: shifted.split('') });
    }
    return table;
  }, []);

  // Подсветка используемых сдвигов
  const usedShifts = useMemo(() => {
    const set = new Set<number>();
    steps.forEach(step => set.add(step.shift % alphabet.length));
    return set;
  }, [steps]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр Трисимуса (Тритемия)
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Текст
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Введите текст на русском"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Начальный сдвиг</label>
                <input
                  type="number"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Шаг сдвига</label>
                <input
                  type="number"
                  value={shiftStep}
                  onChange={(e) => setShiftStep(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Таблица сдвигов</h4>
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <th className="border px-1 py-0.5 text-left">Сдвиг</th>
                    {alphabet.split('').slice(0, 10).map((ch, i) => (
                      <th key={i} className="border px-1 py-0.5 text-center">{ch}</th>
                    ))}
                    <th className="border px-1 py-0.5 text-center">...</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftTable.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className={usedShifts.has(row.shift) ? 'bg-amber-50 dark:bg-amber-900/20' : ''}>
                      <td className="border px-1 py-0.5 font-mono text-center">{row.shift}</td>
                      {row.letters.slice(0, 10).map((ch, i) => (
                        <td key={i} className="border px-1 py-0.5 text-center font-mono">{ch}</td>
                      ))}
                      <td className="border px-1 py-0.5 text-center">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Выделены строки с используемыми сдвигами.
            </div>
          </div>
        </div>
      </div>

      {/* Пошаговая визуализация */}
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
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Каждый символ сдвигается на величину, увеличивающуюся с каждым шагом.
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает шифр Трисимуса?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Каждая буква сдвигается на величину, которая увеличивается с каждым шагом.</li>
          <li>Начальный сдвиг и шаг задаются пользователем.</li>
          <li>Например, если начальный сдвиг 1 и шаг 1, то сдвиги будут: 1, 2, 3, ...</li>
          <li>Это усложняет частотный анализ по сравнению с обычным шифром Цезаря.</li>
        </ul>
      </div>
    </div>
  );
};

export default TrithemiusCipher;