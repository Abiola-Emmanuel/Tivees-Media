"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { clearAuth } from "@/store/slices/authSlice";

export default function AdminSignOutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearAuth());
    router.replace("/admin/login");
  }, [dispatch, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400">Signing out…</p>
    </div>
  );
}
