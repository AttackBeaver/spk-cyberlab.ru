import { useState, useRef, useEffect } from 'react';

// -------------------- Вспомогательные функции --------------------
function gcdWithSteps(a: number, b: number): { steps: [number, number, number, number][]; result: number } {
  const steps: [number, number, number, number][] = [];
  let x = a,
    y = b;
  while (y !== 0) {
    const q = Math.floor(x / y);
    const r = x % y;
    steps.push([x, y, q, r]);
    x = y;
    y = r;
  }
  return { steps, result: x };
}

function extendedGcdWithSteps(a: number, b: number): { steps: [number, number, number, number, number, number][]; result: { gcd: number; x: number; y: number } } {
  const steps: [number, number, number, number, number, number][] = [];
  let [oldR, r] = [a, b];
  let [oldS, s] = [1, 0];
  let [oldT, t] = [0, 1];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    const [newR, newS, newT] = [oldR - q * r, oldS - q * s, oldT - q * t];
    steps.push([oldR, r, q, newR, newS, newT]);
    [oldR, r] = [r, newR];
    [oldS, s] = [s, newS];
    [oldT, t] = [t, newT];
  }
  return { steps, result: { gcd: oldR, x: oldS, y: oldT } };
}

function isPrimeWithDivisors(n: number): { prime: boolean; divisors: number[] } {
  if (n < 2) return { prime: false, divisors: [] };
  const divisors: number[] = [];
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      divisors.push(i);
      if (i * i !== n) divisors.push(n / i);
    }
  }
  return { prime: divisors.length === 0, divisors };
}

function modPowWithSteps(base: number, exp: number, mod: number): { steps: { step: number; bit: number; result: number }[]; result: number } {
  let result = 1;
  let b = base % mod;
  let e = exp;
  const steps: { step: number; bit: number; result: number }[] = [];
  let stepNum = 0;
  while (e > 0) {
    const bit = e & 1;
    if (bit) result = (result * b) % mod;
    steps.push({ step: stepNum, bit, result: result });
    b = (b * b) % mod;
    e >>= 1;
    stepNum++;
  }
  return { steps, result };
}

function solveDiophantine(a: number, b: number, c: number): { x: number; y: number; gcd: number; hasSolution: boolean; steps: string[] } {
  const gcdVal = gcdWithSteps(a, b).result;
  if (c % gcdVal !== 0) {
    return { x: 0, y: 0, gcd: gcdVal, hasSolution: false, steps: ['Решений нет, т.к. c не делится на НОД'] };
  }
  const { result: ext } = extendedGcdWithSteps(a, b);
  const x0 = ext.x * (c / gcdVal);
  const y0 = ext.y * (c / gcdVal);
  return { x: x0, y: y0, gcd: gcdVal, hasSolution: true, steps: [`НОД(${a},${b}) = ${gcdVal}`, `Частное решение: x0 = ${x0}, y0 = ${y0}`] };
}

