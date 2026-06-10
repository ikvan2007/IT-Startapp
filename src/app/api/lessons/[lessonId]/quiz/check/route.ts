import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Проверка одного ответа (для пошагового квиза) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const { questionId, answerIndex } = body;
  if (!questionId || answerIndex == null) {
    return NextResponse.json({ error: "questionId и answerIndex обязательны" }, { status: 400 });
  }

  const q = await prisma.quizQuestion.findFirst({
    where: { id: questionId, lessonId },
  });
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const correct = q.correctIndex === Number(answerIndex);
  return NextResponse.json({ correct });
}
