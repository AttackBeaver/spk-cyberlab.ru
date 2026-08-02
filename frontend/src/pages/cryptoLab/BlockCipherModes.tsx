import { useState, useMemo } from 'react';

// Простая функция шифрования блока (XOR с ключом)
function encryptBlock(block: number[], key: number[]): number[] {
  return block.map((b, i) => b ^ key[i % key.length]);
}

// Разбиение текста на блоки по 8 байт (64 бита)
function stringToBlocks(text: string, blockSize: number = 8): number[][] {
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(text));
  const blocks: number[][] = [];
  for (let i = 0; i < bytes.length; i += blockSize) {
    const block = bytes.slice(i, i + blockSize);
    // Дополняем нулями до blockSize
    while (block.length < blockSize) block.push(0);
    blocks.push(block);
  }
  return blocks;
}

// Преобразование блока байтов в строку (только печатаемые символы)
function blockToString(block: number[]): string {
  return block.map(b => String.fromCharCode(b)).join('');
}

// Визуализация блока в hex
function blockToHex(block: number[]): string {
  return block.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

// XOR двух блоков
function xorBlocks(block1: number[], block2: number[]): number[] {
  return block1.map((b, i) => b ^ block2[i % block2.length]);
}

// -------------------- Компонент --------------------
const BlockCipherModes = () => {
  const [text, setText] = useState('Hello, World!');
  const [mode, setMode] = useState<'ECB' | 'CBC'>('ECB');
  const [key, setKey] = useState('secret');
  const [encryptedBlocks, setEncryptedBlocks] = useState<number[][]>([]);
  const [decryptedBlocks, setDecryptedBlocks] = useState<number[][]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  const blockSize = 8;

  // Генерация ключа в байтах
  const keyBytes = useMemo(() => {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(key));
  }, [key]);

  // Шифрование
  const handleEncrypt = () => {
    const blocks = stringToBlocks(text, blockSize);
    const encrypted: number[][] = [];
    const stepLog: string[] = [];
    stepLog.push(`Режим: ${mode}`);
    stepLog.push(`Исходный текст: "${text}"`);
    stepLog.push(`Размер блока: ${blockSize} байт`);
    stepLog.push(`Ключ: "${key}" (байты: ${keyBytes.join(' ')})`);
    stepLog.push(`Количество блоков: ${blocks.length}`);

    let prevBlock: number[] = new Array(blockSize).fill(0);

    blocks.forEach((block, idx) => {
      let inputBlock = block;
      if (mode === 'CBC' && idx > 0) {
        inputBlock = xorBlocks(block, prevBlock);
        stepLog.push(`Блок ${idx + 1}: XOR с предыдущим зашифрованным блоком -> [${inputBlock.join(', ')}]`);
      }
      const encryptedBlock = encryptBlock(inputBlock, keyBytes);
      encrypted.push(encryptedBlock);
      stepLog.push(`Блок ${idx + 1}: исходный=[${block.join(', ')}] -> зашифрованный=[${encryptedBlock.join(', ')}]`);
      if (mode === 'CBC') {
        prevBlock = encryptedBlock;
        stepLog.push(`  Предыдущий зашифрованный блок для следующего шага: [${prevBlock.join(', ')}]`);
      }
    });

    setEncryptedBlocks(encrypted);
    setSteps(stepLog);
    setShowSteps(true);
    setDecryptedBlocks([]);
  };

  // Дешифрование
  const handleDecrypt = () => {
    if (encryptedBlocks.length === 0) {
      alert('Сначала зашифруйте текст');
      return;
    }
    const decrypted: number[][] = [];
    const stepLog: string[] = [...steps];
    stepLog.push('--- Дешифрование ---');

    let prevBlock: number[] = new Array(blockSize).fill(0);

    encryptedBlocks.forEach((block, idx) => {
      const decryptedBlock = encryptBlock(block, keyBytes); // XOR с ключом (симметрично)
      let outputBlock = decryptedBlock;
      if (mode === 'CBC' && idx > 0) {
        outputBlock = xorBlocks(decryptedBlock, prevBlock);
        stepLog.push(`Блок ${idx + 1}: XOR с предыдущим зашифрованным блоком -> [${outputBlock.join(', ')}]`);
      }
      decrypted.push(outputBlock);
      stepLog.push(`Блок ${idx + 1}: зашифрованный=[${block.join(', ')}] -> расшифрованный=[${outputBlock.join(', ')}]`);
      if (mode === 'CBC') {
        prevBlock = block; // для CBC используем предыдущий зашифрованный блок
        stepLog.push(`  Предыдущий зашифрованный блок для следующего шага: [${prevBlock.join(', ')}]`);
      }
    });

    setDecryptedBlocks(decrypted);
    setSteps(stepLog);
  };

  const resetAll = () => {
    setEncryptedBlocks([]);
    setDecryptedBlocks([]);
    setSteps([]);
    setShowSteps(false);
  };

  // Визуализация блоков
  const renderBlocks = (blocks: number[][], label: string, color: string) => {
    if (blocks.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {blocks.map((block, idx) => (
            <div key={idx} className={`p-2 border rounded ${color} font-mono text-xs`}>
              <div className="text-gray-500 dark:text-gray-400">Блок {idx + 1}</div>
              <div>{blockToHex(block)}</div>
              <div className="text-gray-400 text-[10px]">{blockToString(block)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Режимы шифрования блочных шифров: ECB vs CBC
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Текст</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Режим</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('ECB')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'ECB'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  ECB
                </button>
                <button
                  onClick={() => setMode('CBC')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'CBC'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  CBC
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ключ (для XOR)</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                Зашифровать
              </button>
              <button
                onClick={handleDecrypt}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                disabled={encryptedBlocks.length === 0}
              >
                Расшифровать
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Очистить
              </button>
            </div>

            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
              <div><span className="text-gray-500 dark:text-gray-400">Режим:</span> {mode}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Размер блока:</span> {blockSize} байт</div>
              <div><span className="text-gray-500 dark:text-gray-400">Ключ (hex):</span> {keyBytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Результат</h4>
            {renderBlocks(encryptedBlocks, 'Зашифрованные блоки', 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800')}
            {renderBlocks(decryptedBlocks, 'Расшифрованные блоки', 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800')}
            {decryptedBlocks.length > 0 && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="font-medium text-green-800 dark:text-green-200">Восстановленный текст: </span>
                <span className="font-mono">{decryptedBlocks.map(block => blockToString(block)).join('')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Пошаговый вывод */}
      {showSteps && steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            {showSteps ? 'Скрыть пошаговый вывод' : 'Показать пошаговый вывод'}
          </button>
          {showSteps && (
            <div className="mt-3 space-y-1 font-mono text-sm text-gray-800 dark:text-gray-200 max-h-60 overflow-y-auto">
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
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">ECB vs CBC</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li><span className="font-medium">ECB</span> (Electronic Code Book): каждый блок шифруется независимо. Одинаковые блоки дают одинаковый шифротекст.</li>
          <li><span className="font-medium">CBC</span> (Cipher Block Chaining): каждый блок XOR-ится с предыдущим зашифрованным блоком, что скрывает повторения.</li>
          <li>CBC более безопасен, так как вносит случайность (используется вектор инициализации).</li>
          <li>В этой демонстрации используется простая XOR-функция для наглядности.</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockCipherModes;