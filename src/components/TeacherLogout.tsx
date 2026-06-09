"use client";

import { useRouter } from "next/navigation";

export default function TeacherLogout() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  return (
    <button onClick={logout} className="text-sm text-red-600 hover:underline">
      Выйти
    </button>
  );
}
