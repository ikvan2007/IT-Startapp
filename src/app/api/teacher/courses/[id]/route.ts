import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" }, include: { quiz: true } } },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const course = await prisma.course.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      grade: body.grade != null ? Number(body.grade) : null,
      difficulty: body.difficulty,
      xpReward: body.xpReward,
    },
  });
  return NextResponse.json(course);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
