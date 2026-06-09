import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);
  const teacherHashed = await bcrypt.hash("Teacher123!", 10);
  await prisma.user.upsert({
    where: { email: "student@edu.ru" },
    update: {},
    create: {
      email: "student@edu.ru",
      password: hashed,
      name: "Тестовый Студент",
      xp: 0,
      level: 1,
    },
  });
  await prisma.user.upsert({
    where: { email: "teacher@edu.ru" },
    update: {},
    create: {
      email: "teacher@edu.ru",
      password: teacherHashed,
      name: "Преподаватель",
      role: "teacher",
    },
  });

  const badgeCount = await prisma.badge.count();
  if (badgeCount === 0) {
    await prisma.badge.createMany({
      data: [
        { name: "Первый шаг", description: "Заверши первый урок", icon: "🎯", xpRequired: 10 },
        { name: "Студент", description: "Набери 100 XP", icon: "📚", xpRequired: 100 },
        { name: "Знаток", description: "Набери 500 XP", icon: "⭐", xpRequired: 500 },
      ],
    });
  }

  const existingCourse = await prisma.course.findFirst();
  if (existingCourse) {
    await addVideoAndQuizToExisting(prisma);
    await addTeacherAndMathIfNeeded(prisma);
    console.log("Courses exist, updated video/quiz, teacher, math");
    return;
  }

  const course1 = await prisma.course.create({
    data: {
      title: "JavaScript с нуля",
      description: "Основы программирования на JavaScript: переменные, функции, DOM.",
      category: "Информатика",
      difficulty: "beginner",
      xpReward: 150,
      image: "🟨",
      lessons: {
        create: [
          { title: "Введение в JS", content: "Что такое JavaScript и зачем он нужен. Подключение скриптов.", order: 0, xpReward: 15, videoUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk" },
          { title: "Переменные и типы", content: "let, const, типы данных: number, string, boolean.", order: 1, xpReward: 15, videoUrl: "https://www.youtube.com/watch?v=2qDywOS7VAc" },
          { title: "Функции", content: "Объявление функций, стрелочные функции, возврат значений.", order: 2, xpReward: 20, videoUrl: "https://www.youtube.com/watch?v=N8ap4k_1QEQ" },
          { title: "Массивы и объекты", content: "Работа с массивами и объектами. Методы map, filter, reduce.", order: 3, xpReward: 25 },
          { title: "DOM и события", content: "Выбор элементов, изменение контента, обработчики событий.", order: 4, xpReward: 25 },
        ],
      },
    },
    include: { lessons: true },
  });

  await addQuizForLesson(prisma, course1.lessons[0].id, [
    { questionText: "Где обычно выполняется JavaScript?", options: ["Только на сервере", "В браузере и на сервере (Node.js)", "Только в браузере", "Нигде"], correctIndex: 1 },
    { questionText: "Как подключить скрипт к HTML?", options: ["<script src=\"file.js\"></script>", "<link href=\"file.js\">", "<js src=\"file.js\">", "<script href=\"file.js\">"], correctIndex: 0 },
    { questionText: "JavaScript нужен для:", options: ["Только стилизации страницы", "Интерактивности и логики на странице", "Только разметки HTML", "Только хранения данных"], correctIndex: 1 },
  ]);
  await addQuizForLesson(prisma, course1.lessons[1].id, [
    { questionText: "Как объявить константу?", options: ["var", "let", "const", "constant"], correctIndex: 2 },
    { questionText: "Тип данных для целых чисел?", options: ["string", "number", "integer", "int"], correctIndex: 1 },
  ]);
  await addQuizForLesson(prisma, course1.lessons[2].id, [
    { questionText: "Стрелочная функция записывается как:", options: ["function () {}", "() => {}", "arrow () {}", "=> function {}"], correctIndex: 1 },
  ]);

  const course2 = await prisma.course.create({
    data: {
      title: "React за неделю",
      description: "Компоненты, хуки, состояние и маршрутизация в React.",
      category: "Информатика",
      difficulty: "intermediate",
      xpReward: 200,
      image: "⚛️",
      lessons: {
        create: [
          { title: "Что такое React", content: "Компонентный подход. JSX и виртуальный DOM.", order: 0, xpReward: 20, videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETpg" },
          { title: "Компоненты", content: "Функциональные компоненты, пропсы, композиция.", order: 1, xpReward: 25, videoUrl: "https://www.youtube.com/watch?v=0ZJgIjIuY7Y" },
          { title: "useState и useEffect", content: "Локальное состояние и побочные эффекты.", order: 2, xpReward: 30 },
          { title: "Роутинг", content: "React Router: страницы и навигация.", order: 3, xpReward: 25 },
        ],
      },
    },
    include: { lessons: true },
  });
  await addQuizForLesson(prisma, course2.lessons[0].id, [
    { questionText: "Что такое React?", options: ["Язык программирования", "Библиотека для UI", "База данных", "ОС"], correctIndex: 1 },
    { questionText: "JSX — это:", options: ["Стили", "Синтаксис для разметки в JS", "Тип данных", "Фреймворк"], correctIndex: 1 },
  ]);
  await addQuizForLesson(prisma, course2.lessons[1].id, [
    { questionText: "Пропсы в React передаются:", options: ["Только вниз по дереву", "Вверх и вниз", "Только глобально", "Не передаются"], correctIndex: 0 },
  ]);

  const course3 = await prisma.course.create({
    data: {
      title: "Английский A2",
      description: "Грамматика и лексика уровня A2: настоящее и прошедшее время.",
      category: "Английский язык",
      difficulty: "beginner",
      xpReward: 120,
      image: "🇬🇧",
      lessons: {
        create: [
          { title: "Present Simple", content: "Утверждения, вопросы, отрицания. Маркеры времени.", order: 0, xpReward: 15 },
          { title: "Past Simple", content: "Правильные и неправильные глаголы. Когда использовать.", order: 1, xpReward: 20 },
          { title: "Словарный запас: работа", content: "Профессии, офис, собеседование.", order: 2, xpReward: 15 },
        ],
      },
    },
    include: { lessons: true },
  });
  await addQuizForLesson(prisma, course3.lessons[0].id, [
    { questionText: "Present Simple используется для:", options: ["Регулярных действий, фактов", "Только прошлого", "Только будущего", "Мгновенных действий"], correctIndex: 0 },
  ]);
  await addQuizForLesson(prisma, course3.lessons[1].id, [
    { questionText: "Past Simple образуется для правильных глаголов:", options: ["have + V3", "V + ed", "will + V", "am + Ving"], correctIndex: 1 },
  ]);

  // Математика 3 класс
  const math3 = await prisma.course.create({
    data: {
      title: "Математика 3 класс",
      description: "Сложение, вычитание, умножение, деление. Таблица умножения.",
      category: "Математика",
      grade: 3,
      difficulty: "beginner",
      xpReward: 100,
      image: "🔢",
      lessons: {
        create: [
          { title: "Таблица умножения", content: "Таблица умножения — основа математики. Умножение на 2, 3, 4, 5. Умножение — это быстрое сложение одинаковых чисел. 3×4=3+3+3+3=12. Учите таблицу постепенно!", order: 0, xpReward: 15, videoUrl: "https://www.youtube.com/watch?v=oT_fD6EoJeE" },
          { title: "Сложение и вычитание в столбик", content: "Письменное сложение и вычитание многозначных чисел.", order: 1, xpReward: 15 },
        ],
      },
    },
    include: { lessons: true },
  });
  await addQuizForLesson(prisma, math3.lessons[0].id, [
    { questionText: "Сколько будет 3 × 4?", options: ["7", "12", "9", "8"], correctIndex: 1 },
    { questionText: "Сколько будет 5 × 5?", options: ["10", "20", "25", "15"], correctIndex: 2 },
  ]);
  await addQuizForLesson(prisma, math3.lessons[1].id, [
    { questionText: "При сложении в столбик числа записывают:", options: ["Слева направо", "Разряд под разрядом", "В произвольном порядке", "Только однозначные"], correctIndex: 1 },
  ]);

  // Математика 11 класс
  const math11 = await prisma.course.create({
    data: {
      title: "Математика 11 класс",
      description: "Производные, интегралы, тригонометрия. Подготовка к ЕГЭ.",
      category: "Математика",
      grade: 11,
      difficulty: "advanced",
      xpReward: 200,
      image: "∫",
      lessons: {
        create: [
          { title: "Производная", content: "Определение, правила дифференцирования.", order: 0, xpReward: 25 },
          { title: "Интеграл", content: "Первообразная, определённый интеграл.", order: 1, xpReward: 30 },
          { title: "Тригонометрия", content: "Синус, косинус, тангенс. Формулы.", order: 2, xpReward: 25 },
        ],
      },
    },
    include: { lessons: true },
  });
  await addQuizForLesson(prisma, math11.lessons[0].id, [
    { questionText: "Производная константы равна:", options: ["Константе", "1", "0", "x"], correctIndex: 2 },
    { questionText: "Производная x² равна:", options: ["x", "2x", "2", "x²"], correctIndex: 1 },
  ]);
  await addQuizForLesson(prisma, math11.lessons[1].id, [
    { questionText: "∫ x dx =", options: ["x²", "x²/2 + C", "x + C", "1"], correctIndex: 1 },
  ]);
  await addQuizForLesson(prisma, math11.lessons[2].id, [
    { questionText: "sin²α + cos²α =", options: ["0", "1", "2", "tg α"], correctIndex: 1 },
  ]);

  await addVideoAndQuizToExisting(prisma);
  await addTeacherAndMathIfNeeded(prisma);
  console.log("Seed done");
}

async function addQuizForLesson(
  prisma: PrismaClient,
  lessonId: string,
  questions: { questionText: string; options: string[]; correctIndex: number }[]
) {
  if (questions.length === 0) return;
  await prisma.quizQuestion.createMany({
    data: questions.map((q) => ({
      lessonId,
      questionText: q.questionText,
      options: JSON.stringify(q.options),
      correctIndex: q.correctIndex,
    })),
  });
}

const QUIZ_BY_LESSON_TITLE: Record<string, { questionText: string; options: string[]; correctIndex: number }[]> = {
  "Введение в JS": [
    { questionText: "Где обычно выполняется JavaScript?", options: ["Только на сервере", "В браузере и на сервере (Node.js)", "Только в браузере", "Нигде"], correctIndex: 1 },
    { questionText: "Как подключить скрипт к HTML?", options: ["<script src=\"file.js\"></script>", "<link href=\"file.js\">", "<js src=\"file.js\">", "<script href=\"file.js\">"], correctIndex: 0 },
    { questionText: "JavaScript нужен для:", options: ["Только стилизации страницы", "Интерактивности и логики на странице", "Только разметки HTML", "Только хранения данных"], correctIndex: 1 },
  ],
  "Переменные и типы": [
    { questionText: "Как объявить константу?", options: ["var", "let", "const", "constant"], correctIndex: 2 },
    { questionText: "Тип данных для целых чисел?", options: ["string", "number", "integer", "int"], correctIndex: 1 },
  ],
  "Функции": [
    { questionText: "Стрелочная функция записывается как:", options: ["function () {}", "() => {}", "arrow () {}", "=> function {}"], correctIndex: 1 },
  ],
  "Что такое React": [
    { questionText: "Что такое React?", options: ["Язык программирования", "Библиотека для UI", "База данных", "ОС"], correctIndex: 1 },
    { questionText: "JSX — это:", options: ["Стили", "Синтаксис для разметки в JS", "Тип данных", "Фреймворк"], correctIndex: 1 },
  ],
  "Компоненты": [
    { questionText: "Пропсы в React передаются:", options: ["Только вниз по дереву", "Вверх и вниз", "Только глобально", "Не передаются"], correctIndex: 0 },
  ],
  "Present Simple": [
    { questionText: "Present Simple используется для:", options: ["Регулярных действий, фактов", "Только прошлого", "Только будущего", "Мгновенных действий"], correctIndex: 0 },
  ],
  "Past Simple": [
    { questionText: "Past Simple образуется для правильных глаголов:", options: ["have + V3", "V + ed", "will + V", "am + Ving"], correctIndex: 1 },
  ],
};

const CATEGORY_UPDATE: Record<string, string> = {
  "Программирование": "Информатика",
  "Frontend": "Информатика",
  "Языки": "Английский язык",
};

async function addVideoAndQuizToExisting(prisma: PrismaClient) {
  const courses = await prisma.course.findMany({ include: { lessons: { orderBy: { order: "asc" } } } });
  const videoByTitle: Record<string, string> = {
    "Введение в JS": "https://www.youtube.com/watch?v=W6NZfCO5SIk",
    "Переменные и типы": "https://www.youtube.com/watch?v=2qDywOS7VAc",
    "Функции": "https://www.youtube.com/watch?v=N8ap4k_1QEQ",
    "Что такое React": "https://www.youtube.com/watch?v=SqcY0GlETpg",
    "Компоненты": "https://www.youtube.com/watch?v=0ZJgIjIuY7Y",
    "Таблица умножения": "https://www.youtube.com/watch?v=oT_fD6EoJeE",
  };
  const contentByTitle: Record<string, string> = {
    "Таблица умножения": `Таблица умножения — основа математики в начальной школе.

Что такое умножение?
Умножение — это быстрое сложение одинаковых чисел. Например: 3 × 4 = 3 + 3 + 3 + 3 = 12.

Таблица умножения на 2:
2 × 1 = 2
2 × 2 = 4
2 × 3 = 6
2 × 4 = 8
2 × 5 = 10

Таблица умножения на 3:
3 × 1 = 3
3 × 2 = 6
3 × 3 = 9
3 × 4 = 12
3 × 5 = 15

Таблица умножения на 4 и 5:
4 × 2 = 8,  4 × 3 = 12,  4 × 4 = 16,  4 × 5 = 20
5 × 2 = 10, 5 × 3 = 15,  5 × 4 = 20,  5 × 5 = 25

Совет: учите таблицу постепенно, повторяйте каждый день!`,
  };
  for (const course of courses) {
    if (CATEGORY_UPDATE[course.category]) {
      await prisma.course.update({ where: { id: course.id }, data: { category: CATEGORY_UPDATE[course.category] } });
    }
    for (const lesson of course.lessons) {
      const url = videoByTitle[lesson.title];
      if (url && !lesson.videoUrl) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { videoUrl: url } });
      }
      const content = contentByTitle[lesson.title];
      if (content && lesson.content.length < 100) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { content } });
      }
      const quizData = QUIZ_BY_LESSON_TITLE[lesson.title];
      if (quizData) {
        const count = await prisma.quizQuestion.count({ where: { lessonId: lesson.id } });
        if (count === 0) {
          await prisma.quizQuestion.createMany({
            data: quizData.map((q) => ({
              lessonId: lesson.id,
              questionText: q.questionText,
              options: JSON.stringify(q.options),
              correctIndex: q.correctIndex,
            })),
          });
        }
      }
    }
  }
}

