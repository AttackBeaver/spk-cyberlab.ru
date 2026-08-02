import { useState, useMemo, useRef, useEffect } from 'react';

// -------------------- Конфигурация роторов --------------------
const ROTOR_SPECS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};

const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// -------------------- Класс ротора --------------------
class Rotor {
  private wiring: string;
  private notch: string;
  public position: number;
  public ringSetting: number;

  constructor(type: keyof typeof ROTOR_SPECS, position: number = 0, ringSetting: number = 0) {
    this.wiring = ROTOR_SPECS[type].wiring;
    this.notch = ROTOR_SPECS[type].notch;
    this.position = position;
    this.ringSetting = ringSetting;
  }

  forward(input: number): number {
    const offset = (this.position - this.ringSetting + 26) % 26;
    const char = ALPHABET[(input + offset) % 26];
    const outputChar = this.wiring[ALPHABET.indexOf(char)];
    const output = (ALPHABET.indexOf(outputChar) - offset + 26) % 26;
    return output;
  }

  backward(input: number): number {
    const offset = (this.position - this.ringSetting + 26) % 26;
    const char = ALPHABET[(input + offset) % 26];
    const inputChar = ALPHABET[this.wiring.indexOf(char)];
    const output = (ALPHABET.indexOf(inputChar) - offset + 26) % 26;
    return output;
  }

  step(): boolean {
    const currentChar = ALPHABET[this.position];
    const nextPosition = (this.position + 1) % 26;
    this.position = nextPosition;
    return currentChar === this.notch;
  }
}

// -------------------- Класс рефлектора --------------------
class Reflector {
  private wiring: string;
  constructor(wiring: string = REFLECTOR_B) {
    this.wiring = wiring;
  }
  reflect(input: number): number {
    const char = ALPHABET[input];
    const outputChar = this.wiring[ALPHABET.indexOf(char)];
    return ALPHABET.indexOf(outputChar);
  }
}

// -------------------- Класс машины Энигма --------------------
class Enigma {
  private rotors: Rotor[];
  private reflector: Reflector;

  constructor(rotorTypes: (keyof typeof ROTOR_SPECS)[], positions: number[], ringSettings: number[]) {
    this.rotors = rotorTypes.map((type, i) => new Rotor(type, positions[i], ringSettings[i]));
    this.reflector = new Reflector(REFLECTOR_B);
  }

  encryptChar(char: string): { result: string; path: number[] } {
    const input = ALPHABET.indexOf(char.toUpperCase());
    if (input === -1) return { result: char, path: [] };

    let carry = true;
    for (let i = this.rotors.length - 1; i >= 0; i--) {
      if (carry) carry = this.rotors[i].step();
    }

    let signal = input;
    const path = [signal];
    for (const rotor of this.rotors) {
      signal = rotor.forward(signal);
      path.push(signal);
    }
    signal = this.reflector.reflect(signal);
    path.push(signal);
    for (let i = this.rotors.length - 1; i >= 0; i--) {
      signal = this.rotors[i].backward(signal);
      path.push(signal);
    }
    const outputChar = ALPHABET[signal];
    return { result: outputChar, path };
  }

  encrypt(text: string): { result: string; allPaths: number[][] } {
    let result = '';
    const allPaths: number[][] = [];
    for (const char of text) {
      const { result: encChar, path } = this.encryptChar(char);
      result += encChar;
      if (path.length > 0) allPaths.push(path);
    }
    return { result, allPaths };
  }
}

