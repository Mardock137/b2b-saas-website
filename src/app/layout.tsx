import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/lib/motion/provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Disabilita l'indicizzazione finché il sito non è sul dominio di produzione.
const isLiveProduction =
  process.env.NEXT_PUBLIC_SITE_URL === "https://example.com";

export const metadata: Metadata = {
  title: "Acme Labs — Business software, on subscription",
  description:
    "Acme Labs offers business software on a monthly subscription. Pick an app and start using it today.",
  robots: isLiveProduction ? undefined : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} dark`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <MotionProvider>
          {children}
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
