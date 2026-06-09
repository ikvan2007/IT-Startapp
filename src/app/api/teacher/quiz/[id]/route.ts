import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { questionText, options, correctIndex } = body;
  const data: { questionText?: string; options?: string; correctIndex?: number } = {};
  if (questionText != null) data.questionText = questionText;
  if (Array.isArray(options)) data.options = JSON.stringify(options);
  if (correctIndex != null) data.correctIndex = Number(correctIndex);
  const q = await prisma.quizQuestion.update({
    where: { id },
    data,
  });
  return NextResponse.json(q);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.quizQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
