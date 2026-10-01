import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NostrProvider } from "@/components/NostrProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unkeyed — Your words. Your keys. Your BCH.",
  description:
    "A Nostr-native blogging platform with non-custodial Bitcoin Cash tipping. Own your articles. Tip authors directly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased`}
      >
        <ThemeProvider>
          <NostrProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </NostrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
