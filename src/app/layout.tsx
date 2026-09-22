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
  metadataBase: new URL("https://jpsoft.online"),
  title: {
    default: "SBB Counter",
    template: "%s · SBB Counter",
  },
  description:
    "SBB Counter – jednoduchá aplikace pro časování sérií a opakování při posilování. Evidence tréninků, tréninkové zátěže aj. Stáhni si ji zdarma pro Android.",
  applicationName: "SBB Counter",
  openGraph: {
    type: "website",
    siteName: "SBB Counter",
    title: "SBB Counter",
    description:
      "SBB Counter – jednoduchá aplikace pro časování sérií a opakování při posilování. Evidence tréninků, tréninkové zátěže aj. Stáhni si ji zdarma pro Android.",
    url: "https://jpsoft.online",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary",
    title: "SBB Counter",
    description:
      "SBB Counter – jednoduchá aplikace pro časování sérií a opakování při posilování. Evidence tréninků, tréninkové zátěže aj. Stáhni si ji zdarma pro Android.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
