import { useState, useMemo, useEffect } from 'react';

// -------------------- Вспомогательные функции --------------------
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function modInverse(a: number, m: number): number {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1, 0];
  let [oldT, t] = [0, 1];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  if (oldR !== 1) return -1;
  return ((oldS % m) + m) % m;
}

function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return result;
}

function generatePrime(min: number, max: number): number {
  let num = Math.floor(Math.random() * (max - min + 1)) + min;
  while (!isPrime(num)) {
    num = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return num;
}

// -------------------- Компонент визуализации шагов --------------------
const StepIndicator = ({ steps, currentStep }: { steps: string[]; currentStep: number }) => {
  return (
    <div className="relative flex flex-wrap items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      {steps.map((label, idx) => {
        const isActive = idx <= currentStep;
        const isCurrent = idx === currentStep;
        return (
          <div key={idx} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              } ${isCurrent ? 'ring-2 ring-amber-300 dark:ring-amber-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
            >
              {idx + 1}
            </div>
            <div className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {label}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-all ${
                  idx < currentStep ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// -------------------- Основной компонент --------------------
const RSAVisualizer = () => {
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [message, setMessage] = useState(42);
  const [encrypted, setEncrypted] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<number | null>(null);
  const [, setCurrentStep] = useState(-1);

  // Вычисляем ключи
  const keys = useMemo(() => {
    if (!isPrime(p) || !isPrime(q)) {
      return { n: 0, phi: 0, e: 0, d: 0, valid: false };
    }
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    let e = 17;
    while (gcd(e, phi) !== 1) e += 2;
    const d = modInverse(e, phi);
    return { n, phi, e, d, valid: d !== -1 };
  }, [p, q]);

  const stepsLabels = ['Выбор p, q', 'n, φ(n)', 'Выбор e', 'Вычисление d', 'Шифрование', 'Дешифрование'];

  // При изменении параметров сбрасываем состояние
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEncrypted(null);
    setDecrypted(null);
    setCurrentStep(-1);
  }, [p, q, message]);

  const handleEncrypt = () => {
    if (!keys.valid) {
      setCurrentStep(-1);
      return;
    }
    const { n, e } = keys;
    if (message >= n) {
      setCurrentStep(-1);
      return;
    }
    const encryptedMsg = modPow(message, e, n);
    setEncrypted(encryptedMsg);
    setCurrentStep(4); // шаг шифрования
    setDecrypted(null);
  };

  const handleDecrypt = () => {
    if (encrypted === null || !keys.valid) return;
    const { n, d } = keys;
    const decryptedMsg = modPow(encrypted, d, n);
    setDecrypted(decryptedMsg);
    setCurrentStep(5); // шаг дешифрования
  };

  const generateRandomPrimes = () => {
    const newP = generatePrime(10, 100);
    const newQ = generatePrime(10, 100);
    setP(newP);
    setQ(newQ);
    setEncrypted(null);
    setDecrypted(null);
    setCurrentStep(-1);
  };

  // Определяем, какие шаги уже выполнены
  const getCompletedSteps = () => {
    const completed: number[] = [];
    if (keys.valid) {
      completed.push(0); // p,q выбраны
      completed.push(1); // n, φ вычислены
      completed.push(2); // e выбран
      if (keys.d !== -1) completed.push(3); // d вычислен
      if (encrypted !== null) completed.push(4); // зашифровано
      if (decrypted !== null) completed.push(5); // расшифровано
    }
    return completed;
  };

  const completedSteps = getCompletedSteps();
  const lastCompleted = completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : -1;

  return (
    <div className="space-y-6">
      {/* Основной блок */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          RSA
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка: управление */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  p (простое)
                </label>
                <input
                  type="number"
                  value={p}
                  onChange={(e) => setP(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  q (простое)
                </label>
                <input
                  type="number"
                  value={q}
                  onChange={(e) => setQ(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сообщение (число &lt; n)
              </label>
              <input
                type="number"
                value={message}
                onChange={(e) => setMessage(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                disabled={!keys.valid || message >= keys.n}
              >
                Зашифровать
              </button>
              <button
                onClick={handleDecrypt}
                disabled={encrypted === null}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                Расшифровать
              </button>
              <button
                onClick={generateRandomPrimes}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные p, q
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-mono text-gray-800 dark:text-gray-200 space-y-1">
                <div><span className="text-gray-500 dark:text-gray-400">n = </span>{keys.n || '—'}</div>
                <div><span className="text-gray-500 dark:text-gray-400">φ(n) = </span>{keys.phi || '—'}</div>
                <div><span className="text-gray-500 dark:text-gray-400">e = </span>{keys.e || '—'}</div>
                <div><span className="text-gray-500 dark:text-gray-400">d = </span>{keys.d !== -1 ? keys.d : '—'}</div>
              </div>
              {!keys.valid && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-1">
                  ⚠️ p или q не простые
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка: результаты */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Зашифрованное сообщение
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg text-center text-gray-900 dark:text-gray-100 min-h-[48px]">
                {encrypted !== null ? encrypted : '—'}
              </div>
            </div>

            {decrypted !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Расшифрованное сообщение
                </label>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg font-mono text-lg text-center text-green-700 dark:text-green-300">
                  {decrypted}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Блок-схема шагов */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Пошаговый процесс
        </h4>
        <StepIndicator steps={stepsLabels} currentStep={lastCompleted} />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className={`p-3 rounded-lg border ${lastCompleted >= 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">1. Выбор p, q</div>
            <div className="text-gray-600 dark:text-gray-400">p = {p}, q = {q} {isPrime(p) && isPrime(q) ? '✅' : '❌'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${lastCompleted >= 1 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">2. Вычисление n, φ</div>
            <div className="text-gray-600 dark:text-gray-400">n = {keys.n || '—'}, φ = {keys.phi || '—'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${lastCompleted >= 2 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">3. Выбор e</div>
            <div className="text-gray-600 dark:text-gray-400">e = {keys.e || '—'} (взаимно простое с φ)</div>
          </div>
          <div className={`p-3 rounded-lg border ${lastCompleted >= 3 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">4. Вычисление d</div>
            <div className="text-gray-600 dark:text-gray-400">d = {keys.d !== -1 ? keys.d : '—'} (обратное к e)</div>
          </div>
          <div className={`p-3 rounded-lg border ${lastCompleted >= 4 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">5. Шифрование</div>
            <div className="text-gray-600 dark:text-gray-400">c = {encrypted !== null ? encrypted : '—'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${lastCompleted >= 5 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">6. Дешифрование</div>
            <div className="text-gray-600 dark:text-gray-400">m = {decrypted !== null ? decrypted : '—'}</div>
          </div>
        </div>
      </div>

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Как работает RSA?
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Асимметричный алгоритм: открытый ключ (e, n) и закрытый (d, n).</li>
          <li>Безопасность основана на сложности факторизации n.</li>
          <li>Шифрование: c = m<sup>e</sup> mod n; дешифрование: m = c<sup>d</sup> mod n.</li>
          <li>Используются маленькие числа для наглядности.</li>
        </ul>
      </div>
    </div>
  );
};

export default RSAVisualizer;