async function addTeacherAndMathIfNeeded(prisma: PrismaClient) {
  const teacher = await prisma.user.findUnique({ where: { email: "teacher@edu.ru" } });
  if (!teacher) {
    const h = await bcrypt.hash("Teacher123!", 10);
    await prisma.user.create({
      data: { email: "teacher@edu.ru", password: h, name: "Преподаватель", role: "teacher" },
    });
  }
  const mathExists = await prisma.course.findFirst({ where: { category: "Математика", grade: 3 } });
  if (!mathExists) {
    const math3 = await prisma.course.create({
      data: {
        title: "Математика 3 класс",
        description: "Сложение, вычитание, умножение. Таблица умножения.",
        category: "Математика",
        grade: 3,
        difficulty: "beginner",
        xpReward: 100,
        image: "🔢",
        lessons: {
          create: [
            { title: "Таблица умножения", content: "Умножение на 2, 3, 4, 5.", order: 0, xpReward: 15 },
            { title: "Сложение в столбик", content: "Письменное сложение.", order: 1, xpReward: 15 },
          ],
        },
      },
      include: { lessons: true },
    });
    await addQuizForLesson(prisma, math3.lessons[0].id, [
      { questionText: "Сколько будет 3 × 4?", options: ["7", "12", "9", "8"], correctIndex: 1 },
      { questionText: "Сколько будет 5 × 5?", options: ["10", "20", "25", "15"], correctIndex: 2 },
    ]);
    await addQuizForLesson(prisma, math3.lessons[1].id, [
      { questionText: "При сложении в столбик числа записывают:", options: ["Слева направо", "Разряд под разрядом", "В произвольном порядке"], correctIndex: 1 },
    ]);
    const math11 = await prisma.course.create({
      data: {
        title: "Математика 11 класс",
        description: "Производные, интегралы. Подготовка к ЕГЭ.",
        category: "Математика",
        grade: 11,
        difficulty: "advanced",
        xpReward: 200,
        image: "∫",
        lessons: {
          create: [
            { title: "Производная", content: "Определение, правила дифференцирования.", order: 0, xpReward: 25 },
            { title: "Интеграл", content: "Первообразная, определённый интеграл.", order: 1, xpReward: 30 },
          ],
        },
      },
      include: { lessons: true },
    });
    await addQuizForLesson(prisma, math11.lessons[0].id, [
      { questionText: "Производная константы равна:", options: ["Константе", "1", "0", "x"], correctIndex: 2 },
      { questionText: "Производная x² равна:", options: ["x", "2x", "2", "x²"], correctIndex: 1 },
    ]);
    await addQuizForLesson(prisma, math11.lessons[1].id, [
      { questionText: "∫ x dx =", options: ["x²", "x²/2 + C", "x + C", "1"], correctIndex: 1 },
    ]);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
