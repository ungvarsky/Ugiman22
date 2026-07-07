import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hana Trans | Invoice Approval",
  description: "Invoice approval workflow for Hana Trans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
