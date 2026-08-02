import { useState } from 'react';
import Layout from '../../components/Layout';
import {
  KeyIcon,
  CalculatorIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ArrowsRightLeftIcon,
  FingerPrintIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

// Импорт всех компонентов алгоритмов
import MathBasics from './MathBasics';
import CaesarCipher from './CaesarCipher';
import VigenereCipher from './VigenereCipher';
import RSAVisualizer from './RSAVisualizer';
import PRNG from './PRNG';
import DiffieHellman from './DiffieHellman';
import DigitalSignature from './DigitalSignature';
import HashFunctions from './HashFunctions';
import StreamCipherCryptoanalysis from './StreamCipherCryptoanalysis';
import PolybiusSquare from './PolibiusSquare';
import TrithemiusCipher from './TrithemiusCipher';
import EncodingTools from './EncodingTools';
import GronsfeldCipher from './GronsfeldCipher';
import VernamCipher from './VernamCipher';
import FeistelNetwork from './FeistelNetwork';
import ElGamalCipher from './ElGamalCipher';
import BlockCipherModes from './BlockCipherModes';
import AES from './AES';
import RSACryptoanalysis from './RSACryptoanalysis';
import EnigmaMachine from './EnigmaMachine';
import BlockchainVisualizer from './BlockchainVisualizer';
import AtbashCipher from './AtbashCipher';
import MagicSquare from './MagicSquare';
import Steganography from './Steganography';
import CompressionMethods from './CompressionMethods';
import TLSHandshake from './TLSHandshake';
import DESVisualizer from './DESVisualizer';
import GOST28147 from './GOST28147';
import MasonicCipher from './MasonicCipher';
import FrequencyAnalysis from './FrequencyAnalysis';

// Добавляем 'blockchain' в тип SectionId
type SectionId =
  | 'math'
  | 'classical'
  | 'modern'
  | 'protocols'
  | 'hash'
  | 'cryptanalysis'
  | 'encoding'
  | 'blockchain';

interface SubTab {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface Section {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  subTabs: SubTab[];
}

const sections: Section[] = [
  {
    id: 'math',
    label: 'Математические основы',
    icon: <CalculatorIcon className="w-5 h-5" />,
    subTabs: [{ id: 'math', label: 'Все основы', component: <MathBasics /> }],
  },
  {
    id: 'classical',
    label: 'Классические шифры',
    icon: <LockClosedIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'caesar', label: 'Шифр Цезаря', component: <CaesarCipher /> },
      { id: 'vigenere', label: 'Шифр Виженера', component: <VigenereCipher /> },
      { id: 'polybius', label: 'Полибианский квадрат', component: <PolybiusSquare /> },
      { id: 'trithemius', label: 'Шифр Трисимуса', component: <TrithemiusCipher /> },
      { id: 'gronsfeld', label: 'Шифр Гронсфельда', component: <GronsfeldCipher /> },
      { id: 'vernam', label: 'Шифр Вернама', component: <VernamCipher /> },
      { id: 'enigma', label: 'Машина Энигма', component: <EnigmaMachine /> },
      { id: 'atbash', label: 'Шифр Атбаш', component: <AtbashCipher /> },
      { id: 'magic', label: 'Магический квадрат', component: <MagicSquare /> },
      { id: 'masonic', label: 'Шифр масонов', component: <MasonicCipher /> },
    ],
  },
  {
    id: 'modern',
    label: 'Современные алгоритмы',
    icon: <RocketLaunchIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'rsa', label: 'RSA', component: <RSAVisualizer /> },
      { id: 'prng', label: 'ГПСЧ', component: <PRNG /> },
      { id: 'feistel', label: 'Сеть Фейстеля', component: <FeistelNetwork /> },
      { id: 'elgamal', label: 'Эль-Гамаль', component: <ElGamalCipher /> },
      { id: 'modes', label: 'Режимы ECB / CBC', component: <BlockCipherModes /> },
      { id: 'aes', label: 'AES-128', component: <AES /> },
      { id: 'des', label: 'DES', component: <DESVisualizer /> },
      { id: 'gost', label: 'ГОСТ 28147-89', component: <GOST28147 /> },
    ],
  },
  {
    id: 'protocols',
    label: 'Протоколы',
    icon: <ArrowsRightLeftIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'diffie', label: 'Diffie-Hellman', component: <DiffieHellman /> },
      { id: 'signature', label: 'Электронная подпись', component: <DigitalSignature /> },
      { id: 'tls', label: 'SSL/TLS Рукопожатие', component: <TLSHandshake /> },
    ],
  },
  {
    id: 'hash',
    label: 'Хеш-функции',
    icon: <FingerPrintIcon className="w-5 h-5" />,
    subTabs: [{ id: 'hash', label: 'Генерация хешей', component: <HashFunctions /> }],
  },
  {
    id: 'cryptanalysis',
    label: 'Криптоанализ',
    icon: <MagnifyingGlassIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'stream', label: 'Поточный шифр (повтор ключа)', component: <StreamCipherCryptoanalysis /> },
      { id: 'rsa-crack', label: 'Криптоанализ RSA', component: <RSACryptoanalysis /> },
      { id: 'frequency', label: 'Частотный анализ', component: <FrequencyAnalysis /> },
    ],
  },
  {
    id: 'encoding',
    label: 'Кодирование и сжатие',
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'encoding', label: 'Base64 / ASCII / CRC32', component: <EncodingTools /> },
      { id: 'steganography', label: 'Стеганография (LSB)', component: <Steganography /> },
      { id: 'compression', label: 'Методы сжатия (RLE, Хаффман)', component: <CompressionMethods /> },
    ],
  },
  {
    id: 'blockchain',
    label: 'Блокчейн и криптовалюты',
    icon: <LinkIcon className="w-5 h-5" />,
    subTabs: [
      { id: 'blockchain', label: 'Визуализация блокчейна', component: <BlockchainVisualizer /> },
    ],
  },
];

const CryptoLab = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('math');
  const [activeSubTab, setActiveSubTab] = useState<string>('math');

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const section = sections.find((s) => s.id === sectionId);
    if (section && section.subTabs.length > 0) {
      setActiveSubTab(section.subTabs[0].id);
    }
  };

  const currentSection = sections.find((s) => s.id === activeSection);
  const currentSubTab = currentSection?.subTabs.find((t) => t.id === activeSubTab);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <KeyIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            Криптолаборатория
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            );
          })}
        </div>

        {currentSection && currentSection.subTabs.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-4 pb-2 pl-2">
            {currentSection.subTabs.map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActiveSubTab(subTab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSubTab === subTab.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          {currentSubTab ? (
            currentSubTab.component
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Выберите алгоритм
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CryptoLab;