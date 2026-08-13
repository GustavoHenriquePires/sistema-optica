import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AdminShell } from "@/components/layout/admin-shell";
import { getChatGPTUser } from "./chatgpt-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de OS | Laboratório Óptico",
  description: "Gestão de ordens de serviço, produção e dados ópticos para laboratório óptico.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await getChatGPTUser();

  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AdminShell userName={authenticatedUser?.displayName ?? "Usuário do sistema"}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
