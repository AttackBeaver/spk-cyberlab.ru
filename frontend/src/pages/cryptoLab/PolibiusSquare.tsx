import { useState, useEffect } from 'react';

// Русский алфавит (без Ё) + цифры 0-5 для 6x6
const RUSSIAN_ALPHABET = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const DIGITS = '012345';
const DEFAULT_ALPHABET = RUSSIAN_ALPHABET + DIGITS; // 36 символов

type Mode = 'encrypt' | 'decrypt';

const PolybiusSquare = () => {
  const [alphabet] = useState(DEFAULT_ALPHABET);
  const [mode, setMode] = useState<Mode>('encrypt');
  const [inputText, setInputText] = useState('ПРИВЕТМИР');
  const [outputText, setOutputText] = useState('');
  const [steps, setSteps] = useState<{ char: string; coords: [number, number] }[]>([]);
  const [highlightedCell, setHighlightedCell] = useState<[number, number] | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [size] = useState(6);
  const [table, setTable] = useState<string[][]>([]);

  // Построение таблицы
  useEffect(() => {
    const chars = alphabet.split('');
    const newTable: string[][] = [];
    for (let i = 0; i < size; i++) {
      const row: string[] = [];
      for (let j = 0; j < size; j++) {
        const idx = i * size + j;
        row.push(idx < chars.length ? chars[idx] : '');
      }
      newTable.push(row);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTable(newTable);
  }, [alphabet, size]);

  // Поиск координат символа в таблице
  const findCoords = (char: string): [number, number] | null => {
    const upper = char.toUpperCase();
    for (let i = 0; i < table.length; i++) {
      for (let j = 0; j < table[i].length; j++) {
        if (table[i][j] === upper) {
          return [i, j];
        }
      }
    }
    return null;
  };

  // Шифрование: буква -> координаты (строка, столбец)
  const encrypt = () => {
    const chars = inputText.toUpperCase().split('');
    const result: string[] = [];
    const stepData: { char: string; coords: [number, number] }[] = [];
    for (const ch of chars) {
      if (ch === ' ' || ch === 'Ё') continue; // пропускаем пробелы и Ё
      const coords = findCoords(ch);
      if (coords) {
        // Используем формат "строкастолбец" (например, 11, 12, ...)
        // Для читаемости используем пары чисел через пробел
        result.push(`${coords[0]+1}${coords[1]+1}`);
        stepData.push({ char: ch, coords: [coords[0]+1, coords[1]+1] });
      }
    }
    setOutputText(result.join(' '));
    setSteps(stepData);
    setHighlightedCell(null);
  };

  // Дешифрование: координаты -> буква
  const decrypt = () => {
    // Ожидаем ввод в виде пар чисел, разделённых пробелами
    const tokens = inputText.trim().split(/\s+/);
    const result: string[] = [];
    const stepData: { char: string; coords: [number, number] }[] = [];
    for (const token of tokens) {
      if (token.length < 2) continue;
      const row = parseInt(token[0]) - 1;
      const col = parseInt(token[1]) - 1;
      if (row >= 0 && row < size && col >= 0 && col < size && table[row] && table[row][col]) {
        const char = table[row][col];
        result.push(char);
        stepData.push({ char, coords: [row+1, col+1] });
      }
    }
    setOutputText(result.join(''));
    setSteps(stepData);
    setHighlightedCell(null);
  };

  const handleAction = () => {
    if (mode === 'encrypt') encrypt();
    else decrypt();
    setShowSteps(true);
  };

  const clearAll = () => {
    setOutputText('');
    setSteps([]);
    setHighlightedCell(null);
    setShowSteps(false);
  };

  // Отрисовка таблицы с подсветкой
  const renderTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 p-1 bg-gray-100 dark:bg-gray-700"></th>
              {Array.from({ length: size }, (_, i) => (
                <th key={i} className="border border-gray-300 dark:border-gray-600 p-1 bg-gray-100 dark:bg-gray-700 text-xs">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={i}>
                <th className="border border-gray-300 dark:border-gray-600 p-1 bg-gray-100 dark:bg-gray-700 text-xs">
                  {i + 1}
                </th>
                {row.map((cell, j) => {
                  const isHighlighted = highlightedCell && highlightedCell[0] === i && highlightedCell[1] === j;
                  return (
                    <td
                      key={j}
                      className={`border border-gray-300 dark:border-gray-600 p-1 text-center font-mono text-sm transition-colors duration-200 ${
                        cell ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600'
                      } ${isHighlighted ? 'bg-amber-200 dark:bg-amber-700 scale-110 shadow-lg' : 'bg-white dark:bg-gray-800'}`}
                    >
                      {cell || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Пошаговая визуализация
  const renderSteps = () => {
    if (!showSteps || steps.length === 0) return null;
    return (
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пошаговое преобразование:</h4>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 p-1.5 bg-white dark:bg-gray-800 rounded shadow-sm text-sm"
              onMouseEnter={() => setHighlightedCell([step.coords[0]-1, step.coords[1]-1])}
              onMouseLeave={() => setHighlightedCell(null)}
            >
              <span className="font-bold text-gray-800 dark:text-gray-200">{step.char}</span>
              <span className="text-gray-400 dark:text-gray-500">→</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {step.coords[0]}{step.coords[1]}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Наведите на блок, чтобы подсветить ячейку в таблице</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Полибианский квадрат
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка: управление */}
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
                {mode === 'encrypt' ? 'Исходный текст (русские буквы)' : 'Координаты (например: 11 12 13)'}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                placeholder={mode === 'encrypt' ? 'Введите текст на русском' : 'Введите пары чисел через пробел'}
              />
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
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-[48px] font-mono text-lg break-all text-gray-900 dark:text-gray-100">
                {outputText || '—'}
              </div>
            </div>
          </div>

          {/* Правая колонка: таблица */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Таблица Полибия (6x6)</h4>
            {renderTable()}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Строки и столбцы нумеруются от 1 до 6. Координаты записываются как пара чисел.
            </div>
          </div>
        </div>
      </div>

      {/* Пошаговая визуализация */}
      {renderSteps()}

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает Полибианский квадрат?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Каждая буква заменяется парой координат (строка, столбец) в таблице.</li>
          <li>Для русского алфавита используется квадрат 6x6 (33 буквы + цифры).</li>
          <li>Шифрование: буква → координаты. Дешифрование: координаты → буква.</li>
          <li>Наведите на шаг преобразования, чтобы подсветить соответствующую ячейку.</li>
        </ul>
      </div>
    </div>
  );
};

export default PolybiusSquare;