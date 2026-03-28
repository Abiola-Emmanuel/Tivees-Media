import type { Metadata } from "next";
import AdminAuthGuard from "./AdminAuthGuard";

export const metadata: Metadata = {
  title: "Admin - Tivess Media",
  description: "Tivess Media Admin",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
