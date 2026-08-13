import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads 계정 검색",
  description: "Threads 검색 추천 계정을 한눈에 확인합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
