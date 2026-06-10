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
  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      order: body.order,
      xpReward: body.xpReward,
      videoUrl: body.videoUrl,
    },
  });
  return NextResponse.json(lesson);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
