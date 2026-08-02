import { useState } from 'react';

// Правильная карта Pigpen (26 букв)
const PIGPEN_MAP: Record<string, { x: number; y: number; dot: boolean; gridType: 'square' | 'cross' }> = {
  // Сетка 3x3 без точек (A-I)
  'A': { x: 0, y: 0, dot: false, gridType: 'square' },
  'B': { x: 1, y: 0, dot: false, gridType: 'square' },
  'C': { x: 2, y: 0, dot: false, gridType: 'square' },
  'D': { x: 0, y: 1, dot: false, gridType: 'square' },
  'E': { x: 1, y: 1, dot: false, gridType: 'square' },
  'F': { x: 2, y: 1, dot: false, gridType: 'square' },
  'G': { x: 0, y: 2, dot: false, gridType: 'square' },
  'H': { x: 1, y: 2, dot: false, gridType: 'square' },
  'I': { x: 2, y: 2, dot: false, gridType: 'square' },
  // Сетка 3x3 с точками (J-R)
  'J': { x: 0, y: 0, dot: true, gridType: 'square' },
  'K': { x: 1, y: 0, dot: true, gridType: 'square' },
  'L': { x: 2, y: 0, dot: true, gridType: 'square' },
  'M': { x: 0, y: 1, dot: true, gridType: 'square' },
  'N': { x: 1, y: 1, dot: true, gridType: 'square' },
  'O': { x: 2, y: 1, dot: true, gridType: 'square' },
  'P': { x: 0, y: 2, dot: true, gridType: 'square' },
  'Q': { x: 1, y: 2, dot: true, gridType: 'square' },
  'R': { x: 2, y: 2, dot: true, gridType: 'square' },
  // Крестовина без точек (S-V) - 4 сектора
  'S': { x: 0, y: 0, dot: false, gridType: 'cross' },
  'T': { x: 1, y: 0, dot: false, gridType: 'cross' },
  'U': { x: 0, y: 1, dot: false, gridType: 'cross' },
  'V': { x: 1, y: 1, dot: false, gridType: 'cross' },
  // Крестовина с точками (W-Z) - 4 сектора с точкой
  'W': { x: 0, y: 0, dot: true, gridType: 'cross' },
  'X': { x: 1, y: 0, dot: true, gridType: 'cross' },
  'Y': { x: 0, y: 1, dot: true, gridType: 'cross' },
  'Z': { x: 1, y: 1, dot: true, gridType: 'cross' },
};

