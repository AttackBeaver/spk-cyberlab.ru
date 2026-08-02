import { useState } from 'react';

// Упрощённая функция F (для демонстрации)
function fFunction(right: number[], key: number[]): number[] {
  const xored = right.map((bit, i) => bit ^ key[i % key.length]);
  return [...xored.slice(1), xored[0]];
}

// Один раунд DES (сеть Фейстеля)
function desRound(left: number[], right: number[], key: number[]): { left: number[]; right: number[]; fOutput: number[] } {
  const fOut = fFunction(right, key);
  const newRight = left.map((bit, i) => bit ^ fOut[i]);
  return { left: right, right: newRight, fOutput: fOut };
}

// Генерация случайного 56-битного ключа
function generateKey(): number[] {
  const key: number[] = [];
  for (let i = 0; i < 56; i++) {
    key.push(Math.random() > 0.5 ? 1 : 0);
  }
  return key;
}

// Генерация трёх ключей для Triple DES
function generateTripleKeys(): number[][] {
  return [generateKey(), generateKey(), generateKey()];
}

// Генерация раундовых ключей (упрощённо)
function generateRoundKeys(masterKey: number[], rounds: number): number[][] {
  const keys: number[][] = [];
  for (let r = 0; r < rounds; r++) {
    const start = (r * 8) % masterKey.length;
    const key = masterKey.slice(start, start + 8);
    keys.push(key);
  }
  return keys;
}

// Полный DES: шифрование блока
function desEncryptBlock(block: number[], key: number[]): number[] {
  const half = block.length / 2;
  let left = block.slice(0, half);
  let right = block.slice(half);
  const roundKeys = generateRoundKeys(key, 16);
  for (let r = 0; r < 16; r++) {
    const { left: newLeft, right: newRight } = desRound(left, right, roundKeys[r]);
    left = newLeft;
    right = newRight;
  }
  return [...left, ...right];
}

// Полный DES: дешифрование блока
function desDecryptBlock(block: number[], key: number[]): number[] {
  const half = block.length / 2;
  let left = block.slice(0, half);
  let right = block.slice(half);
  const roundKeys = generateRoundKeys(key, 16).reverse();
  for (let r = 0; r < 16; r++) {
    const { left: newLeft, right: newRight } = desRound(left, right, roundKeys[r]);
    left = newLeft;
    right = newRight;
  }
  return [...left, ...right];
}

// Triple DES: шифрование
function tripleDesEncrypt(block: number[], k1: number[], k2: number[], k3: number[]): { result: number[]; steps: string[] } {
  const step1 = desEncryptBlock(block, k1);
  const step2 = desDecryptBlock(step1, k2);
  const step3 = desEncryptBlock(step2, k3);
  return {
    result: step3,
    steps: [
      'Triple DES шифрование (K1, K2, K3):',
      `1. DES_Encrypt(K1) → ${bitsToString(step1)}`,
      `2. DES_Decrypt(K2) → ${bitsToString(step2)}`,
      `3. DES_Encrypt(K3) → ${bitsToString(step3)}`,
    ],
  };
}

// Вспомогательная функция для строки битов
function bitsToString(bits: number[]): string {
  return bits.join('');
}

