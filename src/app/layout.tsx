import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google"; // Institutional Fonts
import "./globals.css";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SCSVMV Visitor Management",
  description: "Official Visitor Management System for SCSVMV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <ToastProvider>
          <Header />
          <div style={{ paddingTop: 'var(--header-height)' }}>
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
