// src/lib/courses.ts
import { prisma } from './db'

export async function getCourses(category?: string, grade?: number | null) {
  const where: { category?: string; grade?: number | null } = {}
  if (category) where.category = category
  if (grade != null) where.grade = grade
  return prisma.course.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { lessons: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCourse(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
}
