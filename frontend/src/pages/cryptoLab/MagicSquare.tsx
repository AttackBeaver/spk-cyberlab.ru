import { useState, useEffect } from 'react';

// -------------------- Построение магического квадрата (Сиамский метод для нечётных n) --------------------
function generateMagicSquare(n: number): { square: number[][]; steps: { row: number; col: number; value: number }[] } {
  if (n % 2 === 0) {
    throw new Error('Магический квадрат строится только для нечётных n');
  }
  const square: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const steps: { row: number; col: number; value: number }[] = [];

  let row = 0;
  let col = Math.floor(n / 2);
  for (let num = 1; num <= n * n; num++) {
    square[row][col] = num;
    steps.push({ row, col, value: num });
    const nextRow = (row - 1 + n) % n;
    const nextCol = (col + 1) % n;
    if (square[nextRow][nextCol] !== 0) {
      row = (row + 1) % n;
    } else {
      row = nextRow;
      col = nextCol;
    }
  }
  return { square, steps };
}

// -------------------- Шифрование/дешифрование с использованием магического квадрата (перестановка) --------------------
function encryptMagic(text: string, square: number[][]): { encrypted: string; steps: { char: string; pos: [number, number]; row: number; col: number }[] } {
  const n = square.length;
  const chars = text.split('');
  const steps: { char: string; pos: [number, number]; row: number; col: number }[] = [];
  // Заполняем квадрат по порядку (по строкам)
  const flat: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      flat.push(idx < chars.length ? chars[idx] : ' ');
    }
  }
  // Читаем по порядку чисел (магический порядок)
  const result: string[] = [];
  const positions: { row: number; col: number; value: number }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push({ row: r, col: c, value: square[r][c] });
    }
  }
  positions.sort((a, b) => a.value - b.value);
  for (const pos of positions) {
    const idx = pos.row * n + pos.col;
    const ch = flat[idx] || ' ';
    result.push(ch);
    steps.push({ char: ch, pos: [pos.row, pos.col], row: pos.row, col: pos.col });
  }
  return { encrypted: result.join(''), steps };
}

function decryptMagic(encrypted: string, square: number[][]): { decrypted: string; steps: { char: string; pos: [number, number]; row: number; col: number }[] } {
  const n = square.length;
  const chars = encrypted.split('');
  // Заполняем квадрат в магическом порядке
  const flat: string[] = [];
  const positions: { row: number; col: number; value: number }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push({ row: r, col: c, value: square[r][c] });
    }
  }
  positions.sort((a, b) => a.value - b.value);
  for (let i = 0; i < positions.length; i++) {
    flat.push(i < chars.length ? chars[i] : ' ');
  }
  // Читаем по строкам
  const result: string[] = [];
  const steps: { char: string; pos: [number, number]; row: number; col: number }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      const ch = flat[idx] || ' ';
      result.push(ch);
      steps.push({ char: ch, pos: [r, c], row: r, col: c });
    }
  }
  return { decrypted: result.join(''), steps };
}