// -------------------- Компонент --------------------
const EnigmaMachine = () => {
  const [plaintext, setPlaintext] = useState('HELLO');
  const [rotorTypes, setRotorTypes] = useState<('I' | 'II' | 'III')[]>(['I', 'II', 'III']);
  const [positions, setPositions] = useState<number[]>([0, 0, 0]);
  const [ringSettings, setRingSettings] = useState<number[]>([0, 0, 0]);
  const [encrypted, setEncrypted] = useState('');
  const [paths, setPaths] = useState<number[][]>([]);
  const [showPath, setShowPath] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const enigma = useMemo(() => {
    return new Enigma(rotorTypes, positions, ringSettings);
  }, [rotorTypes, positions, ringSettings]);

  const handleEncrypt = () => {
    const { result, allPaths } = enigma.encrypt(plaintext);
    setEncrypted(result);
    setPaths(allPaths);
    setCurrentCharIndex(-1);
    setShowPath(true);
  };

  const handleCharHover = (index: number) => {
    setCurrentCharIndex(index);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showPath || paths.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const rotorWidth = 55;
    const rotorGap = 20;
    const totalWidth = rotorWidth * 7 + rotorGap * 6; // 7 блоков: R1, R2, R3, Reflector, R3, R2, R1
    const startX = (w - totalWidth) / 2;
    const centerY = h / 2;

    // Позиции всех блоков
    const positionsX = [];
    for (let i = 0; i < 7; i++) {
      positionsX.push(startX + i * (rotorWidth + rotorGap));
    }

    // Рисуем соединительные линии (без стрелок)
    for (let i = 0; i < positionsX.length - 1; i++) {
      const x1 = positionsX[i] + rotorWidth;
      const x2 = positionsX[i + 1];
      ctx.beginPath();
      ctx.moveTo(x1, centerY);
      ctx.lineTo(x2, centerY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Рисуем блоки
    const labels = ['R1', 'R2', 'R3', 'Ref', 'R3', 'R2', 'R1'];
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#10b981', '#3b82f6', '#f59e0b'];
    for (let i = 0; i < labels.length; i++) {
      const x = positionsX[i];
      const y = centerY - 18;
      ctx.fillStyle = colors[i];
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.fillRect(x, y, rotorWidth, 36);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, rotorWidth, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], x + rotorWidth / 2, y + 18);
    }

    // Если выбран символ и есть путь, рисуем сигнал
    if (currentCharIndex >= 0 && currentCharIndex < paths.length) {
      const path = paths[currentCharIndex];
      // Отображаем только первые 7 значений (путь через роторы и обратно)
      const steps = Math.min(path.length, 7);
      // Рисуем линии с отклонением вверх/вниз
      for (let i = 0; i < steps - 1; i++) {
        const x1 = positionsX[i] + rotorWidth / 2;
        const x2 = positionsX[i + 1] + rotorWidth / 2;
        const y1 = centerY + (i % 2 === 0 ? 25 : -25);
        const y2 = centerY + ((i + 1) % 2 === 0 ? 25 : -25);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // Рисуем точки на пути
      for (let i = 0; i < steps; i++) {
        const x = positionsX[i] + rotorWidth / 2;
        const y = centerY + (i % 2 === 0 ? 25 : -25);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      // Добавляем подпись с символом
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`'${plaintext[currentCharIndex]}'`, positionsX[0] + rotorWidth / 2, centerY - 35);
      ctx.fillText(`'${encrypted[currentCharIndex]}'`, positionsX[6] + rotorWidth / 2, centerY - 35);
    }

    // Легенда
    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Наведите на символ', 10, h - 5);
  }, [paths, currentCharIndex, showPath, plaintext, encrypted]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Машина Энигма — симуляция
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Входной текст</label>
              <input
                type="text"
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Роторы (слева направо)</label>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <select
                    key={idx}
                    value={rotorTypes[idx]}
                    onChange={(e) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const newTypes = [...rotorTypes] as any;
                      newTypes[idx] = e.target.value;
                      setRotorTypes(newTypes);
                    }}
                    className="flex-1 border rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                  </select>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Позиции роторов (0-25)</label>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    min="0"
                    max="25"
                    value={positions[idx]}
                    onChange={(e) => {
                      const newPos = [...positions];
                      newPos[idx] = Number(e.target.value) % 26;
                      setPositions(newPos);
                    }}
                    className="flex-1 border rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Кольцевые установки (0-25)</label>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    min="0"
                    max="25"
                    value={ringSettings[idx]}
                    onChange={(e) => {
                      const newSettings = [...ringSettings];
                      newSettings[idx] = Number(e.target.value) % 26;
                      setRingSettings(newSettings);
                    }}
                    className="flex-1 border rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleEncrypt}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              Зашифровать
            </button>

            {encrypted && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Зашифрованный текст:</div>
                <div className="font-mono text-lg text-gray-900 dark:text-gray-100 break-all">{encrypted}</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Визуализация пути сигнала</h4>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Наведите на символ ниже, чтобы увидеть путь сигнала через роторы и рефлектор.
            </div>
            {paths.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {plaintext.split('').map((ch, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => handleCharHover(idx)}
                    onMouseLeave={() => setCurrentCharIndex(-1)}
                    className={`px-2 py-1 rounded text-sm font-mono transition ${
                      currentCharIndex === idx
                        ? 'bg-amber-200 dark:bg-amber-800 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Как работает машина Энигма?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Каждый ротор содержит подстановочную таблицу и вращается с каждым нажатием клавиши.</li>
          <li>Сигнал проходит через роторы, отражается в рефлекторе и проходит обратно.</li>
          <li>Положение роторов определяет шифр, поэтому ключ зависит от начальной установки.</li>
          <li>Рефлектор делает шифрование симметричным (шифрование и дешифрование одинаковы).</li>
          <li>Визуализация показывает путь сигнала через роторы и рефлектор.</li>
        </ul>
      </div>
    </div>
  );
};

export default EnigmaMachine;