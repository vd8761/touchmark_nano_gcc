import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://touchmark-nano-gcc.example"),
  title: {
    default: "Touchmark Nano GCC Hub - Start Small. Innovate Fast. Scale Globally.",
    template: "%s - Touchmark Nano GCC Hub",
  },
  description:
    "Touchmark Nano GCC Hub helps global technology companies build agile capability in India - without the cost, complexity or commitment of a traditional Global Capability Center.",
  openGraph: { type: "website", siteName: "Touchmark Nano GCC Hub", locale: "en_IN" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
