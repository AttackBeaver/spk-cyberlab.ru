import { useState, useRef, useEffect } from 'react';

// Простая хеш-функция (имитация SHA-256)
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Класс блока
class Block {
  public index: number;
  public timestamp: string;
  public data: string;
  public prevHash: string;
  public hash: string;
  public nonce: number;

  constructor(index: number, data: string, prevHash: string = '0') {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.data = data;
    this.prevHash = prevHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return simpleHash(
      this.index + this.timestamp + this.data + this.prevHash + this.nonce
    );
  }

  mine(difficulty: number): void {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

// -------------------- Компонент --------------------
const BlockchainVisualizer = () => {
  const [chain, setChain] = useState<Block[]>([
    new Block(0, 'Genesis Block', '0')
  ]);
  const [newData, setNewData] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [isMining, setIsMining] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [status, setStatus] = useState('');
  const [miningProgress, setMiningProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showModal, setShowModal] = useState(false);

  const addBlock = () => {
    if (!newData.trim()) return;
    const prevBlock = chain[chain.length - 1];
    const newBlock = new Block(chain.length, newData, prevBlock.hash);
    setChain([...chain, newBlock]);
    setNewData('');
    setStatus(`Блок ${chain.length} создан, требуется майнинг`);
  };

  const mineBlock = (index: number) => {
    const block = chain[index];
    if (!block || isMining) return;
    setIsMining(true);
    setStatus(`Майнинг блока ${index}...`);
    setMiningProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setMiningProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        block.mine(difficulty);
        setChain([...chain]);
        setIsMining(false);
        setStatus(`✅ Блок ${index} добыт! Nonce: ${block.nonce}`);
        setMiningProgress(0);
      }
    }, 100);
  };

  const validateChain = () => {
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const prev = chain[i - 1];
      if (current.prevHash !== prev.hash) {
        setStatus(`❌ Цепочка нарушена на блоке ${i}`);
        return false;
      }
      if (current.hash !== current.calculateHash()) {
        setStatus(`❌ Блок ${i} изменён (хеш не совпадает)`);
        return false;
      }
    }
    setStatus('✅ Цепочка валидна!');
    return true;
  };

  const resetChain = () => {
    setChain([new Block(0, 'Genesis Block', '0')]);
    setNewData('');
    setStatus('Цепочка сброшена');
    setSelectedBlock(null);
    setShowModal(false);
  };

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    setShowModal(true);
  };

  // Рендер Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (chain.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Нет блоков', w / 2, h / 2);
      return;
    }

    const padding = 30;
    const blockWidth = 130;
    const blockHeight = 70;
    const gap = 40;
    const startX = padding;
    const y = (h - blockHeight) / 2;

    // Функция рисования закруглённого прямоугольника без модификации прототипа
    function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    chain.forEach((block, index) => {
      const x = startX + index * (blockWidth + gap);
      if (x + blockWidth > w) return;

      // Стрелка связи
      if (index > 0) {
        const prevX = startX + (index - 1) * (blockWidth + gap) + blockWidth;
        const currX = x;
        ctx.beginPath();
        ctx.moveTo(prevX + 5, y + blockHeight / 2);
        ctx.lineTo(currX - 5, y + blockHeight / 2);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(currX - 10, y + blockHeight / 2 - 6);
        ctx.lineTo(currX - 2, y + blockHeight / 2);
        ctx.lineTo(currX - 10, y + blockHeight / 2 + 6);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(block.prevHash.slice(0, 6) + '...', (prevX + currX) / 2, y - 5);
      }

      // Блок
      const isSelected = selectedBlock?.index === block.index;
      const isGenesis = block.index === 0;
      let fillColor = '#3b82f6';
      if (isGenesis) fillColor = '#8b5cf6';
      if (isSelected) fillColor = '#f59e0b';
      if (isMining && block.index === chain.length - 1) fillColor = '#f97316';

      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = fillColor;
      drawRoundedRect(ctx, x, y, blockWidth, blockHeight, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x, y, blockWidth, blockHeight, 8);
      ctx.stroke();

      // Текст внутри блока
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Блок #${block.index}`, x + blockWidth / 2, y + 6);

      ctx.font = '7px monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Nonce: ${block.nonce}`, x + blockWidth / 2, y + 22);

      ctx.font = '7px sans-serif';
      ctx.fillStyle = '#f1f5f9';
      const displayData = block.data.length > 12 ? block.data.slice(0, 12) + '…' : block.data;
      ctx.fillText(displayData, x + blockWidth / 2, y + 38);

      // Хеш под блоком
      ctx.fillStyle = '#64748b';
      ctx.font = '6px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(block.hash.slice(0, 10) + '…', x + blockWidth / 2, y + blockHeight + 4);
    });
  }, [chain, selectedBlock, isMining]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Блокчейн и криптовалюты — визуализация
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Данные для нового блока</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newData}
                  onChange={(e) => setNewData(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Например: Перевод 10 BTC"
                />
                <button
                  onClick={addBlock}
                  disabled={isMining}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Добавить блок
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Сложность</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">{difficulty}</div>
              </div>
              <button
                onClick={validateChain}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                Проверить цепочку
              </button>
              <button
                onClick={resetChain}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Сбросить
              </button>
            </div>

            {status && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono">
                {status}
              </div>
            )}

            {isMining && (
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-100"
                  style={{ width: `${miningProgress}%` }}
                />
              </div>
            )}

            <div className="text-xs text-gray-400 dark:text-gray-500">
              <span className="font-medium">Инструкция:</span> Добавьте блок, затем нажмите «Майнить» на блоке (кроме генезис). Кликните по блоку для деталей.
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Легенда</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Генезис</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Блок</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Выбран</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Майнинг</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas визуализация */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Цепочка блоков</h4>
        <canvas ref={canvasRef} width={900} height={180} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Каждый блок связан с предыдущим через хеш. Нажмите на блок в списке ниже для деталей.
        </div>
      </div>

      {/* Список блоков */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Список блоков</h4>
        <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto p-2">
          {chain.map((block) => (
            <div
              key={block.index}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                selectedBlock?.index === block.index
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
              onClick={() => handleBlockClick(block)}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Блок #{block.index}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(block.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Данные: <span className="font-mono text-gray-800 dark:text-gray-200">{block.data}</span>
              </div>
              {block.index > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); mineBlock(block.index); }}
                  disabled={isMining}
                  className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium py-1 rounded transition disabled:opacity-50"
                >
                  Майнить
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно для деталей блока */}
      {showModal && selectedBlock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Детали блока #{selectedBlock.index}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm font-mono">
              <div><span className="text-gray-500 dark:text-gray-400">Индекс:</span> {selectedBlock.index}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Данные:</span> {selectedBlock.data}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Время:</span> {selectedBlock.timestamp}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Хеш:</span> <span className="text-amber-600 dark:text-amber-400 break-all">{selectedBlock.hash}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400">Пред. хеш:</span> <span className="text-blue-600 dark:text-blue-400 break-all">{selectedBlock.prevHash}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400">Nonce:</span> <span className="text-green-600 dark:text-green-400">{selectedBlock.nonce}</span></div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVisualizer;