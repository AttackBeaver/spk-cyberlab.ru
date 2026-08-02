import { useState, useMemo, useEffect } from 'react';

// -------------------- Вспомогательные функции --------------------
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let num = n;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) {
      factors.push(i);
      while (num % i === 0) num /= i;
    }
  }
  if (num > 1) factors.push(num);
  return factors;
}

function isPrimitiveRoot(g: number, p: number): boolean {
  if (g % p === 0) return false;
  const factors = primeFactors(p - 1);
  for (const factor of factors) {
    if (modPow(g, (p - 1) / factor, p) === 1) {
      return false;
    }
  }
  return true;
}

function findPrimitiveRoot(p: number): number {
  if (!isPrime(p)) return -1;
  for (let g = 2; g < p; g++) {
    if (isPrimitiveRoot(g, p)) return g;
  }
  return -1;
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePrime(min: number, max: number): number {
  let num = randomInt(min, max);
  while (!isPrime(num)) {
    num = randomInt(min, max);
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

// -------------------- Основной компонент Diffie-Hellman --------------------
const DiffieHellman = () => {
  const [p, setP] = useState(23);
  const [g, setG] = useState(5);
  const [privateA, setPrivateA] = useState(6);
  const [privateB, setPrivateB] = useState(15);
  const [publicA, setPublicA] = useState<number | null>(null);
  const [publicB, setPublicB] = useState<number | null>(null);
  const [secretA, setSecretA] = useState<number | null>(null);
  const [secretB, setSecretB] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);

  const stepsLabels = ['Выбор p, g', 'Выбор приватных ключей', 'Вычисление публичных ключей', 'Обмен ключами', 'Вычисление общего секрета'];

  const generateRandomParams = () => {
    const newP = generatePrime(10, 100);
    const root = findPrimitiveRoot(newP);
    if (root !== -1) {
      setP(newP);
      setG(root);
    } else {
      generateRandomParams();
      return;
    }
    resetAll();
  };

  const generateRandomPrivateKeys = () => {
    if (p < 3) return;
    const a = randomInt(2, p - 2);
    const b = randomInt(2, p - 2);
    setPrivateA(a);
    setPrivateB(b);
    setPublicA(null);
    setPublicB(null);
    setSecretA(null);
    setSecretB(null);
    setCurrentStep(-1);
  };

  const resetAll = () => {
    setPublicA(null);
    setPublicB(null);
    setSecretA(null);
    setSecretB(null);
    setCurrentStep(-1);
  };

  const computePublicKeys = () => {
    if (!isPrime(p) || g <= 0 || g >= p) {
      alert('p должно быть простым, а g — числом от 2 до p-1');
      return;
    }
    if (privateA < 2 || privateA >= p || privateB < 2 || privateB >= p) {
      alert('Приватные ключи должны быть в диапазоне [2, p-1]');
      return;
    }
    const pubA = modPow(g, privateA, p);
    const pubB = modPow(g, privateB, p);
    setPublicA(pubA);
    setPublicB(pubB);
    setCurrentStep(2);
    setSecretA(null);
    setSecretB(null);
  };

  const computeSharedSecret = () => {
    if (publicA === null || publicB === null) {
      alert('Сначала вычислите публичные ключи');
      return;
    }
    const secretAVal = modPow(publicB, privateA, p);
    const secretBVal = modPow(publicA, privateB, p);
    setSecretA(secretAVal);
    setSecretB(secretBVal);
    setCurrentStep(4);
  };

  useEffect(() => {
    if (secretA !== null && secretB !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentStep(4);
    } else if (publicA !== null && publicB !== null) {
      setCurrentStep(2);
    } else {
      setCurrentStep(-1);
    }
  }, [secretA, secretB, publicA, publicB]);

  const isGValid = useMemo(() => {
    if (!isPrime(p)) return false;
    if (g < 2 || g >= p) return false;
    return isPrimitiveRoot(g, p);
  }, [p, g]);

  return (
    <div className="space-y-6">
      {/* Основной блок */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Протокол Диффи-Хеллмана
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
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setP(val);
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  g (примитивный корень)
                </label>
                <input
                  type="number"
                  value={g}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setG(val);
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {!isGValid && (
                  <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                    ⚠️ g не является примитивным корнем для данного p
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Приватный A
                </label>
                <input
                  type="number"
                  value={privateA}
                  onChange={(e) => {
                    setPrivateA(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Приватный B
                </label>
                <input
                  type="number"
                  value={privateB}
                  onChange={(e) => {
                    setPrivateB(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={computePublicKeys}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                disabled={!isPrime(p) || !isGValid}
              >
                Вычислить публичные ключи
              </button>
              <button
                onClick={computeSharedSecret}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                disabled={publicA === null || publicB === null}
              >
                Вычислить общий секрет
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateRandomParams}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные p, g
              </button>
              <button
                onClick={generateRandomPrivateKeys}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные a, b
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сброс
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 space-y-1">
              <div><span className="text-gray-500 dark:text-gray-400">p = </span>{p} {isPrime(p) ? '✅' : '❌'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">g = </span>{g} {isGValid ? '✅' : '❌'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">a = </span>{privateA}</div>
              <div><span className="text-gray-500 dark:text-gray-400">b = </span>{privateB}</div>
            </div>
          </div>

          {/* Правая колонка: результаты */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Публичный ключ A
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg text-center text-gray-900 dark:text-gray-100 min-h-[48px]">
                {publicA !== null ? publicA : '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Публичный ключ B
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg text-center text-gray-900 dark:text-gray-100 min-h-[48px]">
                {publicB !== null ? publicB : '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Общий секрет (A и B)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg font-mono text-lg text-center text-green-700 dark:text-green-300">
                  {secretA !== null ? secretA : '—'}
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg font-mono text-lg text-center text-green-700 dark:text-green-300">
                  {secretB !== null ? secretB : '—'}
                </div>
              </div>
              {secretA !== null && secretB !== null && secretA === secretB && (
                <div className="text-green-600 dark:text-green-400 text-sm mt-1 text-center font-medium">
                  ✅ Секреты совпадают!
                </div>
              )}
              {secretA !== null && secretB !== null && secretA !== secretB && (
                <div className="text-red-600 dark:text-red-400 text-sm mt-1 text-center font-medium">
                  ⚠️ Секреты не совпадают — проверьте вычисления
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Блок-схема шагов */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Пошаговый процесс
        </h4>
        <StepIndicator steps={stepsLabels} currentStep={currentStep} />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className={`p-3 rounded-lg border ${currentStep >= 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">1. Выбор p, g</div>
            <div className="text-gray-600 dark:text-gray-400">p = {p} {isPrime(p) ? '✅' : '❌'}, g = {g} {isGValid ? '✅' : '❌'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${currentStep >= 1 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">2. Приватные ключи</div>
            <div className="text-gray-600 dark:text-gray-400">a = {privateA}, b = {privateB}</div>
          </div>
          <div className={`p-3 rounded-lg border ${currentStep >= 2 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">3. Публичные ключи</div>
            <div className="text-gray-600 dark:text-gray-400">A = {publicA !== null ? publicA : '—'}, B = {publicB !== null ? publicB : '—'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${currentStep >= 3 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">4. Обмен ключами</div>
            <div className="text-gray-600 dark:text-gray-400">A → B, B → A (по открытому каналу)</div>
          </div>
          <div className={`p-3 rounded-lg border ${currentStep >= 4 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">5. Общий секрет</div>
            <div className="text-gray-600 dark:text-gray-400">s = {secretA !== null ? secretA : '—'}</div>
          </div>
        </div>
      </div>

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Как работает протокол Диффи-Хеллмана?
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Алиса и Боб договариваются о публичных параметрах: простое p и примитивный корень g.</li>
          <li>Каждый выбирает секретное число (a для Алисы, b для Боба).</li>
          <li>Вычисляют публичные ключи: A = g<sup>a</sup> mod p, B = g<sup>b</sup> mod p.</li>
          <li>Обмениваются публичными ключами (по открытому каналу).</li>
          <li>Каждый вычисляет общий секрет: s = B<sup>a</sup> mod p = A<sup>b</sup> mod p.</li>
          <li>Злоумышленник не может вычислить секрет без знания a или b (сложность дискретного логарифма).</li>
        </ul>
      </div>
    </div>
  );
};

export default DiffieHellman;