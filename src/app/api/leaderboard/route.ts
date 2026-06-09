import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      xp: true,
      level: true,
    },
  });
  return NextResponse.json(users);
}
