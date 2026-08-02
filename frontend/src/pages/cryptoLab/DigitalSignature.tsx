import { useState, useMemo } from 'react';

// -------------------- Вспомогательные функции (общие для RSA) --------------------
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

// Простая хеш-функция (возвращает число, но мы обрежем по модулю n)
function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000000;
  }
  return hash;
}

// -------------------- Основной компонент --------------------
const DigitalSignature = () => {
  // Инициализируем p и q случайными простыми числами от 20 до 100 (чтобы n было не слишком маленьким)
  const [p, setP] = useState(() => generatePrime(20, 100));
  const [q, setQ] = useState(() => generatePrime(20, 100));
  const [message, setMessage] = useState('Hello, world!');
  const [modifiedMessage, setModifiedMessage] = useState('Hello, world!');
  const [signature, setSignature] = useState<number | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  // Вычисление ключей RSA
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

  // Хеш сообщения, обрезанный по модулю n (если n > 0)
  const hash = useMemo(() => {
    const raw = simpleHash(message);
    return keys.n > 0 ? raw % keys.n : raw;
  }, [message, keys.n]);

  const modifiedHash = useMemo(() => {
    const raw = simpleHash(modifiedMessage);
    return keys.n > 0 ? raw % keys.n : raw;
  }, [modifiedMessage, keys.n]);

  // Сброс состояния
  const resetAll = () => {
    setSignature(null);
    setIsValid(null);
    setSteps([]);
  };

  // Генерация случайных простых p и q (от 20 до 100)
  const generateRandomPrimes = () => {
    const newP = generatePrime(20, 100);
    const newQ = generatePrime(20, 100);
    setP(newP);
    setQ(newQ);
    resetAll();
  };

  // Создание подписи
  const sign = () => {
    if (!keys.valid) {
      setSteps(['❌ Ошибка: p или q не являются простыми числами']);
      setSignature(null);
      setIsValid(null);
      return;
    }
    const { n, d } = keys;
    if (hash >= n) {
      // Теоретически такого быть не должно, т.к. hash = raw % n, но на всякий случай
      setSteps([`❌ Хеш (${hash}) больше n = ${n}. Это не должно случиться, но проверьте p и q.`]);
      setSignature(null);
      setIsValid(null);
      return;
    }
    const sig = modPow(hash, d, n);
    setSignature(sig);
    setSteps([
      `1. Сообщение: "${message}"`,
      `2. Хеш (по модулю n): H = ${hash} (исходный хеш ${simpleHash(message)})`,
      `3. Закрытый ключ: (n=${n}, d=${d})`,
      `4. Подпись: S = H^d mod n = ${hash}^${d} mod ${n} = ${sig}`,
    ]);
    setIsValid(null);
  };

  // Проверка подписи для заданного сообщения
  const verify = (msg: string, sig: number) => {
    if (!keys.valid || sig === null) {
      return false;
    }
    const { n, e } = keys;
    const decryptedHash = modPow(sig, e, n);
    const originalHash = simpleHash(msg) % n;
    const valid = decryptedHash === originalHash;
    const newSteps = [
      ...steps,
      `5. Проверка для сообщения "${msg}":`,
      `   Расшифрованная подпись: H' = S^e mod n = ${sig}^${e} mod ${n} = ${decryptedHash}`,
      `   Хеш сообщения: H = ${originalHash}`,
      `   ${valid ? '✅ Подпись верна!' : '❌ Подпись НЕ верна!'}`,
    ];
    setSteps(newSteps);
    return valid;
  };

  const handleVerifyOriginal = () => {
    if (signature === null) {
      setSteps(['Сначала подпишите сообщение']);
      return;
    }
    const valid = verify(message, signature);
    setIsValid(valid);
  };

  const handleVerifyModified = () => {
    if (signature === null) {
      setSteps(['Сначала подпишите сообщение']);
      return;
    }
    const valid = verify(modifiedMessage, signature);
    setIsValid(valid);
  };

  return (
    <div className="space-y-6">
      {/* Основной блок */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Электронная подпись (RSA)
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
                    setP(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {!isPrime(p) && <div className="text-red-500 text-xs mt-1">❌ не простое</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  q (простое)
                </label>
                <input
                  type="number"
                  value={q}
                  onChange={(e) => {
                    setQ(Number(e.target.value));
                    resetAll();
                  }}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {!isPrime(q) && <div className="text-red-500 text-xs mt-1">❌ не простое</div>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сообщение для подписи
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  resetAll();
                }}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
              <span className="text-gray-600 dark:text-gray-400">Хеш (по модулю n): </span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{hash}</span>
              <span className="text-gray-400 text-xs ml-2">(исходный: {simpleHash(message)})</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={sign}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                disabled={!keys.valid}
              >
                Создать подпись
              </button>
              <button
                onClick={generateRandomPrimes}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Случайные p, q
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сброс
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 space-y-1">
              <div><span className="text-gray-500 dark:text-gray-400">n = </span>{keys.n || '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">e = </span>{keys.e || '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">d = </span>{keys.d !== -1 ? keys.d : '—'}</div>
              {!keys.valid && <div className="text-red-500">⚠️ p и q должны быть простыми</div>}
            </div>
          </div>

          {/* Правая колонка: подпись и проверка */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Подпись (число)
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg text-center text-gray-900 dark:text-gray-100 min-h-[48px] break-all">
                {signature !== null ? signature : '—'}
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Проверка подписи</h4>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">Оригинальное сообщение</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      disabled
                      className="flex-1 border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <button
                      onClick={handleVerifyOriginal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm disabled:opacity-50"
                      disabled={signature === null || !keys.valid}
                    >
                      Проверить
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400">Изменённое сообщение (подделка)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modifiedMessage}
                      onChange={(e) => setModifiedMessage(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      onClick={handleVerifyModified}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm disabled:opacity-50"
                      disabled={signature === null || !keys.valid}
                    >
                      Проверить
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Хеш изменённого: {modifiedHash}
                  </div>
                </div>
              </div>

              {isValid !== null && (
                <div className={`mt-2 p-3 rounded-lg text-center font-bold ${isValid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                  {isValid ? '✅ Подпись действительна' : '❌ Подпись НЕ действительна (сообщение изменено)'}
                </div>
              )}
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

      {/* Объяснение */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Как работает электронная подпись?
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Отправитель вычисляет хеш сообщения и обрезает его по модулю n (чтобы он помещался в модуль).</li>
          <li>Шифрует полученный хеш своим закрытым ключом — получает подпись.</li>
          <li>Отправляет сообщение и подпись получателю.</li>
          <li>Получатель расшифровывает подпись открытым ключом отправителя и сравнивает с хешем сообщения (также обрезанным по модулю n).</li>
          <li>Если хеши совпадают — подпись верна, сообщение не изменено.</li>
          <li>Даже небольшое изменение сообщения приводит к несовпадению хешей.</li>
        </ul>
      </div>
    </div>
  );
};

export default DigitalSignature;