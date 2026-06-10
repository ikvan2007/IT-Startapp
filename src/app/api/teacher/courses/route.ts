import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const courses = await prisma.course.findMany({
    include: { lessons: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { title, description, category, grade, difficulty, xpReward } = body;
  if (!title || !category) {
    return NextResponse.json({ error: "title и category обязательны" }, { status: 400 });
  }
  const course = await prisma.course.create({
    data: {
      title,
      description: description || "",
      category,
      grade: grade != null ? Number(grade) : null,
      difficulty: difficulty || "beginner",
      xpReward: xpReward ?? 100,
      image: body.image || null,
    },
  });
  return NextResponse.json(course);
}