// -------------------- Компонент --------------------
const MagicSquare = () => {
  const [n, setN] = useState(5);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [inputText, setInputText] = useState('HELLO MAGIC SQUARE');
  const [outputText, setOutputText] = useState('');
  const [square, setSquare] = useState<number[][]>([]);
  const [steps, setSteps] = useState<{ char: string; pos: [number, number]; row: number; col: number }[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [highlightedCell, setHighlightedCell] = useState<[number, number] | null>(null);
  const [buildSteps, setBuildSteps] = useState<{ row: number; col: number; value: number }[]>([]);
  const [currentBuildStep, setCurrentBuildStep] = useState(-1);
  const [isBuilding, setIsBuilding] = useState(false);

  // Генерация магического квадрата
  const generateSquare = () => {
    try {
      const { square, steps } = generateMagicSquare(n);
      setSquare(square);
      setBuildSteps(steps);
      setCurrentBuildStep(-1);
      setIsBuilding(false);
      setOutputText('');
      setSteps([]);
      setShowSteps(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Пошаговое построение квадрата
  const startBuildAnimation = () => {
    if (square.length === 0) {
      generateSquare();
    }
    setIsBuilding(true);
    setCurrentBuildStep(0);
  };

  useEffect(() => {
    if (isBuilding && currentBuildStep < buildSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentBuildStep(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    } else if (isBuilding && currentBuildStep >= buildSteps.length - 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBuilding(false);
    }
  }, [currentBuildStep, buildSteps, isBuilding]);

  // Шифрование/дешифрование
  const handleAction = () => {
    if (square.length === 0) {
      alert('Сначала сгенерируйте магический квадрат');
      return;
    }
    if (mode === 'encrypt') {
      const { encrypted, steps } = encryptMagic(inputText, square);
      setOutputText(encrypted);
      setSteps(steps);
    } else {
      const { decrypted, steps } = decryptMagic(inputText, square);
      setOutputText(decrypted);
      setSteps(steps);
    }
    setShowSteps(true);
  };

  const clearAll = () => {
    setOutputText('');
    setSteps([]);
    setShowSteps(false);
    setHighlightedCell(null);
  };

  // Рендер квадрата
  const renderSquare = () => {
    if (square.length === 0) return <div className="text-gray-400 dark:text-gray-500">Сгенерируйте квадрат</div>;
    return (
      <div className="inline-block border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <table className="border-collapse">
          <tbody>
            {square.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const isHighlighted = highlightedCell && highlightedCell[0] === i && highlightedCell[1] === j;
                  const isBuildingHighlight = isBuilding && buildSteps[currentBuildStep]?.row === i && buildSteps[currentBuildStep]?.col === j;
                  const value = (isBuilding && currentBuildStep >= 0) ? buildSteps[currentBuildStep]?.value : cell;
                  const isBuilt = cell !== 0;
                  return (
                    <td
                      key={j}
                      className={`w-10 h-10 text-center border border-gray-200 dark:border-gray-700 text-sm font-mono transition-all duration-200 ${
                        isHighlighted || isBuildingHighlight
                          ? 'bg-amber-200 dark:bg-amber-700 text-gray-900 dark:text-gray-100 scale-110 shadow-lg'
                          : isBuilt
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200'
                          : 'bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      {isBuilt ? value : ''}
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

  // Пошаговая визуализация шифрования
  const renderSteps = () => {
    if (!showSteps || steps.length === 0) return null;
    return (
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пошаговое преобразование:</h4>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 p-1.5 bg-white dark:bg-gray-800 rounded shadow-sm text-sm cursor-pointer"
              onMouseEnter={() => step.pos && setHighlightedCell(step.pos)}
              onMouseLeave={() => setHighlightedCell(null)}
            >
              <span className="text-gray-700 dark:text-gray-300">{step.char}</span>
              {step.pos && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">({step.pos[0]+1},{step.pos[1]+1})</span>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Наведите на блок, чтобы подсветить ячейку</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Магический квадрат — визуализация и шифр перестановки
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Размер (нечётное число)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="3"
                  max="9"
                  step="2"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                  className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={generateSquare}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Сгенерировать
                </button>
                <button
                  onClick={startBuildAnimation}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                >
                  Анимация
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Режим</label>
              <div className="flex gap-2">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {mode === 'encrypt' ? 'Текст для шифрования' : 'Текст для дешифрования'}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Введите текст"
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
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg break-all text-gray-900 dark:text-gray-100 min-h-[48px]">
                {outputText || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Магический квадрат {n}×{n}</h4>
            {renderSquare()}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {isBuilding ? `Построение: шаг ${currentBuildStep+1}/${buildSteps.length}` : square.length > 0 ? `Магическая сумма: ${n*(n*n+1)/2}` : ''}
            </div>
          </div>
        </div>
      </div>

      {renderSteps()}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Что такое магический квадрат?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Квадратная таблица, заполненная числами 1…n² так, что суммы в строках, столбцах и диагоналях равны.</li>
          <li>Используется как шифр перестановки: текст записывается по одному порядку, читается по другому.</li>
          <li>Сиамский метод (для нечётных n) — пошаговое заполнение: двигаемся вверх-вправо, при конфликте — вниз.</li>
          <li>Магическая сумма вычисляется по формуле: n*(n²+1)/2.</li>
        </ul>
      </div>
    </div>
  );
};

export default MagicSquare;