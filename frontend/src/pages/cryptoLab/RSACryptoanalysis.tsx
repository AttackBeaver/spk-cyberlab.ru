import { useState } from 'react';

// -------------------- Вспомогательные функции (повтор из RSA) --------------------
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

// -------------------- Криптоанализ: факторизация n --------------------
function factorize(n: number): { p: number; q: number; steps: string[] } {
  const steps: string[] = [];
  steps.push(`Попытка факторизации n = ${n}`);
  if (n < 2) {
    steps.push('n слишком мало');
    return { p: 1, q: 1, steps };
  }
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      const p = i;
      const q = n / i;
      if (isPrime(p) && isPrime(q)) {
        steps.push(`Найдены множители: p = ${p}, q = ${q}`);
        return { p, q, steps };
      }
    }
  }
  steps.push('Не удалось найти простые множители');
  return { p: 1, q: 1, steps };
}

// -------------------- Компонент --------------------
const RSACryptoanalysis = () => {
  const [n, setN] = useState(143);
  const [e, setE] = useState(7);
  const [ciphertext, setCiphertext] = useState(85);
  const [p, setP] = useState<number | null>(null);
  const [q, setQ] = useState<number | null>(null);
  const [d, setD] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<number | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const handleCrack = () => {
    // Шаг 1: Факторизация n
    const { p: factorP, q: factorQ, steps: factorSteps } = factorize(n);
    setP(factorP);
    setQ(factorQ);

    if (factorP === 1 || factorQ === 1) {
      setSteps([...factorSteps, 'Не удалось взломать RSA — n слишком большое для перебора']);
      setD(null);
      setDecrypted(null);
      return;
    }

    const phi = (factorP - 1) * (factorQ - 1);
    const dCalc = modInverse(e, phi);
    setD(dCalc);

    const decryptedMsg = modPow(ciphertext, dCalc, n);
    setDecrypted(decryptedMsg);

    setSteps([
      ...factorSteps,
      `φ(n) = (${factorP}-1)*(${factorQ}-1) = ${phi}`,
      `Вычисление d: d ≡ e⁻¹ mod φ(n) = ${dCalc}`,
      `Расшифровка: m = c^d mod n = ${ciphertext}^${dCalc} mod ${n} = ${decryptedMsg}`,
      `✅ RSA взломан! Сообщение: ${decryptedMsg}`,
    ]);
  };

  const resetAll = () => {
    setP(null);
    setQ(null);
    setD(null);
    setDecrypted(null);
    setSteps([]);
  };

  const generateRandomAttack = () => {
    // Генерируем случайное n, e и шифротекст для демонстрации
    const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    const pIdx = Math.floor(Math.random() * primes.length);
    let qIdx = Math.floor(Math.random() * primes.length);
    while (qIdx === pIdx) qIdx = Math.floor(Math.random() * primes.length);
    const pVal = primes[pIdx];
    const qVal = primes[qIdx];
    const nVal = pVal * qVal;
    const phi = (pVal - 1) * (qVal - 1);
    let eVal = 17;
    while (gcd(eVal, phi) !== 1) eVal += 2;
    const msg = Math.floor(Math.random() * (nVal - 2)) + 2;
    const c = modPow(msg, eVal, nVal);
    setN(nVal);
    setE(eVal);
    setCiphertext(c);
    resetAll();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Криптоанализ RSA — взлом методом факторизации
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Модуль n (открытый ключ)</label>
              <input
                type="number"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Открытая экспонента e</label>
              <input
                type="number"
                value={e}
                onChange={(e) => setE(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Зашифрованное сообщение c</label>
              <input
                type="number"
                value={ciphertext}
                onChange={(e) => setCiphertext(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCrack}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
              >
                Взломать RSA
              </button>
              <button
                onClick={generateRandomAttack}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные параметры
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сброс
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 space-y-1">
              <div><span className="text-gray-500 dark:text-gray-400">n = </span>{n}</div>
              <div><span className="text-gray-500 dark:text-gray-400">e = </span>{e}</div>
              <div><span className="text-gray-500 dark:text-gray-400">c = </span>{ciphertext}</div>
              {p !== null && q !== null && <div><span className="text-green-600 dark:text-green-400">p = {p}, q = {q}</span></div>}
              {d !== null && <div><span className="text-blue-600 dark:text-blue-400">d = {d}</span></div>}
              {decrypted !== null && <div><span className="text-amber-600 dark:text-amber-400 font-bold">m = {decrypted}</span></div>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Объяснение атаки</h4>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                Злоумышленник знает открытый ключ (n, e) и перехватил шифротекст c.
                Он пытается разложить n на простые множители p и q.
                Затем вычисляет φ(n) и находит d (закрытый ключ).
                После этого расшифровывает сообщение.
              </p>
              <div className="mt-2 font-mono text-xs">
                <div>1. n = p * q → факторизация</div>
                <div>2. φ(n) = (p-1)(q-1)</div>
                <div>3. d = e⁻¹ mod φ(n)</div>
                <div>4. m = c^d mod n</div>
              </div>
              <div className="mt-2 text-yellow-600 dark:text-yellow-400 text-xs">
                ⚠️ Атака работает только для маленьких n. В реальном RSA используются простые числа длиной 1024+ бит.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Пошаговый вывод */}
      {steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            {showSteps ? 'Скрыть пошаговый вывод' : 'Показать пошаговый вывод'}
          </button>
          {showSteps && (
            <div className="mt-3 space-y-1 font-mono text-sm text-gray-800 dark:text-gray-200">
              {steps.map((step, idx) => (
                <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Почему RSA считается стойким?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Стойкость основана на сложности факторизации больших чисел.</li>
          <li>Для n длиной 1024 бит требуется огромное количество операций.</li>
          <li>Современные алгоритмы факторизации (например, GNFS) неэффективны для больших ключей.</li>
          <li>При длине ключа 2048 бит и более RSA считается безопасным.</li>
        </ul>
      </div>
    </div>
  );
};

export default RSACryptoanalysis;