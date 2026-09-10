import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/lib/theme-script";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display"
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "NeedInFind — Tell us what you need",
    template: "%s · NeedInFind"
  },
  description:
    "NeedInFind is an AI-powered shopping adviser. Describe the problem you're trying to solve, and it finds and compares the right products for you.",
  openGraph: {
    type: "website",
    siteName: "NeedInFind"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets the `dark` class before first paint, based on saved
            preference or system setting — avoids a flash of the wrong
            theme. suppressHydrationWarning above accounts for this script
            changing html's className outside of React's own render. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
