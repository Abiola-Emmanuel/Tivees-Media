"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

const PUBLIC_PATHS = ["/admin/login", "/admin/signout"];

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);

  const isPublicPath = pathname ? PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) : false;

  useEffect(() => {
    if (!isHydrated) return;
    if (pathname === "/admin/login" && token) {
      router.replace("/admin");
      return;
    }
    if (!isPublicPath && !token) {
      router.replace("/admin/login");
    }
  }, [isHydrated, isPublicPath, pathname, token, router]);

  if (!isHydrated && !isPublicPath) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!isPublicPath && !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Redirecting to login…</p>
      </div>
    );
  }

  if (pathname === "/admin/login" && token) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Redirecting to dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
