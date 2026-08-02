import { useState } from 'react';

// Упрощённая функция F с S-блоками (для демонстрации)
function fFunctionGOST(right: number[], key: number[]): number[] {
  // XOR правой половины с ключом
  const xored = right.map((bit, i) => bit ^ key[i % key.length]);
  // Применяем простую перестановку (имитация S-блоков)
  return [...xored.slice(4), ...xored.slice(0, 4)];
}

// Один раунд ГОСТ (сеть Фейстеля)
function gostRound(left: number[], right: number[], key: number[]): { left: number[]; right: number[]; fOutput: number[] } {
  const fOut = fFunctionGOST(right, key);
  const newRight = left.map((bit, i) => bit ^ fOut[i]);
  return { left: right, right: newRight, fOutput: fOut };
}

// Генерация 32 раундовых ключей из 256-битного ключа (упрощённо)
function generateGOSTKeys(masterKey: number[]): number[][] {
  const keys: number[][] = [];
  for (let r = 0; r < 32; r++) {
    const start = (r * 8) % masterKey.length;
    const key = masterKey.slice(start, start + 8);
    keys.push(key);
  }
  return keys;
}

// Генерация случайного 256-битного ключа
function generateGOSTKey(): number[] {
  const key: number[] = [];
  for (let i = 0; i < 256; i++) {
    key.push(Math.random() > 0.5 ? 1 : 0);
  }
  return key;
}

// -------------------- Компонент --------------------
const GOST28147 = () => {
  const [blockSize] = useState(8);
  const [rounds] = useState(32);
  const [inputBits, setInputBits] = useState('11001100 10101010 11110000 00001111 01010101 10011001 00110011 11110000');
  const [masterKey, setMasterKey] = useState<number[]>([]);
  const [steps, setSteps] = useState<{ round: number; left: number[]; right: number[]; fOutput: number[] }[]>([]);
  const [result, setResult] = useState<number[]>([]);
  const [currentRound, setCurrentRound] = useState(-1);

  const parseBits = (str: string): number[] => {
    return str.replace(/\s/g, '').split('').map(ch => (ch === '1' ? 1 : 0));
  };

  const bitsToString = (bits: number[]): string => {
    return bits.join('');
  };

  const generateNewKey = () => {
    const key = generateGOSTKey();
    setMasterKey(key);
  };

  const runGOST = () => {
    const block = parseBits(inputBits);
    if (block.length !== blockSize * 8) {
      alert(`Введите ровно ${blockSize * 8} бит (${blockSize} байт)`);
      return;
    }

    const key = masterKey.length > 0 ? masterKey : generateGOSTKey();
    if (key.length < 256) {
      alert('Ключ должен содержать 256 бит');
      return;
    }

    const half = block.length / 2;
    let left = block.slice(0, half);
    let right = block.slice(half);

    const roundKeys = generateGOSTKeys(key);
    const stepLog: { round: number; left: number[]; right: number[]; fOutput: number[] }[] = [];
    stepLog.push({ round: 0, left: [...left], right: [...right], fOutput: [] });

    for (let r = 0; r < rounds; r++) {
      const { left: newLeft, right: newRight, fOutput } = gostRound(left, right, roundKeys[r]);
      left = newLeft;
      right = newRight;
      stepLog.push({ round: r + 1, left: [...left], right: [...right], fOutput });
    }

    setSteps(stepLog);
    setResult([...left, ...right]);
    setCurrentRound(0);
  };

  const nextRound = () => {
    if (currentRound < steps.length - 1) {
      setCurrentRound(prev => prev + 1);
    }
  };

  const prevRound = () => {
    if (currentRound > 0) {
      setCurrentRound(prev => prev - 1);
    }
  };

  const reset = () => {
    setSteps([]);
    setResult([]);
    setCurrentRound(-1);
  };

  const getRoundDisplay = () => {
    if (currentRound < 0 || steps.length === 0) return null;
    const step = steps[currentRound];
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentRound === 0 ? 'Начальное состояние' : currentRound === steps.length - 1 ? 'Финальное состояние' : `Раунд ${currentRound}`}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Левая половина (L)</div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800">
              {bitsToString(step.left)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Правая половина (R)</div>
            <div className="p-2 bg-green-100 dark:bg-green-900/60 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-green-100 border border-green-200 dark:border-green-800">
              {bitsToString(step.right)}
            </div>
          </div>
        </div>
        {step.fOutput.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">F(Правая, Ключ)</div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
              {bitsToString(step.fOutput)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          ГОСТ 28147-89 (Магма) — сети Фейстеля
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Входной блок (64 бита, через пробелы)</label>
              <input
                type="text"
                value={inputBits}
                onChange={(e) => setInputBits(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm"
                placeholder="11001100 10101010 ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ключ (256 бит)</label>
              <div className="flex gap-2">
                <button
                  onClick={generateNewKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Сгенерировать ключ
                </button>
              </div>
              {masterKey.length > 0 && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-xs break-all text-gray-800 dark:text-gray-200 max-h-20 overflow-y-auto">
                  {bitsToString(masterKey.slice(0, 256))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={runGOST}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                Запустить ГОСТ
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Сброс
              </button>
            </div>

            {result.length > 0 && (
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">Результат:</div>
                <div className="font-mono text-sm break-all text-gray-900 dark:text-green-100">{bitsToString(result)}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Пошаговая визуализация (32 раунда)</h4>
              {steps.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={prevRound}
                    disabled={currentRound <= 0}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                  >
                    ◀
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRound + 1} / {steps.length}
                  </span>
                  <button
                    onClick={nextRound}
                    disabled={currentRound >= steps.length - 1}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[200px]">
              {getRoundDisplay() || (
                <div className="text-gray-400 dark:text-gray-500 text-center">Нажмите «Запустить ГОСТ»</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает ГОСТ 28147-89?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Российский стандарт блочного шифрования, также известный как Магма.</li>
          <li>Блок 64 бит, ключ 256 бит, 32 раунда.</li>
          <li>Использует сеть Фейстеля с S-блоками (8 блоков по 4 бита).</li>
          <li>В демонстрации используется упрощённая F-функция для наглядности.</li>
        </ul>
      </div>
    </div>
  );
};

export default GOST28147;