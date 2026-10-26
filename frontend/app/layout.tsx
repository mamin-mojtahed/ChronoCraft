import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "ChronoCraft — AI Timeline Visualizer",
  description: "Crafting data into stories, one timeline at a time. Powered by Google Gemini and Knight Lab TimelineJS.",
  keywords: ["timeline", "history", "data visualization", "chronology", "gemini ai", "timelinejs"],
  authors: [{ name: "ChronoCraft Team" }],
  icons: {
    icon: `${basePath}/icon.png`,
    apple: `${basePath}/icon.png`,
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
        <link rel="icon" type="image/png" href={`${basePath}/icon.png`} />
        <link rel="apple-touch-icon" href={`${basePath}/icon.png`} />
      </head>
      <body className={`${inter.className} bg-[#F8F6F4] text-brand-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
