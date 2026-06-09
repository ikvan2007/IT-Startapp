import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [progressList, badges, allBadges] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completed: true },
      include: { lesson: { include: { course: true } } },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    }),
    prisma.badge.findMany({ orderBy: { xpRequired: "asc" } }),
  ]);

  const xpInCurrentLevel = user.xp % 100;
  const progressPercent = Math.min(100, (xpInCurrentLevel / 100) * 100);

  return (
    <ProfileClient
      user={user}
      progressList={progressList}
      badges={badges.map((ub) => ub.badge)}
      allBadges={allBadges}
      progressPercent={progressPercent}
      xpInCurrentLevel={xpInCurrentLevel}
    />
  );
}
