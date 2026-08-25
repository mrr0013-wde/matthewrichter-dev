import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Matthew Richter | Senior Product Manager",
  description:
    "Senior Product Manager who owns products end to end — and builder of doudizhu.cards, a mobile-first global card game powered by AI.",
  openGraph: {
    title: "Matthew Richter | Senior Product Manager",
    description:
      "Senior Product Manager who owns products end to end — and builder of doudizhu.cards, a mobile-first global card game powered by AI.",
    url: "https://matthewrichter.dev",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#14161a] text-[#ededed]">
        {children}
      </body>
    </html>
  );
}
