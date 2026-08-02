import { useState, useRef, useEffect } from 'react';

// Линейный конгруэнтный генератор
class LCG {
  private seed: number;
  private a: number;
  private c: number;
  private m: number;

  constructor(a: number, c: number, m: number, seed: number) {
    this.a = a;
    this.c = c;
    this.m = m;
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  generateSequence(n: number): number[] {
    const seq: number[] = [];
    for (let i = 0; i < n; i++) {
      seq.push(this.next());
    }
    return seq;
  }
}

const PRNG = () => {
  const [a, setA] = useState(1664525);
  const [c, setC] = useState(1013904223);
  const [m, setM] = useState(2 ** 32);
  const [seed, setSeed] = useState(12345);
  const [count, setCount] = useState(100);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showNumbers, setShowNumbers] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = () => {
    const lcg = new LCG(a, c, m, seed);
    const seq = lcg.generateSequence(count);
    setSequence(seq);
    setShowNumbers(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sequence.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Нормализация в [0,1]
    const maxVal = Math.max(...sequence);
    const normalized = sequence.map(v => v / maxVal);

    // Оси
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('x_i', padding.left + chartW - 30, padding.top + chartH + 20);
    ctx.fillText('x_{i+1}', padding.left - 10, padding.top + 10);

    // Точки (x_i, x_{i+1})
    for (let i = 0; i < normalized.length - 1; i++) {
      const x = padding.left + normalized[i] * chartW;
      const y = padding.top + chartH - normalized[i + 1] * chartH;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Гистограмма (10 бинов)
    const bins = 10;
    const hist = new Array(bins).fill(0);
    for (const val of normalized) {
      const bin = Math.min(Math.floor(val * bins), bins - 1);
      hist[bin]++;
    }
    const maxCount = Math.max(...hist, 1);

    const histX = padding.left + chartW + 20;
    const histW = 60;
    const histH = chartH;
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(histX, padding.top, histW, histH);

    for (let i = 0; i < bins; i++) {
      const barH = (hist[i] / maxCount) * histH;
      const x = histX + (i / bins) * histW;
      const y = padding.top + histH - barH;
      const barW = histW / bins - 1;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x, y, barW, barH);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Распределение', histX, padding.top + histH + 20);

    // Статистика
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`n=${sequence.length}`, padding.left, padding.top - 5);
  }, [sequence]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Генератор псевдослучайных чисел (LCG)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">a</label>
                <input
                  type="number"
                  value={a}
                  onChange={(e) => setA(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">c</label>
                <input
                  type="number"
                  value={c}
                  onChange={(e) => setC(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">m</label>
                <input
                  type="number"
                  value={m}
                  onChange={(e) => setM(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Количество чисел</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <button
              onClick={generate}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              Сгенерировать
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Визуализация</h4>
            <canvas ref={canvasRef} width={500} height={300} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
            <div className="flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Точки: (x<sub>i</sub>, x<sub>i+1</sub>)</span>
              <span className="mx-1">•</span>
              <span>Гистограмма: распределение значений</span>
            </div>

            {/* Кнопка показа/скрытия чисел */}
            {sequence.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowNumbers(!showNumbers)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showNumbers ? 'Скрыть числа' : 'Показать числа'}
                </button>
              </div>
            )}

            {/* Список чисел */}
            {showNumbers && sequence.length > 0 && (
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                  {sequence.map((num, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">
                      {num}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Всего чисел: {sequence.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Как работает LCG?
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Линейный конгруэнтный генератор: X<sub>n+1</sub> = (a·X<sub>n</sub> + c) mod m.</li>
          <li>Качество последовательности зависит от выбора параметров.</li>
          <li>Точечный график показывает корреляцию между соседними числами.</li>
          <li>Гистограмма показывает равномерность распределения.</li>
          <li>Плохие параметры дают явные структуры (например, решётку).</li>
        </ul>
      </div>
    </div>
  );
};

export default PRNG;