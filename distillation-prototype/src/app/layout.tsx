import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "蒸留プロトタイプ",
  description: "Distillation simulation prototype using cellular automaton",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
