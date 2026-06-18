import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { Suspense } from "react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swimming Holes — Find Swimming Holes & Waterfalls",
  description:
    "1,100+ swimming holes and waterfalls across 44 US states. Find the perfect spot near you.",
  keywords: ["swimming holes", "waterfalls", "outdoor", "nature", "hiking"],
  openGraph: {
    title: "Swimming Holes — Find Swimming Holes & Waterfalls",
    description: "Discover the best swimming holes and waterfalls near you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} min-h-screen bg-stone-900 text-stone-100 antialiased`}
      >
        <Suspense>
          <TopNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
