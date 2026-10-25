import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChronoCraft — AI Timeline Visualizer",
  description: "Crafting data into stories, one timeline at a time. Powered by Google Gemini and Knight Lab TimelineJS.",
  keywords: ["timeline", "history", "data visualization", "chronology", "gemini ai", "timelinejs"],
  authors: [{ name: "ChronoCraft Team" }],
  icons: {
    icon: "./logo.jpeg",
    apple: "./logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="./logo.jpeg" />
        <link rel="apple-touch-icon" href="./logo.jpeg" />
      </head>
      <body className={`${inter.className} bg-[#F8F6F4] text-brand-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
