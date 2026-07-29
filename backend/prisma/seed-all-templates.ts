import { PrismaClient, SandboxTaskType } from '@prisma/client';

const prisma = new PrismaClient();

type TemplateData = {
  name: string;
  description: string;
  type: SandboxTaskType;
  configSchema: Record<string, unknown>;
  defaultConfig: Record<string, unknown>;
  previewHtml: string;
};

const templates: TemplateData[] = [
  // ===== XSS =====
  {
    name: 'XSS: Комментарии в блоге',
    description: 'Макет блога с формой добавления комментария, уязвимой к XSS-атаке через тег <script>',
    type: 'XSS',
    configSchema: {
      targetField: 'comment',
      vulnerablePage: '/blog/post/1',
    },
    defaultConfig: {
      targetField: 'comment',
      vulnerablePage: '/blog/post/1',
      expectedResult: '<script>alert("XSS")</script>',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Блог: Моя первая статья</h2>
        <p>Это пример уязвимого блога. Попробуйте добавить комментарий с XSS-атакой.</p>
        <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <strong>Комментарии:</strong>
          <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
            <p><strong>Пользователь:</strong> Отличная статья!</p>
          </div>
        </div>
        <form style="margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 4px;">
          <label style="display: block; margin-bottom: 5px;">Ваш комментарий:</label>
          <textarea name="comment" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
          <button type="submit" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">Отправить</button>
        </form>
      </div>
    `,
  },
  {
    name: 'XSS: Рефлексивный XSS (URL-параметр)',
    description: 'Макет страницы, которая отражает значение параметра URL без экранирования',
    type: 'XSS',
    configSchema: {
      targetParam: 'name',
      vulnerableUrl: '/greeting?name=John',
    },
    defaultConfig: {
      targetParam: 'name',
      vulnerableUrl: '/greeting?name=John',
      expectedResult: '<script>alert("XSS")</script>',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Приветствие</h2>
        <p>Привет, <span id="username" style="color: blue; font-weight: bold;">John</span>!</p>
        <p style="font-size: 14px; color: #666;">Попробуйте изменить параметр name в URL, чтобы выполнить XSS-атаку.</p>
        <p style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">URL: /greeting?name=John</p>
      </div>
    `,
  },

  // ===== PHISHING =====
  {
    name: 'Фишинг: Поддельная страница входа в банк',
    description: 'Макет поддельной страницы входа в банк, которая запрашивает логин и пароль',
    type: 'PHISHING',
    configSchema: {
      targetUrl: 'https://fake-bank.com/login',
      redirectUrl: 'https://real-bank.com/login',
      emailSubject: 'Ваш банковский аккаунт заблокирован',
    },
    defaultConfig: {
      targetUrl: 'https://fake-bank.com/login',
      redirectUrl: 'https://real-bank.com/login',
      emailSubject: 'Ваш банковский аккаунт заблокирован',
      expectedResult: 'Пароль передан злоумышленникам',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #d32f2f;">⚠️ Ваш аккаунт заблокирован</h2>
          <p style="color: #666;">В целях безопасности подтвердите свои данные</p>
        </div>
        <form style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Логин:</label>
            <input type="text" name="username" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Пароль:</label>
            <input type="password" name="password" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <button type="submit" style="width: 100%; padding: 10px; background: #d32f2f; color: white; border: none; border-radius: 4px; font-size: 16px;">Войти</button>
        </form>
        <p style="font-size: 12px; color: #999; margin-top: 15px; text-align: center;">Вы будете перенаправлены на страницу входа банка после подтверждения</p>
      </div>
    `,
  },
  {
    name: 'Фишинг: Поддельное письмо от службы поддержки',
    description: 'Макет письма, имитирующего запрос от службы поддержки с просьбой перейти по ссылке',
    type: 'PHISHING',
    configSchema: {
      senderEmail: 'support@fake-support.com',
      redirectUrl: 'https://fake-site.com/reset-password',
      emailSubject: 'Сброс пароля',
    },
    defaultConfig: {
      senderEmail: 'support@fake-support.com',
      redirectUrl: 'https://fake-site.com/reset-password',
      emailSubject: 'Сброс пароля',
      expectedResult: 'Пользователь перешёл по фишинговой ссылке',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
        <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #333;">📧 Письмо от службы поддержки</h3>
        </div>
        <div style="padding: 10px 0;">
          <p><strong>От:</strong> support@fake-support.com</p>
          <p><strong>Тема:</strong> Сброс пароля</p>
          <hr />
          <p>Здравствуйте,</p>
          <p>Мы получили запрос на сброс пароля для вашей учётной записи. Для завершения процедуры перейдите по ссылке ниже:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="#" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Сбросить пароль</a>
          </p>
          <p style="font-size: 12px; color: #999;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          <p style="font-size: 12px; color: #999;">С уважением, служба поддержки.</p>
        </div>
      </div>
    `,
  },
  {
    name: 'Фишинг: Поддельная страница входа в социальную сеть',
    description: 'Макет поддельной страницы входа в популярную социальную сеть',
    type: 'PHISHING',
    configSchema: {
      targetUrl: 'https://fake-social.com/login',
      redirectUrl: 'https://real-social.com/login',
    },
    defaultConfig: {
      targetUrl: 'https://fake-social.com/login',
      redirectUrl: 'https://real-social.com/login',
      expectedResult: 'Введены логин и пароль на фейковой странице',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center;">
          <h2 style="color: #1877f2;">📱 Социальная сеть</h2>
          <p style="color: #666;">Войдите, чтобы продолжить</p>
        </div>
        <form style="margin-top: 20px;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Логин или email:</label>
            <input type="text" name="username" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Пароль:</label>
            <input type="password" name="password" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
          <button type="submit" style="width: 100%; padding: 10px; background: #1877f2; color: white; border: none; border-radius: 4px; font-size: 16px;">Войти</button>
        </form>
        <p style="font-size: 12px; color: #999; margin-top: 15px; text-align: center;">Это поддельная страница! Не вводите реальные данные.</p>
      </div>
    `,
  },

  // ===== SQL INJECTION =====
  {
    name: 'SQL Injection: Поиск (OR 1=1)',
    description: 'Макет сайта с поисковой строкой, уязвимой к SQL-инъекции через OR 1=1',
    type: 'SQL_INJECTION',
    configSchema: {
      searchField: 'query',
      table: 'products',
    },
    defaultConfig: {
      searchField: 'query',
      table: 'products',
      expectedResult: "' OR 1=1 --",
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Поиск товаров</h2>
        <p>Введите название товара для поиска:</p>
        <form style="margin-top: 20px;">
          <input type="text" name="query" placeholder="Введите запрос..." style="width: 70%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
          <button type="submit" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px;">Найти</button>
        </form>
        <p style="font-size: 12px; color: #999; margin-top: 15px;">Подсказка: попробуйте ввести <code>' OR 1=1 --</code></p>
      </div>
    `,
  },
  {
    name: 'SQL Injection: Аутентификация (admin\' --)',
    description: 'Форма входа, уязвимая к SQL-инъекции через admin\' --',
    type: 'SQL_INJECTION',
    configSchema: {
      usernameField: 'username',
      passwordField: 'password',
    },
    defaultConfig: {
      usernameField: 'username',
      passwordField: 'password',
      expectedResult: "admin' --",
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="text-align: center;">Вход в систему</h2>
        <form style="margin-top: 20px;">
          <div style="margin-bottom: 15px;">
            <label>Логин:</label>
            <input type="text" name="username" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <div style="margin-bottom: 15px;">
            <label>Пароль:</label>
            <input type="password" name="password" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
          <button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px;">Войти</button>
        </form>
        <p style="font-size: 12px; color: #999; margin-top: 15px; text-align: center;">Подсказка: попробуйте <code>admin' --</code></p>
      </div>
    `,
  },
  {
    name: 'SQL Injection: UNION SELECT',
    description: 'Уязвимость UNION SELECT для извлечения данных из другой таблицы',
    type: 'SQL_INJECTION',
    configSchema: {
      vulnerableParam: 'id',
      table: 'users',
    },
    defaultConfig: {
      vulnerableParam: 'id',
      table: 'users',
      expectedResult: "1 UNION SELECT username, password FROM users",
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Просмотр профиля</h2>
        <p>Введите ID пользователя:</p>
        <form style="margin-top: 20px;">
          <input type="text" name="id" placeholder="1" style="width: 70%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
          <button type="submit" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 4px;">Показать</button>
        </form>
        <p style="font-size: 12px; color: #999; margin-top: 15px;">Подсказка: попробуйте <code>1 UNION SELECT username, password FROM users</code></p>
      </div>
    `,
  },

  // ===== DATABASE =====
  {
    name: 'База данных: SELECT простой',
    description: 'Задание на написание SELECT-запроса для выборки данных',
    type: 'DATABASE',
    configSchema: {
      schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);',
      data: { users: [{ id: 1, name: 'Alice', age: 25 }, { id: 2, name: 'Bob', age: 30 }] },
    },
    defaultConfig: {
      schema: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);',
      data: { users: [{ id: 1, name: 'Alice', age: 25 }, { id: 2, name: 'Bob', age: 30 }] },
      expectedResult: 'SELECT * FROM users WHERE age > 25',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>База данных: SELECT</h2>
        <p>Таблица <code>users</code>: id, name, age</p>
        <p style="color: #28a745;">Данные: Alice (25), Bob (30)</p>
        <p>Напишите запрос, который выберет всех пользователей старше 25 лет.</p>
        <p style="font-size: 12px; color: #999;">Подсказка: используйте <code>WHERE age > 25</code></p>
      </div>
    `,
  },
  {
    name: 'База данных: JOIN',
    description: 'Задание на написание JOIN-запроса для объединения двух таблиц',
    type: 'DATABASE',
    configSchema: {
      schema: 'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product TEXT); CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);',
      data: {
        users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
        orders: [{ id: 1, user_id: 1, product: 'Laptop' }, { id: 2, user_id: 2, product: 'Phone' }],
      },
    },
    defaultConfig: {
      schema: 'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product TEXT); CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);',
      data: {
        users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
        orders: [{ id: 1, user_id: 1, product: 'Laptop' }, { id: 2, user_id: 2, product: 'Phone' }],
      },
      expectedResult: 'SELECT users.name, orders.product FROM users JOIN orders ON users.id = orders.user_id',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>База данных: JOIN</h2>
        <p>Таблицы: <code>users</code> (id, name) и <code>orders</code> (id, user_id, product)</p>
        <p>Напишите запрос, который выведет имя пользователя и его заказы.</p>
        <p style="font-size: 12px; color: #999;">Подсказка: используйте <code>JOIN</code></p>
      </div>
    `,
  },
  {
    name: 'База данных: GROUP BY',
    description: 'Задание на написание GROUP BY-запроса для агрегации данных',
    type: 'DATABASE',
    configSchema: {
      schema: 'CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, amount INTEGER);',
      data: {
        sales: [
          { id: 1, product: 'Laptop', amount: 100 },
          { id: 2, product: 'Phone', amount: 50 },
          { id: 3, product: 'Laptop', amount: 200 },
        ],
      },
    },
    defaultConfig: {
      schema: 'CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, amount INTEGER);',
      data: {
        sales: [
          { id: 1, product: 'Laptop', amount: 100 },
          { id: 2, product: 'Phone', amount: 50 },
          { id: 3, product: 'Laptop', amount: 200 },
        ],
      },
      expectedResult: 'SELECT product, SUM(amount) FROM sales GROUP BY product',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>База данных: GROUP BY</h2>
        <p>Таблица <code>sales</code>: id, product, amount</p>
        <p>Напишите запрос, который покажет общую сумму продаж по каждому товару.</p>
        <p style="font-size: 12px; color: #999;">Подсказка: используйте <code>GROUP BY</code> и <code>SUM</code></p>
      </div>
    `,
  },

  // ===== CODE (Python) =====
  {
    name: 'Программирование: Python (сумма чисел)',
    description: 'Задача на написание Python-функции, которая суммирует два числа',
    type: 'CODE',
    configSchema: {
      language: 'python',
      testCases: [{ input: '2 3', output: '5' }],
    },
    defaultConfig: {
      language: 'python',
      testCases: [{ input: '2 3', output: '5' }],
      expectedResult: '5',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Программирование: Python</h2>
        <p>Напишите программу, которая считывает два числа через пробел и выводит их сумму.</p>
        <p>Пример ввода: <code>2 3</code></p>
        <p>Ожидаемый вывод: <code>5</code></p>
      </div>
    `,
  },
  {
    name: 'Программирование: Python (факториал)',
    description: 'Задача на написание Python-функции для вычисления факториала числа',
    type: 'CODE',
    configSchema: {
      language: 'python',
      testCases: [{ input: '5', output: '120' }],
    },
    defaultConfig: {
      language: 'python',
      testCases: [{ input: '5', output: '120' }],
      expectedResult: '120',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Программирование: Python (факториал)</h2>
        <p>Напишите программу, которая вычисляет факториал введённого числа.</p>
        <p>Пример ввода: <code>5</code></p>
        <p>Ожидаемый вывод: <code>120</code></p>
      </div>
    `,
  },
  {
    name: 'Программирование: JavaScript (сумма чисел)',
    description: 'Задача на написание JavaScript-функции, которая суммирует два числа',
    type: 'CODE',
    configSchema: {
      language: 'javascript',
      testCases: [{ input: '2 3', output: '5' }],
    },
    defaultConfig: {
      language: 'javascript',
      testCases: [{ input: '2 3', output: '5' }],
      expectedResult: '5',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Программирование: JavaScript</h2>
        <p>Напишите программу, которая считывает два числа через пробел и выводит их сумму.</p>
        <p>Пример ввода: <code>2 3</code></p>
        <p>Ожидаемый вывод: <code>5</code></p>
      </div>
    `,
  },

  // ===== CUSTOM (дополнительные) =====
  {
    name: 'Кастомное: Расшифровка шифра Цезаря',
    description: 'Задание на расшифровку текста, зашифрованного шифром Цезаря',
    type: 'CUSTOM',
    configSchema: {
      cipherText: 'Khoor Zruog',
      shift: 3,
    },
    defaultConfig: {
      cipherText: 'Khoor Zruog',
      shift: 3,
      expectedResult: 'Hello World',
    },
    previewHtml: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Кастомное задание: Шифр Цезаря</h2>
        <p>Расшифруйте текст <strong>"Khoor Zruog"</strong>, используя сдвиг 3.</p>
        <p style="font-size: 12px; color: #999;">Подсказка: используйте <code>Ожидаемый результат</code> для проверки.</p>
      </div>
    `,
  },
];

async function main() {
  console.log('🌱 Заполнение всех шаблонов...');
  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    const existing = await prisma.sandboxTemplate.findFirst({
      where: { name: template.name },
    });
    if (!existing) {
      await prisma.sandboxTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          type: template.type,
          configSchema: template.configSchema as any,
          defaultConfig: template.defaultConfig as any,
          previewHtml: template.previewHtml,
        },
      });
      console.log(`✅ Создан шаблон: ${template.name}`);
      created++;
    } else {
      console.log(`⚠️ Шаблон уже существует: ${template.name}`);
      skipped++;
    }
  }

  console.log(`✅ Заполнение завершено. Создано: ${created}, пропущено: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());