// -------------------- Компонент: НОД (Евклид) --------------------
const GcdTab = () => {
  const [a, setA] = useState(48);
  const [b, setB] = useState(18);
  const [steps, setSteps] = useState<[number, number, number, number][]>([]);
  const [result, setResult] = useState<number | null>(null);

  const compute = () => {
    const { steps, result } = gcdWithSteps(a, b);
    setSteps(steps);
    setResult(result);
  };

  return (
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">b</label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
      <button
        onClick={compute}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
      >
        Вычислить НОД
      </button>
      {result !== null && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center text-lg font-bold text-green-700 dark:text-green-300">
          НОД({a}, {b}) = {result}
        </div>
      )}
      {steps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border px-3 py-1 text-left">a</th>
                <th className="border px-3 py-1 text-left">b</th>
                <th className="border px-3 py-1 text-left">q</th>
                <th className="border px-3 py-1 text-left">r</th>
              </tr>
            </thead>
            <tbody>
              {steps.map(([aVal, bVal, q, r], idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border px-3 py-1 font-mono">{aVal}</td>
                  <td className="border px-3 py-1 font-mono">{bVal}</td>
                  <td className="border px-3 py-1 font-mono">{q}</td>
                  <td className={`border px-3 py-1 font-mono ${r === 0 ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------- Компонент: Решето Эратосфена --------------------
const PrimeTab = () => {
  const [n, setN] = useState(17);
  const [result, setResult] = useState<{ prime: boolean; divisors: number[] } | null>(null);
  const [sieveN, setSieveN] = useState(30);
  const [sieve, setSieve] = useState<boolean[]>([]);

  const checkPrime = () => {
    setResult(isPrimeWithDivisors(n));
  };

  const generateSieve = () => {
    const isPrime = new Array(sieveN + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let i = 2; i * i <= sieveN; i++) {
      if (isPrime[i]) {
        for (let j = i * i; j <= sieveN; j += i) {
          isPrime[j] = false;
        }
      }
    }
    setSieve(isPrime);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateSieve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sieveN]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Проверка числа на простоту</h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={checkPrime}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
          >
            Проверить
          </button>
        </div>
        {result !== null && (
          <div className={`p-3 rounded-lg text-center text-lg font-bold ${result.prime ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {result.prime ? '✅ Простое' : '❌ Составное'}
            {!result.prime && result.divisors.length > 0 && (
              <div className="text-sm font-normal mt-1">Делители: {result.divisors.sort((a, b) => a - b).join(', ')}</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Решето Эратосфена до {sieveN}</h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={sieveN}
            onChange={(e) => setSieveN(Number(e.target.value))}
            className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={generateSieve}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Обновить
          </button>
        </div>
        {sieve.length > 0 && (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {sieve.map((prime, idx) => (
              <div
                key={idx}
                className={`p-1 text-center text-sm rounded ${prime ? 'bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'}`}
              >
                {idx}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- Компонент: Расширенный Евклид --------------------
const ExtendedGcdTab = () => {
  const [a, setA] = useState(30);
  const [b, setB] = useState(20);
  const [steps, setSteps] = useState<[number, number, number, number, number, number][]>([]);
  const [result, setResult] = useState<{ gcd: number; x: number; y: number } | null>(null);

  const compute = () => {
    const { steps, result } = extendedGcdWithSteps(a, b);
    setSteps(steps);
    setResult(result);
  };

  return (
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">b</label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
      <button
        onClick={compute}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
      >
        Вычислить коэффициенты
      </button>
      {result && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center text-lg font-bold text-green-700 dark:text-green-300">
          НОД({a}, {b}) = {result.gcd} = {result.x}·{a} + {result.y}·{b}
        </div>
      )}
      {steps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border px-2 py-1">r<sub>i</sub></th>
                <th className="border px-2 py-1">r<sub>i+1</sub></th>
                <th className="border px-2 py-1">q</th>
                <th className="border px-2 py-1">r<sub>i+2</sub></th>
                <th className="border px-2 py-1">x</th>
                <th className="border px-2 py-1">y</th>
              </tr>
            </thead>
            <tbody>
              {steps.map(([oldR, r, q, newR, newS, newT], idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border px-2 py-1 font-mono">{oldR}</td>
                  <td className="border px-2 py-1 font-mono">{r}</td>
                  <td className="border px-2 py-1 font-mono">{q}</td>
                  <td className={`border px-2 py-1 font-mono ${newR === 0 ? 'text-green-600 dark:text-green-400 font-bold' : ''}`}>{newR}</td>
                  <td className="border px-2 py-1 font-mono">{newS}</td>
                  <td className="border px-2 py-1 font-mono">{newT}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------- Компонент: Быстрое возведение в степень по модулю --------------------
const ModPowTab = () => {
  const [base, setBase] = useState(5);
  const [exp, setExp] = useState(13);
  const [mod, setMod] = useState(23);
  const [steps, setSteps] = useState<{ step: number; bit: number; result: number }[]>([]);
  const [result, setResult] = useState<number | null>(null);

  const compute = () => {
    const { steps, result } = modPowWithSteps(base, exp, mod);
    setSteps(steps);
    setResult(result);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Основание</label>
          <input
            type="number"
            value={base}
            onChange={(e) => setBase(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Степень</label>
          <input
            type="number"
            value={exp}
            onChange={(e) => setExp(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Модуль</label>
          <input
            type="number"
            value={mod}
            onChange={(e) => setMod(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
      <button
        onClick={compute}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
      >
        Вычислить
      </button>
      {result !== null && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center text-lg font-bold text-green-700 dark:text-green-300">
          {base}^{exp} mod {mod} = {result}
        </div>
      )}
      {steps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border px-3 py-1">Шаг</th>
                <th className="border px-3 py-1">Бит</th>
                <th className="border px-3 py-1">Результат</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.step} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border px-3 py-1 font-mono">{s.step}</td>
                  <td className="border px-3 py-1 font-mono">{s.bit}</td>
                  <td className="border px-3 py-1 font-mono">{s.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------- Компонент: Диофантовы уравнения --------------------
const DiophantineTab = () => {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [c, setC] = useState(1);
  const [solution, setSolution] = useState<{ x: number; y: number; gcd: number; hasSolution: boolean; steps: string[] } | null>(null);

  const solve = () => {
    setSolution(solveDiophantine(a, b, c));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">b</label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
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
      <button
        onClick={solve}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
      >
        Решить уравнение {a}x + {b}y = {c}
      </button>
      {solution && (
        <div className="space-y-2">
          {solution.hasSolution ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-center text-lg font-bold text-green-700 dark:text-green-300">
                Решение: x = {solution.x}, y = {solution.y}
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {a}·{solution.x} + {b}·{solution.y} = {a * solution.x + b * solution.y} = {c} ✅
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center text-red-700 dark:text-red-300">
              ❌ Решений нет. НОД({a},{b}) = {solution.gcd} не делит {c}
            </div>
          )}
          {solution.steps.length > 0 && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
              <h4 className="font-medium">Шаги:</h4>
              <ul className="list-disc list-inside font-mono">
                {solution.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -------------------- Компонент: Эллиптические кривые (canvas) --------------------
const EllipticCurveTab = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [p, setP] = useState(17); // простое поле
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  const drawCurve = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Рисуем оси
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, height);
    ctx.moveTo(0, height - 40);
    ctx.lineTo(width, height - 40);
    ctx.stroke();

    // Масштаб: 1 единица = 20 пикселей, центр в (40, height-40)
    const scale = 20;
    const cx = 40;
    const cy = height - 40;

    // Рисуем кривую: y^2 = x^3 + a*x + b mod p (над полем, но для непрерывной визуализации рисуем реальную кривую)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -10; x <= 10; x += 0.05) {
      const x3 = x * x * x;
      const y2 = x3 + a * x + b;
      if (y2 < 0) continue;
      const y = Math.sqrt(y2);
      const px = cx + x * scale;
      const py = cy - y * scale;
      if (x === -10) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Находим точки на эллиптической кривой над полем F_p
    const pts: { x: number; y: number }[] = [];
    for (let x = 0; x < p; x++) {
      const rhs = (x * x * x + a * x + b) % p;
      // Ищем y: y^2 ≡ rhs (mod p)
      for (let y = 0; y < p; y++) {
        if ((y * y) % p === rhs) {
          pts.push({ x, y });
        }
      }
    }
    setPoints(pts);

    // Рисуем точки
    pts.forEach(pt => {
      const px = cx + pt.x * scale;
      const py = cy - pt.y * scale;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px monospace';
      ctx.fillText(`(${pt.x},${pt.y})`, px + 6, py - 4);
    });
  };

  useEffect(() => {
    drawCurve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, p]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">b</label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">p (поле)</label>
          <input
            type="number"
            value={p}
            onChange={(e) => setP(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
      <button
        onClick={drawCurve}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
      >
        Обновить кривую
      </button>
      <div className="flex justify-center">
        <canvas ref={canvasRef} width={600} height={400} className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
      </div>
      {points.length > 0 && (
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Точки на кривой над F<sub>{p}</sub>:</h4>
          <div className="flex flex-wrap gap-1 text-sm font-mono">
            {points.map((pt, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded">({pt.x},{pt.y})</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------- Основной компонент MathBasics --------------------
const MathBasics = () => {
  const [subTab, setSubTab] = useState<'gcd' | 'prime' | 'extgcd' | 'modpow' | 'diophantine' | 'elliptic'>('gcd');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Математические основы криптографии
        </h3>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
          {[
            { id: 'gcd', label: 'НОД (Евклид)' },
            { id: 'prime', label: 'Проверка простоты' },
            { id: 'extgcd', label: 'Расширенный Евклид' },
            { id: 'modpow', label: 'Возведение в степень' },
            { id: 'diophantine', label: 'Диофантовы уравнения' },
            { id: 'elliptic', label: 'Эллиптические кривые' },
          ].map((tab) => (
            <button
              key={tab.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === tab.id
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-2">
          {subTab === 'gcd' && <GcdTab />}
          {subTab === 'prime' && <PrimeTab />}
          {subTab === 'extgcd' && <ExtendedGcdTab />}
          {subTab === 'modpow' && <ModPowTab />}
          {subTab === 'diophantine' && <DiophantineTab />}
          {subTab === 'elliptic' && <EllipticCurveTab />}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Зачем это нужно?
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li><span className="font-medium">НОД</span> — основа для проверки взаимной простоты в RSA.</li>
          <li><span className="font-medium">Проверка простоты</span> — генерация простых чисел для RSA, Diffie-Hellman.</li>
          <li><span className="font-medium">Расширенный Евклид</span> — нахождение обратного элемента (закрытая экспонента в RSA).</li>
          <li><span className="font-medium">Быстрое возведение в степень</span> — основа всех модульных вычислений в криптографии.</li>
          <li><span className="font-medium">Диофантовы уравнения</span> — применяются в криптоанализе и теории чисел.</li>
          <li><span className="font-medium">Эллиптические кривые</span> — основа современной криптографии (ECC).</li>
        </ul>
      </div>
    </div>
  );
};

export default MathBasics;