import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Study Task — Обучение с геймификацией",
  description: "Онлайн-платформа для обучения с опытом, уровнями и достижениями",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body className="min-h-screen bg-[var(--bg)] font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
