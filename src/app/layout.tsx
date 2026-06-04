import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ui/ThemeProvider";

export const metadata: Metadata = {
  title: "RESONANCE — 내면이 공명하는 만남",
  description:
    "AI가 당신의 내면을 분석해 진짜 잘 맞는 사람을 연결해주는 자기발견형 매칭 서비스",
  keywords: ["매칭", "AI", "자기발견", "연애", "공명"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
