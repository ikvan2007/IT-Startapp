// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Пользователи ──────────────────────────────────────────────────────
  const studentHash = await bcrypt.hash('password123', 10)
  const teacherHash = await bcrypt.hash('Teacher123!', 10)

  const student = await prisma.user.upsert({
    where: { email: 'student@edu.ru' },
    update: {},
    create: {
      email: 'student@edu.ru',
      passwordHash: studentHash,
      name: 'Иван Студентов',
      role: 'student',
      xp: 150,
      level: 2,
    },
  })

  await prisma.user.upsert({
    where: { email: 'teacher@edu.ru' },
    update: {},
    create: {
      email: 'teacher@edu.ru',
      passwordHash: teacherHash,
      name: 'Анна Преподавателева',
      role: 'teacher',
      xp: 500,
      level: 6,
    },
  })

  // ── Значки ────────────────────────────────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Новичок', description: 'Набрал 10 XP', icon: '🌱', xpThreshold: 10 },
    }),
    prisma.badge.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Ученик', description: 'Набрал 100 XP', icon: '📚', xpThreshold: 100 },
    }),
    prisma.badge.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'Знаток', description: 'Набрал 500 XP', icon: '🏆', xpThreshold: 500 },
    }),
  ])

  // Выдать студенту значки (у него 150 XP → первые два)
  for (const badge of badges.filter((b) => b.xpThreshold <= student.xp)) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: student.id, badgeId: badge.id } },
      update: {},
      create: { userId: student.id, badgeId: badge.id },
    })
  }

  // ── Курсы и уроки ─────────────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Основы математики',
      description: 'Арифметика, алгебра и базовая геометрия для 5–6 классов',
      subject: 'Математика',
      grade: 5,
      difficulty: 'easy',
      xpReward: 50,
      lessons: {
        create: [
          {
            title: 'Натуральные числа',
            content: 'Натуральные числа — это числа, используемые для счёта: 1, 2, 3...',
            order: 1,
            xpReward: 10,
            questions: {
              create: [
                {
                  text: 'Какое наименьшее натуральное число?',
                  options: JSON.stringify(['0', '1', '-1', '0.5']),
                  correctAnswer: 1,
                },
              ],
            },
          },
          {
            title: 'Дроби',
            content: 'Дробь — это часть целого. Числитель — верхняя часть, знаменатель — нижняя.',
            order: 2,
            xpReward: 10,
          },
          {
            title: 'Уравнения',
            content: 'Уравнение — это равенство, содержащее переменную. Решить уравнение — найти x.',
            order: 3,
            xpReward: 15,
          },
        ],
      },
    },
  })

  const course2 = await prisma.course.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Введение в физику',
      description: 'Механика, термодинамика и оптика для 7 класса',
      subject: 'Физика',
      grade: 7,
      difficulty: 'medium',
      xpReward: 75,
      lessons: {
        create: [
          {
            title: 'Что такое физика',
            content: 'Физика — наука о природе. Изучает материю, энергию и их взаимодействие.',
            order: 1,
            xpReward: 10,
          },
          {
            title: 'Законы Ньютона',
            content: 'Первый закон: тело покоится или движется равномерно, если сила не приложена.',
            order: 2,
            xpReward: 20,
          },
        ],
      },
    },
  })

  // Прогресс студента — первый урок первого курса пройден
  const lesson1 = await prisma.lesson.findFirst({ where: { courseId: course1.id, order: 1 } })
  if (lesson1) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lesson1.id } },
      update: {},
      create: { userId: student.id, lessonId: lesson1.id, completed: true, completedAt: new Date() },
    })
  }

  console.log('✅ Seed завершён!')
  console.log(`   Курсов: 2 (${course1.title}, ${course2.title})`)
  console.log(`   Пользователей: 2 (student@edu.ru, teacher@edu.ru)`)
  console.log(`   Значков: ${badges.length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
