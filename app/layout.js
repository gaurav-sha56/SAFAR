import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import MotionLayout from "./motion-layout";
import PwaRegister from "./pwa-register";

export const metadata = {
  title: "SAFAR — Fleet Operations",
  description: "Smartphone-powered fleet safety platform",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D1B2A" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <ClerkProvider>
        <body className="min-h-full flex flex-col">
          <PwaRegister />
          <MotionLayout>{children}</MotionLayout>
        </body>
      </ClerkProvider>
    </html>
  );
}
