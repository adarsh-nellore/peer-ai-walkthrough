import type { Metadata } from "next";
import { Inter, Inconsolata } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Peer — interactive walkthrough",
  description: "44-beat clickable demo of the Peer CSR authoring environment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${inconsolata.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