// Генерация SVG для буквы
function getGlyphSVG(letter: string): string {
  const data = PIGPEN_MAP[letter];
  if (!data) return '';

  const { x, y, dot, gridType } = data;
  const size = 32;
  const padding = 3;
  const lineColor = 'currentColor';
  const fillColor = 'currentColor';

  if (gridType === 'square') {
    const cellSize = (size - 2 * padding) / 3;
    const cx = padding + x * cellSize + cellSize / 2;
    const cy = padding + y * cellSize + cellSize / 2;
    const r = 3;
    const x1 = padding + x * cellSize;
    const y1 = padding + y * cellSize;

    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    // Заливка выбранной ячейки (полупрозрачная)
    svg += `<rect x="${x1}" y="${y1}" width="${cellSize}" height="${cellSize}" fill="${fillColor}" opacity="0.25" />`;
    // Горизонтальные линии
    for (let i = 0; i <= 3; i++) {
      const yPos = padding + i * cellSize;
      svg += `<line x1="${padding}" y1="${yPos}" x2="${size - padding}" y2="${yPos}" stroke="${lineColor}" strokeWidth="1.2" />`;
    }
    // Вертикальные линии
    for (let i = 0; i <= 3; i++) {
      const xPos = padding + i * cellSize;
      svg += `<line x1="${xPos}" y1="${padding}" x2="${xPos}" y2="${size - padding}" stroke="${lineColor}" strokeWidth="1.2" />`;
    }
    // Жирная рамка вокруг выбранной ячейки
    svg += `<rect x="${x1}" y="${y1}" width="${cellSize}" height="${cellSize}" fill="none" stroke="${lineColor}" strokeWidth="2.5" />`;
    if (dot) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" />`;
    }
    svg += '</svg>';
    return svg;
  } else {
    // Крестовина с секторами
    const half = size / 2;
    // eslint-disable-next-line no-useless-assignment
    let points = '';
    if (x === 0 && y === 0) {
      points = `${padding},${padding} ${half},${padding} ${padding},${half}`;
    } else if (x === 1 && y === 0) {
      points = `${size-padding},${padding} ${half},${padding} ${size-padding},${half}`;
    } else if (x === 0 && y === 1) {
      points = `${padding},${size-padding} ${half},${size-padding} ${padding},${half}`;
    } else {
      points = `${size-padding},${size-padding} ${half},${size-padding} ${size-padding},${half}`;
    }

    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<polygon points="${points}" fill="${fillColor}" opacity="0.3" />`;
    svg += `<line x1="${padding}" y1="${padding}" x2="${size - padding}" y2="${size - padding}" stroke="${lineColor}" strokeWidth="1.5" />`;
    svg += `<line x1="${size - padding}" y1="${padding}" x2="${padding}" y2="${size - padding}" stroke="${lineColor}" strokeWidth="1.5" />`;
    if (dot) {
      svg += `<circle cx="${half}" cy="${half}" r="3" fill="${fillColor}" />`;
    }
    svg += '</svg>';
    return svg;
  }
}

function encryptMasonic(text: string): { glyphs: string[]; steps: { letter: string; glyph: string }[] } {
  const upper = text.toUpperCase();
  const glyphs: string[] = [];
  const steps: { letter: string; glyph: string }[] = [];
  for (const char of upper) {
    if (char >= 'A' && char <= 'Z') {
      const svg = getGlyphSVG(char);
      if (svg) {
        glyphs.push(svg);
        steps.push({ letter: char, glyph: svg });
      }
    } else if (char === ' ') {
      glyphs.push('<span style="width:32px;display:inline-block;">&nbsp;</span>');
      steps.push({ letter: ' ', glyph: ' ' });
    } else {
      glyphs.push(`<span class="text-gray-400 dark:text-gray-500 text-sm">${char}</span>`);
      steps.push({ letter: char, glyph: char });
    }
  }
  return { glyphs, steps };
}

// Компонент таблицы символов
const GlyphTable = () => {
  const renderGlyph = (letter: string) => {
    const svg = getGlyphSVG(letter);
    return <div dangerouslySetInnerHTML={{ __html: svg }} className="inline-block text-blue-600 dark:text-blue-300" />;
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Таблица символов Pigpen</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Сетка 3×3 (без точек) — A-I</div>
          <div className="grid grid-cols-3 gap-1 max-w-[110px]">
            {['A','B','C','D','E','F','G','H','I'].map(letter => (
              <div key={letter} className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center text-xs font-mono">
                {renderGlyph(letter)}
                <div className="text-[8px] text-gray-400 dark:text-gray-500">{letter}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Сетка 3×3 (с точками) — J-R</div>
          <div className="grid grid-cols-3 gap-1 max-w-[110px]">
            {['J','K','L','M','N','O','P','Q','R'].map(letter => (
              <div key={letter} className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center text-xs font-mono">
                {renderGlyph(letter)}
                <div className="text-[8px] text-gray-400 dark:text-gray-500">{letter}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Крестовина (без точек) — S-V</div>
          <div className="grid grid-cols-2 gap-1 max-w-[75px]">
            {['S','T','U','V'].map(letter => (
              <div key={letter} className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center text-xs font-mono">
                {renderGlyph(letter)}
                <div className="text-[8px] text-gray-400 dark:text-gray-500">{letter}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Крестовина (с точками) — W-Z</div>
          <div className="grid grid-cols-2 gap-1 max-w-[75px]">
            {['W','X','Y','Z'].map(letter => (
              <div key={letter} className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center text-xs font-mono">
                {renderGlyph(letter)}
                <div className="text-[8px] text-gray-400 dark:text-gray-500">{letter}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Основной компонент
const MasonicCipher = () => {
  const [text, setText] = useState('HELLO WORLD');
  const [resultGlyphs, setResultGlyphs] = useState<string[]>([]);
  const [steps, setSteps] = useState<{ letter: string; glyph: string }[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleAction = () => {
    const { glyphs, steps } = encryptMasonic(text);
    setResultGlyphs(glyphs);
    setSteps(steps);
    setResultText('');
    setShowSteps(true);
  };

  const clearAll = () => {
    setResultGlyphs([]);
    setSteps([]);
    setShowSteps(false);
    setResultText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифр масонов (Pigpen Cipher) — визуализация
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Режим</label>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm"
                >
                  Шифрование
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текст для шифрования</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                placeholder="Введите текст (A-Z)"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAction}
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
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-[48px] flex flex-wrap items-center gap-1">
                {resultGlyphs.length > 0 ? (
                  resultGlyphs.map((svg, idx) => (
                    <span key={idx} dangerouslySetInnerHTML={{ __html: svg }} className="inline-block text-blue-600 dark:text-blue-300" />
                  ))
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">{resultText || '—'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <GlyphTable />
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Каждая буква заменяется символом: ячейка сетки (с точкой или без) или сектор крестовины.
            </div>
          </div>
        </div>
      </div>

      {showSteps && steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Пошаговое преобразование</h4>
          <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded shadow-sm text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-300">{step.letter}</span>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span dangerouslySetInnerHTML={{ __html: step.glyph }} className="inline-block text-blue-600 dark:text-blue-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает шифр масонов?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Каждая буква заменяется на символ, состоящий из фрагмента сетки 3×3 или крестовины.</li>
          <li>Точка внутри символа означает, что буква находится во второй половине алфавита.</li>
          <li>Для крестовины используются 4 сектора, каждый сектор соответствует своей букве.</li>
          <li>Использовался масонами для тайной переписки в XVIII веке.</li>
          <li>Простой шифр подстановки, уязвим для частотного анализа.</li>
        </ul>
      </div>
    </div>
  );
};

export default MasonicCipher;