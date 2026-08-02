import { useState } from 'react';

// Упрощённая функция F (раундовая функция)
// Для демонстрации используем XOR с ключом и перестановку бит
function fFunction(right: number[], key: number[]): number[] {
  // XOR правой половины с ключом
  const xorResult = right.map((bit, i) => bit ^ key[i % key.length]);
  // Простая перестановка (сдвиг влево на 1)
  const shifted = [...xorResult.slice(1), xorResult[0]];
  return shifted;
}

// Один раунд сети Фейстеля
function feistelRound(left: number[], right: number[], key: number[]): { newLeft: number[]; newRight: number[] } {
  const newLeft = right;
  const fOut = fFunction(right, key);
  const newRight = left.map((bit, i) => bit ^ fOut[i]);
  return { newLeft, newRight };
}

// Множество раундов
function feistelEncrypt(block: number[], keys: number[][], rounds: number): {
  steps: { round: number; left: number[]; right: number[]; fOutput: number[] }[];
  result: number[];
} {
  let left = block.slice(0, block.length / 2);
  let right = block.slice(block.length / 2);
  const steps: { round: number; left: number[]; right: number[]; fOutput: number[] }[] = [];
  steps.push({ round: 0, left: [...left], right: [...right], fOutput: [] });
  for (let r = 0; r < rounds; r++) {
    const key = keys[r % keys.length];
    const { newLeft, newRight } = feistelRound(left, right, key);
    const fOut = fFunction(right, key);
    left = newLeft;
    right = newRight;
    steps.push({ round: r + 1, left: [...left], right: [...right], fOutput: fOut });
  }
  // После всех раундов итоговый блок = (right, left) (стандартное перемешивание)
  const result = [...right, ...left];
  return { steps, result };
}

// Генерация случайных ключей для каждого раунда
function generateKeys(blockSize: number, rounds: number): number[][] {
  const keys: number[][] = [];
  const halfSize = blockSize / 2;
  for (let r = 0; r < rounds; r++) {
    const key: number[] = [];
    for (let i = 0; i < halfSize; i++) {
      key.push(Math.random() > 0.5 ? 1 : 0);
    }
    keys.push(key);
  }
  return keys;
}

// Визуализация битового вектора в виде строки
function bitsToString(bits: number[]): string {
  return bits.join('');
}

// -------------------- Компонент --------------------
const FeistelNetwork = () => {
  const [blockSize, setBlockSize] = useState(8); // размер блока в битах (должен быть чётным)
  const [rounds, setRounds] = useState(4);
  const [inputBlock, setInputBlock] = useState('10101010');
  const [keys, setKeys] = useState<number[][]>([]);
  const [steps, setSteps] = useState<{ round: number; left: number[]; right: number[]; fOutput: number[] }[]>([]);
  const [result, setResult] = useState<number[]>([]);
  const [showSteps] = useState(true);

  // Преобразование строки в битовый массив
  const parseBlock = (str: string): number[] => {
    return str.split('').map(ch => (ch === '1' ? 1 : 0));
  };

  const handleEncrypt = () => {
    const block = parseBlock(inputBlock);
    if (block.length !== blockSize) {
      alert(`Размер блока должен быть ${blockSize} бит`);
      return;
    }
    const genKeys = generateKeys(blockSize, rounds);
    setKeys(genKeys);
    const { steps, result } = feistelEncrypt(block, genKeys, rounds);
    setSteps(steps);
    setResult(result);
  };

  const generateRandomBlock = () => {
    let bits = '';
    for (let i = 0; i < blockSize; i++) {
      bits += Math.random() > 0.5 ? '1' : '0';
    }
    setInputBlock(bits);
  };

  const clearAll = () => {
    setSteps([]);
    setResult([]);
    setKeys([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Сеть Фейстеля
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Размер блока (бит, чётное число)</label>
              <input
                type="number"
                value={blockSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val % 2 === 0) setBlockSize(val);
                }}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Число раундов</label>
              <input
                type="number"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Входной блок (биты)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputBlock}
                  onChange={(e) => setInputBlock(e.target.value.replace(/[^01]/g, ''))}
                  className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  placeholder="Например: 10101010"
                />
                <button
                  onClick={generateRandomBlock}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm whitespace-nowrap"
                >
                  Случайный
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                Запустить шифрование
              </button>
              <button
                onClick={clearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Очистить
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono">
              <div><span className="text-gray-500 dark:text-gray-400">Вход:</span> {inputBlock}</div>
              {result.length > 0 && (
                <div><span className="text-gray-500 dark:text-gray-400">Выход:</span> <span className="text-amber-600 dark:text-amber-400 font-bold">{bitsToString(result)}</span></div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ключи раундов</h4>
            {keys.length > 0 ? (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
                {keys.map((key, idx) => (
                  <div key={idx} className="font-mono text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Раунд {idx + 1}:</span>
                    <span className="text-blue-600 dark:text-blue-400 ml-2">{bitsToString(key)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500">Ключи сгенерируются при шифровании</div>
            )}
          </div>
        </div>
      </div>

      {/* Пошаговая визуализация */}
      {showSteps && steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Пошаговая визуализация раундов</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border px-2 py-1">Раунд</th>
                  <th className="border px-2 py-1">Левая половина</th>
                  <th className="border px-2 py-1">Правая половина</th>
                  <th className="border px-2 py-1">F(правая, ключ)</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.round} className={step.round % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                    <td className="border px-2 py-1 text-center font-bold">{step.round}</td>
                    <td className="border px-2 py-1 font-mono text-blue-600 dark:text-blue-400">{bitsToString(step.left)}</td>
                    <td className="border px-2 py-1 font-mono text-green-600 dark:text-green-400">{bitsToString(step.right)}</td>
                    <td className="border px-2 py-1 font-mono text-amber-600 dark:text-amber-400">{step.fOutput.length > 0 ? bitsToString(step.fOutput) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            В каждом раунде: L<sub>i+1</sub> = R<sub>i</sub>, R<sub>i+1</sub> = L<sub>i</sub> ⊕ F(R<sub>i</sub>, K<sub>i</sub>).
            F — XOR с ключом и перестановка бит.
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Что такое сеть Фейстеля?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Архитектура, используемая в блочных шифрах (DES, ГОСТ 28147-89, Blowfish).</li>
          <li>Блок делится на две половины, которые проходят через несколько раундов.</li>
          <li>В каждом раунде применяется раундовая функция F с ключом.</li>
          <li>Шифрование и дешифрование используют одинаковую структуру (обратный порядок ключей).</li>
          <li>В демонстрации используется упрощённая функция F (XOR + перестановка).</li>
        </ul>
      </div>
    </div>
  );
};

export default FeistelNetwork;