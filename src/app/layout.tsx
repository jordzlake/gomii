import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/animations.css";
import "@/styles/screens.css";
import "@/styles/friends.css";
import "@/styles/tasks.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "gomii — level up your real life",
  description:
    "A gamified life tracker: finish real tasks, grow eight stats, and take your character to level 100.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "gomii" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#071426",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
