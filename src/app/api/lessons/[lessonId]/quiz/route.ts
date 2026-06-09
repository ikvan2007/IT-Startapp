import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { id: "asc" },
    });
    const list = questions.map((q) => {
      let options: string[] = [];
      try {
        options = typeof q.options === "string" ? (JSON.parse(q.options) as string[]) : [];
      } catch {
        options = [];
      }
      return { id: q.id, questionText: q.questionText, options };
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("Quiz GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const answers = (body.answers as number[]) ?? [];

  const questions = await prisma.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { id: "asc" },
  });

  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct++;
  });

  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return NextResponse.json({
    correct,
    total,
    score,
    passed: correct === total,
  });
}
