"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/authSlice";
import { getAdminTokenExpiryDate, isAdminTokenExpired } from "@/store/utils/adminToken";

const PUBLIC_PATHS = ["/admin/login", "/admin/signout"];

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);

  const isPublicPath = pathname ? PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) : false;

  useEffect(() => {
    if (!isHydrated) return;

    if (token && isAdminTokenExpired(token)) {
      dispatch(clearAuth());
      router.replace("/admin/login");
      return;
    }

    if (pathname === "/admin/login" && token) {
      router.replace("/admin");
      return;
    }
    if (!isPublicPath && !token) {
      router.replace("/admin/login");
    }
  }, [dispatch, isHydrated, isPublicPath, pathname, token, router]);

  useEffect(() => {
    if (!isHydrated || !token) return;

    const expiryDate = getAdminTokenExpiryDate(token);

    if (!expiryDate) {
      dispatch(clearAuth());
      router.replace("/admin/login");
      return;
    }

    const delay = expiryDate.getTime() - Date.now();

    if (delay <= 0) {
      dispatch(clearAuth());
      router.replace("/admin/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(clearAuth());
      router.replace("/admin/login");
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, isHydrated, router, token]);

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
