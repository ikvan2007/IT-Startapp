import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: courseId } = await params;
  const body = await req.json();
  const { title, content, order, xpReward, videoUrl } = body;
  if (!title) return NextResponse.json({ error: "title обязателен" }, { status: 400 });
  const maxOrder = await prisma.lesson.aggregate({
    where: { courseId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;
  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title,
      content: content || "",
      order: order ?? nextOrder,
      xpReward: xpReward ?? 10,
      videoUrl: videoUrl || null,
    },
  });
  return NextResponse.json(lesson);
}
