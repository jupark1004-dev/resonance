import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ui/ThemeProvider";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "RESONANCE — 나를 가장 깊이 이해한 날, 결이 같은 사람을 만납니다",
  description:
    "스와이프 없이 매일의 질문과 AI 내면 심리 리포트로 진짜 결이 맞는 단 한 사람을 연결해주는 자기발견형 매칭 서비스",
  keywords: ["RESONANCE", "레조넌스", "AI 내면 분석", "가치관 소개팅", "자기발견", "심리 리포트", "연애"],
  openGraph: {
    title: "RESONANCE — 내면이 공명하는 만남",
    description:
      "3개의 질문에 답하면 AI가 당신의 내면 페르소나 리포트를 작성하고, 주파수가 맞는 단 한 사람을 찾아드립니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "RESONANCE",
  },
  twitter: {
    card: "summary_large_image",
    title: "RESONANCE — 내면이 공명하는 만남",
    description:
      "스와이프 없는 자기발견형 AI 내면 매칭 서비스. 지금 나의 첫 내면 페르소나 리포트를 받아보세요.",
  },
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
        <Analytics />
      </body>
    </html>
  );
}
