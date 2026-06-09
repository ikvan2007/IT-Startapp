import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, avatar } = body;
  const data: { name?: string; avatar?: string | null } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (avatar !== undefined) data.avatar = typeof avatar === "string" && avatar.trim() ? avatar.trim() : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, avatar: true, xp: true, level: true },
  });
  return NextResponse.json(updated);
}
