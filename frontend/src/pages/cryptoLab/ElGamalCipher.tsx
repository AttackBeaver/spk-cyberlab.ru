import { useState } from 'react';

// -------------------- Вспомогательные функции --------------------
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
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

function generatePrime(min: number, max: number): number {
  let num = Math.floor(Math.random() * (max - min + 1)) + min;
  while (!isPrime(num)) {
    num = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return num;
}

function findPrimitiveRoot(p: number): number {
  if (!isPrime(p)) return -1;
  for (let g = 2; g < p; g++) {
    const seen = new Set<number>();
    for (let i = 1; i < p; i++) {
      seen.add(modPow(g, i, p));
    }
    if (seen.size === p - 1) return g;
  }
  return -1;
}

// -------------------- Компонент --------------------
const ElGamalCipher = () => {
  const [p, setP] = useState(23);
  const [g, setG] = useState(5);
  const [privateKey, setPrivateKey] = useState(6);
  const [message, setMessage] = useState(10);
  const [k, setK] = useState(3);

  const [publicKey, setPublicKey] = useState<number | null>(null);
  const [encryptedPair, setEncryptedPair] = useState<{ a: number; b: number } | null>(null);
  const [decrypted, setDecrypted] = useState<number | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const computePublicKey = () => {
    if (!isPrime(p) || g <= 0 || g >= p) {
      alert('p должно быть простым, а g — числом от 2 до p-1');
      return;
    }
    if (privateKey < 1 || privateKey >= p) {
      alert('Приватный ключ должен быть в диапазоне [1, p-1]');
      return;
    }
    const pub = modPow(g, privateKey, p);
    setPublicKey(pub);
    setSteps([
      `1. Выбрано простое p = ${p}`,
      `2. Выбран примитивный корень g = ${g}`,
      `3. Выбран приватный ключ x = ${privateKey}`,
      `4. Вычислен публичный ключ: y = g^x mod p = ${g}^${privateKey} mod ${p} = ${pub}`,
    ]);
    setEncryptedPair(null);
    setDecrypted(null);
  };

  const encrypt = () => {
    if (publicKey === null) {
      alert('Сначала вычислите публичный ключ получателя');
      return;
    }
    if (message >= p) {
      alert('Сообщение должно быть меньше p');
      return;
    }
    if (k < 1 || k >= p - 1) {
      alert('k должно быть в диапазоне [1, p-2]');
      return;
    }
    const a = modPow(g, k, p);
    const b = (message * modPow(publicKey, k, p)) % p;
    setEncryptedPair({ a, b });
    setDecrypted(null);
    setSteps(prev => [
      ...prev,
      `5. Шифрование:`,
      `   a = g^k mod p = ${g}^${k} mod ${p} = ${a}`,
      `   b = m * y^k mod p = ${message} * ${publicKey}^${k} mod ${p} = ${b}`,
      `   Шифротекст: (${a}, ${b})`,
    ]);
  };

  const decrypt = () => {
    if (encryptedPair === null) {
      alert('Сначала зашифруйте сообщение');
      return;
    }
    const { a, b } = encryptedPair;
    const aInverse = modInverse(a, p);
    const m = (b * modPow(aInverse, privateKey, p)) % p;
    setDecrypted(m);
    setSteps(prev => [
      ...prev,
      `6. Дешифрование:`,
      `   a^(-x) = ${a}^(-${privateKey}) mod ${p} = ${modPow(a, p - 1 - privateKey, p)} (через обратный элемент)`,
      `   m = b * a^(-x) mod p = ${b} * ${modPow(a, p - 1 - privateKey, p)} mod ${p} = ${m}`,
    ]);
  };

  const generateRandomParams = () => {
    // Генерируем новые параметры внутри обработчика (не во время рендера)
    const newP = generatePrime(10, 100);
    const root = findPrimitiveRoot(newP);
    if (root !== -1) {
      setP(newP);
      setG(root);
      setPrivateKey(Math.floor(Math.random() * (newP - 2)) + 1);
      setMessage(Math.floor(Math.random() * (newP - 1)) + 1);
      setK(Math.floor(Math.random() * (newP - 2)) + 1);
    } else {
      // Если не нашли корень, пробуем ещё раз
      generateRandomParams();
      return;
    }
    setPublicKey(null);
    setEncryptedPair(null);
    setDecrypted(null);
    setSteps([]);
  };

  const resetAll = () => {
    setPublicKey(null);
    setEncryptedPair(null);
    setDecrypted(null);
    setSteps([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Шифрование Эль-Гамаля — визуализация
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">p (простое)</label>
                <input
                  type="number"
                  value={p}
                  onChange={(e) => {
                    setP(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">g (примитивный корень)</label>
                <input
                  type="number"
                  value={g}
                  onChange={(e) => {
                    setG(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Приватный ключ x (1..p-1)</label>
              <input
                type="number"
                value={privateKey}
                onChange={(e) => {
                  setPrivateKey(Number(e.target.value));
                  resetAll();
                }}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Сообщение (число &lt; p)</label>
              <input
                type="number"
                value={message}
                onChange={(e) => setMessage(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Эфемерный ключ k (1..p-2)</label>
              <input
                type="number"
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={computePublicKey}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Вычислить публичный ключ
              </button>
              <button
                onClick={encrypt}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
                disabled={publicKey === null}
              >
                Зашифровать
              </button>
              <button
                onClick={decrypt}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                disabled={encryptedPair === null}
              >
                Расшифровать
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateRandomParams}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные параметры
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
              <div><span className="text-gray-500 dark:text-gray-400">g = </span>{g}</div>
              <div><span className="text-gray-500 dark:text-gray-400">x = </span>{privateKey}</div>
              <div><span className="text-gray-500 dark:text-gray-400">y = </span>{publicKey !== null ? publicKey : '—'}</div>
              {encryptedPair && (
                <>
                  <div><span className="text-gray-500 dark:text-gray-400">a = </span>{encryptedPair.a}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">b = </span>{encryptedPair.b}</div>
                </>
              )}
              {decrypted !== null && (
                <div><span className="text-green-600 dark:text-green-400 font-bold">m = {decrypted}</span></div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Схема Эль-Гамаля</h4>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Открытый ключ:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">(p, g, y) = ({p}, {g}, {publicKey ?? '?'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Закрытый ключ:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">x = {privateKey}</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Шифрование:</span>
                    <span className="font-mono">(a, b) = (g<sup>k</sup>, m·y<sup>k</sup>) mod p</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Дешифрование:</span>
                    <span className="font-mono">m = b · a<sup>-x</sup> mod p</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Пошаговый вывод */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          {showSteps ? 'Скрыть пошаговый вывод' : 'Показать пошаговый вывод'}
        </button>
        {showSteps && steps.length > 0 && (
          <div className="mt-3 space-y-1 font-mono text-sm text-gray-800 dark:text-gray-200">
            {steps.map((step, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает шифрование Эль-Гамаля?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Асимметричная криптосистема, основанная на сложности дискретного логарифмирования.</li>
          <li>Каждый раунд шифрования использует случайное эфемерное число k.</li>
          <li>Шифротекст состоит из двух частей: (a, b).</li>
          <li>Безопасность гарантируется сложностью вычисления x по y = g<sup>x</sup> mod p.</li>
        </ul>
      </div>
    </div>
  );
};

export default ElGamalCipher;