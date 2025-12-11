import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ClientFilterProvider } from "@/contexts/ClientFilterContext";
import { AlertProvider } from "@/contexts/AlertContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RifaSuerte Administración",
  description: "Sistema de administración de RifaSuerte",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingProvider>
          <ClientFilterProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </ClientFilterProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
