import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: lessonId } = await params;
  const body = await req.json();
  const { questionText, options, correctIndex } = body;
  if (!questionText || !Array.isArray(options) || correctIndex == null) {
    return NextResponse.json({ error: "questionText, options[], correctIndex обязательны" }, { status: 400 });
  }
  const q = await prisma.quizQuestion.create({
    data: {
      lessonId,
      questionText,
      options: JSON.stringify(options),
      correctIndex: Number(correctIndex),
    },
  });
  return NextResponse.json(q);
}
