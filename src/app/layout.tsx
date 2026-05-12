import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nido — La secretaría digital de tu escuela infantil · Delega",
  description: "Nido automatiza contabilidad, facturación SEPA, comedor, empleados y nóminas.",
  icons: { icon: "/delega_logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fgqlgehbtjdwcilyroiq.supabase.co" crossOrigin="anonymous" />
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <ToastProvider><Providers>{children}</Providers></ToastProvider>
      </body>
    </html>
  );
}
