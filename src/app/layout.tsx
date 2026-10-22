import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { StoreProvider } from "@/context/StoreContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hospital Inventory & Vendor Management",
  description: "CRM frontend for hospital inventory and vendor management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F4F7F9] text-slate-900 antialiased h-screen w-screen overflow-hidden`}>
        <AuthProvider>
          <ToastProvider>
            <StoreProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </StoreProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