// -------------------- Компонент --------------------
const DESVisualizer = () => {
  const [blockSize] = useState(8);
  const [rounds] = useState(16);
  const [mode, setMode] = useState<'des' | 'triple'>('des');
  const [inputBits, setInputBits] = useState('11001100 10101010 11110000 00001111 01010101 10011001 00110011 11110000');
  const [masterKey, setMasterKey] = useState<number[]>([]);
  const [tripleKeys, setTripleKeys] = useState<number[][]>([]);
  const [steps, setSteps] = useState<{ round: number; left: number[]; right: number[]; fOutput: number[] }[]>([]);
  const [result, setResult] = useState<number[]>([]);
  const [tripleSteps, setTripleSteps] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(-1);

  const parseBits = (str: string): number[] => {
    return str.replace(/\s/g, '').split('').map(ch => (ch === '1' ? 1 : 0));
  };

  const generateNewKey = () => {
    if (mode === 'des') {
      setMasterKey(generateKey());
      setTripleKeys([]);
    } else {
      setTripleKeys(generateTripleKeys());
      setMasterKey([]);
    }
    setSteps([]);
    setResult([]);
    setTripleSteps([]);
    setCurrentRound(-1);
  };

  const runDES = () => {
    const block = parseBits(inputBits);
    if (block.length !== blockSize * 8) {
      alert(`Введите ровно ${blockSize * 8} бит (${blockSize} байт)`);
      return;
    }

    if (mode === 'des') {
      const key = masterKey.length > 0 ? masterKey : generateKey();
      if (key.length < 56) {
        alert('Ключ должен содержать 56 бит');
        return;
      }
      const half = block.length / 2;
      let left = block.slice(0, half);
      let right = block.slice(half);
      const roundKeys = generateRoundKeys(key, rounds);
      const stepLog: { round: number; left: number[]; right: number[]; fOutput: number[] }[] = [];
      stepLog.push({ round: 0, left: [...left], right: [...right], fOutput: [] });
      for (let r = 0; r < rounds; r++) {
        const { left: newLeft, right: newRight, fOutput } = desRound(left, right, roundKeys[r]);
        left = newLeft;
        right = newRight;
        stepLog.push({ round: r + 1, left: [...left], right: [...right], fOutput });
      }
      setSteps(stepLog);
      setResult([...left, ...right]);
      setTripleSteps([]);
      setCurrentRound(0);
    } else {
      // Triple DES
      if (tripleKeys.length < 3) {
        alert('Сначала сгенерируйте три ключа');
        return;
      }
      const [k1, k2, k3] = tripleKeys;
      const output = tripleDesEncrypt(block, k1, k2, k3);
      setResult(output.result);
      setTripleSteps(output.steps);
      setSteps([]);
      setCurrentRound(-1);
    }
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
    setTripleSteps([]);
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
          {mode === 'des' ? 'DES' : 'Triple DES'} — визуализация сети Фейстеля
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Режим</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('des'); reset(); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'des'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  DES
                </button>
                <button
                  onClick={() => { setMode('triple'); reset(); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'triple'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Triple DES
                </button>
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'des' ? 'Ключ (56 бит)' : 'Ключи (три 56-битных)'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={generateNewKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {mode === 'des' ? 'Сгенерировать ключ' : 'Сгенерировать три ключа'}
                </button>
              </div>
              {mode === 'des' && masterKey.length > 0 && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                  {bitsToString(masterKey.slice(0, 56))}
                </div>
              )}
              {mode === 'triple' && tripleKeys.length === 3 && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-xs break-all text-gray-800 dark:text-gray-200">
                  <div>K1: {bitsToString(tripleKeys[0].slice(0, 56))}</div>
                  <div>K2: {bitsToString(tripleKeys[1].slice(0, 56))}</div>
                  <div>K3: {bitsToString(tripleKeys[2].slice(0, 56))}</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={runDES}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
              >
                {mode === 'des' ? 'Запустить DES' : 'Зашифровать (Triple DES)'}
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
            {mode === 'des' ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Пошаговая визуализация</h4>
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
                    <div className="text-gray-400 dark:text-gray-500 text-center">Нажмите «Запустить DES»</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Этапы Triple DES</h4>
                {tripleSteps.length > 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {tripleSteps.map((step, idx) => (
                      <div key={idx} className="font-mono text-sm text-gray-800 dark:text-gray-200 mb-2">{step}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">Сгенерируйте ключи и нажмите «Зашифровать»</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          {mode === 'des' ? 'Как работает DES?' : 'Как работает Triple DES?'}
        </h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {mode === 'des' ? (
            <>
              <li>Блок 64 бит делится на две половины по 32 бита.</li>
              <li>16 раундов с сетью Фейстеля: L<sub>i+1</sub> = R<sub>i</sub>, R<sub>i+1</sub> = L<sub>i</sub> ⊕ F(R<sub>i</sub>, K<sub>i</sub>).</li>
              <li>Ключ 56 бит, из которого генерируются 16 раундовых ключей.</li>
              <li>F-функция включает расширение, XOR с ключом, S-блоки и перестановку.</li>
              <li>В демонстрации используется упрощённая F-функция для наглядности.</li>
            </>
          ) : (
            <>
              <li>Применяет DES трижды с тремя ключами: Encrypt(K1) → Decrypt(K2) → Encrypt(K3).</li>
              <li>Эффективная длина ключа 168 бит (если все ключи независимы).</li>
              <li>Обратный порядок для дешифрования: Decrypt(K3) → Encrypt(K2) → Decrypt(K1).</li>
              <li>Используется для обратной совместимости с DES (K1=K2=K3 даёт обычный DES).</li>
              <li>Считается устаревшим, но всё ещё применяется в некоторых системах.</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DESVisualizer;