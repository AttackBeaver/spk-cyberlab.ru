import Docker from 'dockerode';
import stream from 'stream';

// Конфигурация
const TIMEOUT_MS = 15000; // 15 секунд на выполнение
const MAX_OUTPUT_SIZE = 1024 * 10; // 10 KB
const MEMORY_LIMIT = 128 * 1024 * 1024; // 128 MB
const CPU_LIMIT = 0.5; // 50% одного ядра

// Подключение к Docker (использует сокет по умолчанию или переменную DOCKER_HOST)
const docker = new Docker();

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Запускает код в изолированном Docker-контейнере
 */
const runInContainer = async (
  code: string,
  language: string
): Promise<ExecutionResult> => {
  // Определяем команду и образ в зависимости от языка
  let cmd: string[];
  let imageName: string;

  switch (language.toLowerCase()) {
    case 'python':
      imageName = 'spk-sandbox-python:latest';
      cmd = ['python3', '-c', code];
      break;
    case 'javascript':
    case 'js':
      imageName = 'spk-sandbox-node:latest';
      cmd = ['node', '-e', code];
      break;
    default:
      return {
        success: false,
        output: '',
        error: `Неподдерживаемый язык: "${language}"`,
      };
  }

  // Опции для контейнера
  const containerOptions: Docker.ContainerCreateOptions = {
    Image: imageName,
    Cmd: cmd,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    HostConfig: {
      Memory: MEMORY_LIMIT,
      MemorySwap: MEMORY_LIMIT,
      CpuPeriod: 100000,
      CpuQuota: Math.floor(CPU_LIMIT * 100000),
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      SecurityOpt: ['no-new-privileges:true'],
    },
    WorkingDir: '/app',
  };

  try {
    // Создаём и запускаем контейнер
    const container = await docker.createContainer(containerOptions);
    await container.start();

    // Собираем вывод
    let output = '';
    let error = '';

    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    logStream.on('data', (chunk: Buffer) => {
      const type = chunk[0];
      const data = chunk.slice(8).toString('utf8');
      if (type === 1) {
        output += data;
        if (output.length > MAX_OUTPUT_SIZE) {
          output = output.slice(0, MAX_OUTPUT_SIZE) + '\n... (обрезка вывода)';
          container.stop().catch(() => {});
        }
      } else if (type === 2) {
        error += data;
      }
    });

    // Таймаут выполнения
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        container.stop().catch(() => {});
        reject(new Error('Превышено время выполнения (15 секунд)'));
      }, TIMEOUT_MS);
    });

    // Ожидание завершения контейнера
    const exitPromise = container.wait();

    await Promise.race([exitPromise, timeoutPromise]);

    const exitCode = (await exitPromise).StatusCode;

    if (exitCode === 0) {
      return {
        success: true,
        output: output.trim() || '(вывод пуст)',
      };
    } else {
      return {
        success: false,
        output: output.trim(),
        error: error.trim() || `Код завершился с ошибкой (код ${exitCode})`,
      };
    }
  } catch (err) {
    return {
      success: false,
      output: '',
      error: String(err),
    };
  }
};

/**
 * Выполняет код в изолированной среде (Docker)
 */
export const executeCode = async (code: string, language: string): Promise<ExecutionResult> => {
  return await runInContainer(code, language);
};