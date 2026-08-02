import { useState } from 'react';

// -------------------- RLE (сжатие) --------------------
function rleEncode(text: string): { encoded: string; steps: { char: string; count: number }[] } {
  if (!text) return { encoded: '', steps: [] };
  const steps: { char: string; count: number }[] = [];
  let result = '';
  let count = 1;
  for (let i = 1; i <= text.length; i++) {
    if (i < text.length && text[i] === text[i - 1]) {
      count++;
    } else {
      result += text[i - 1] + count;
      steps.push({ char: text[i - 1], count });
      count = 1;
    }
  }
  return { encoded: result, steps };
}

function rleDecode(encoded: string): { decoded: string; steps: { char: string; count: number }[] } {
  if (!encoded) return { decoded: '', steps: [] };
  const steps: { char: string; count: number }[] = [];
  let result = '';
  let i = 0;
  while (i < encoded.length) {
    const char = encoded[i];
    let countStr = '';
    i++;
    while (i < encoded.length && !isNaN(Number(encoded[i]))) {
      countStr += encoded[i];
      i++;
    }
    const count = parseInt(countStr) || 1;
    result += char.repeat(count);
    steps.push({ char, count });
  }
  return { decoded: result, steps };
}

// -------------------- Хаффман (упрощённая визуализация) --------------------
function huffmanEncode(text: string): { encoded: string; codes: Record<string, string>; tree: string } {
  if (!text) return { encoded: '', codes: {}, tree: '' };
  
  // Подсчёт частот
  const freq: Record<string, number> = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }

  // Построение дерева (упрощённо: для визуализации создаём простое дерево)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = Object.entries(freq).map(([char, count]) => ({ char, count, left: null as any, right: null as any }));
  
  // Сортируем по частоте
  nodes.sort((a, b) => a.count - b.count);
  
  // Строим дерево (упрощённо, для визуализации)
  let treeString = '';
  while (nodes.length > 1) {
    const left = nodes.shift()!;
    const right = nodes.shift()!;
    const parent = {
      char: '',
      count: left.count + right.count,
      left,
      right,
    };
    nodes.push(parent);
    nodes.sort((a, b) => a.count - b.count);
    treeString += `(${left.char || '?'}+${right.char || '?'}) `;
  }

  // Генерируем коды (упрощённо, для наглядности)
  const codes: Record<string, string> = {};
  const root = nodes[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateCodes = (node: any, prefix: string) => {
    if (node.char) {
      codes[node.char] = prefix || '0';
      return;
    }
    if (node.left) generateCodes(node.left, prefix + '0');
    if (node.right) generateCodes(node.right, prefix + '1');
  };
  if (root) generateCodes(root, '');

  // Кодируем текст
  let encoded = '';
  for (const char of text) {
    encoded += codes[char] || '';
  }

  return { encoded, codes, tree: treeString || 'Односимвольное сообщение' };
}

// -------------------- Компонент --------------------
const CompressionMethods = () => {
  const [inputText, setInputText] = useState('AAABBBCCCDDD');
  const [mode, setMode] = useState<'rle' | 'huffman'>('rle');
  const [rleEncoded, setRleEncoded] = useState('');
  const [rleDecoded, setRleDecoded] = useState('');
  const [rleSteps, setRleSteps] = useState<{ char: string; count: number }[]>([]);
  const [huffmanEncoded, setHuffmanEncoded] = useState('');
  const [huffmanCodes, setHuffmanCodes] = useState<Record<string, string>>({});
  const [huffmanTree, setHuffmanTree] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  const handleRleEncode = () => {
    const { encoded, steps } = rleEncode(inputText);
    setRleEncoded(encoded);
    setRleDecoded('');
    setRleSteps(steps);
    setShowSteps(true);
  };

  const handleRleDecode = () => {
    const { decoded, steps } = rleDecode(inputText);
    setRleDecoded(decoded);
    setRleSteps(steps);
    setShowSteps(true);
  };

  const handleHuffmanEncode = () => {
    const { encoded, codes, tree } = huffmanEncode(inputText);
    setHuffmanEncoded(encoded);
    setHuffmanCodes(codes);
    setHuffmanTree(tree);
    setShowSteps(true);
  };

  const clearAll = () => {
    setRleEncoded('');
    setRleDecoded('');
    setRleSteps([]);
    setHuffmanEncoded('');
    setHuffmanCodes({});
    setHuffmanTree('');
    setShowSteps(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Методы сжатия
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Метод сжатия</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('rle')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'rle'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  RLE
                </button>
                <button
                  onClick={() => setMode('huffman')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'huffman'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Хаффман
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Исходный текст</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                placeholder="Введите текст для сжатия"
              />
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Длина: {inputText.length} символов
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {mode === 'rle' ? (
                <>
                  <button
                    onClick={handleRleEncode}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                  >
                    Сжать (RLE)
                  </button>
                  <button
                    onClick={handleRleDecode}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                  >
                    Распаковать (RLE)
                  </button>
                </>
              ) : (
                <button
                  onClick={handleHuffmanEncode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Построить Хаффман
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
              >
                Очистить
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Результат</h4>
            {mode === 'rle' ? (
              <div className="space-y-2">
                {rleEncoded && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Сжатый текст:</div>
                    <div className="font-mono text-sm break-all text-gray-900 dark:text-gray-100">{rleEncoded}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Длина: {rleEncoded.length} символов (экономия: {Math.round((1 - rleEncoded.length / inputText.length) * 100)}%)
                    </div>
                  </div>
                )}
                {rleDecoded && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">Распакованный текст:</div>
                    <div className="font-mono text-sm break-all text-green-700 dark:text-green-300">{rleDecoded}</div>
                  </div>
                )}
                {showSteps && rleSteps.length > 0 && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Пошаговое сжатие:</div>
                    <div className="flex flex-wrap gap-1">
                      {rleSteps.map((step, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono">
                          {step.char}{step.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {huffmanEncoded && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Закодированный текст:</div>
                    <div className="font-mono text-sm break-all text-gray-900 dark:text-gray-100">{huffmanEncoded}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Длина: {huffmanEncoded.length} бит (экономия: {Math.round((1 - huffmanEncoded.length / (inputText.length * 8)) * 100)}%)
                    </div>
                  </div>
                )}
                {Object.keys(huffmanCodes).length > 0 && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Коды Хаффмана:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(huffmanCodes).map(([char, code]) => (
                        <span key={char} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono">
                          {char}: {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {huffmanTree && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Дерево Хаффмана:</div>
                    <div className="font-mono text-xs break-all text-gray-800 dark:text-gray-200">{huffmanTree}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работают методы сжатия?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li><span className="font-medium">RLE (Run-Length Encoding)</span> — заменяет повторяющиеся символы на пару (символ, количество). Эффективен для данных с большим количеством повторений.</li>
          <li><span className="font-medium">Кодирование Хаффмана</span> — строит дерево на основе частот символов, присваивает более короткие коды более частым символам. Используется в JPEG, MP3, ZIP.</li>
          <li>Коэффициент сжатия показывает, насколько уменьшился объём данных.</li>
        </ul>
      </div>
    </div>
  );
};

export default CompressionMethods;