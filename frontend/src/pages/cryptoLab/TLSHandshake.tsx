import { useState } from 'react';

interface Step {
  id: number;
  from: string;
  to: string;
  message: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, from: 'Клиент', to: 'Сервер', message: 'ClientHello', description: 'Клиент предлагает поддерживаемые версии TLS, шифры и случайное число' },
  { id: 2, from: 'Сервер', to: 'Клиент', message: 'ServerHello', description: 'Сервер выбирает версию TLS, шифр и отправляет своё случайное число' },
  { id: 3, from: 'Сервер', to: 'Клиент', message: 'Certificate', description: 'Сервер отправляет свой цифровой сертификат (с публичным ключом)' },
  { id: 4, from: 'Сервер', to: 'Клиент', message: 'ServerHelloDone', description: 'Сервер сообщает, что завершил начальную фазу' },
  { id: 5, from: 'Клиент', to: 'Сервер', message: 'ClientKeyExchange', description: 'Клиент генерирует Pre-Master Secret, шифрует публичным ключом сервера и отправляет' },
  { id: 6, from: 'Клиент', to: 'Сервер', message: 'ChangeCipherSpec', description: 'Клиент сообщает, что переключается на шифрование' },
  { id: 7, from: 'Клиент', to: 'Сервер', message: 'Finished', description: 'Клиент отправляет зашифрованное сообщение о завершении' },
  { id: 8, from: 'Сервер', to: 'Клиент', message: 'ChangeCipherSpec', description: 'Сервер переключается на шифрование' },
  { id: 9, from: 'Сервер', to: 'Клиент', message: 'Finished', description: 'Сервер отправляет зашифрованное сообщение о завершении' },
];

const TLSHandshake = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const playAll = () => {
    setIsPlaying(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCurrentStep(i);
      if (i >= steps.length - 1) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          SSL/TLS — рукопожатие (Handshake)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Шаг {currentStep + 1} из {steps.length}</label>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {currentStep < steps.length && (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{steps[currentStep].from}</span>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{steps[currentStep].to}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                    {steps[currentStep].message}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                  {steps[currentStep].description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Вперёд
              </button>
              <button
                onClick={playAll}
                disabled={isPlaying || currentStep === steps.length - 1}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isPlaying ? 'Воспроизведение...' : '▶ Воспроизвести все'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Сброс
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Схема рукопожатия</h4>
            <div className="relative p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-stretch min-h-[280px]">
                {/* Клиент */}
                <div className="flex flex-col items-center justify-center w-20">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border-2 border-blue-400 dark:border-blue-600">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Клиент</span>
                  </div>
                </div>

                {/* Сообщения */}
                <div className="flex-1 flex flex-col justify-center px-2 space-y-1">
                  {steps.slice(0, Math.min(currentStep + 1, steps.length)).map((step) => {
                    const isFromClient = step.from === 'Клиент';
                    return (
                      <div
                        key={step.id}
                        className={`flex ${isFromClient ? 'justify-start' : 'justify-end'} transition-all duration-300`}
                      >
                        <div className={`px-2 py-1 rounded text-xs font-mono max-w-[80%] truncate ${isFromClient ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'}`}>
                          {step.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Сервер */}
                <div className="flex flex-col items-center justify-center w-20">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center border-2 border-green-400 dark:border-green-600">
                    <span className="text-xs font-bold text-green-700 dark:text-green-300">Сервер</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Что такое SSL/TLS?</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Протокол шифрования для безопасной передачи данных по сети.</li>
          <li>Использует асимметричное шифрование для обмена ключами и симметричное для данных.</li>
          <li>Рукопожатие (Handshake) — установление защищённого соединения.</li>
          <li>Включает аутентификацию сервера (и опционально клиента) через сертификаты.</li>
          <li>Используется в HTTPS, защищая веб-трафик.</li>
        </ul>
      </div>
    </div>
  );
};

export default TLSHandshake;