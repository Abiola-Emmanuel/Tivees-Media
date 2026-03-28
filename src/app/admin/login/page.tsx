"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/hooks";
import { setToken } from "@/store/slices/authSlice";
import { Mail, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";

interface AdminLoginResponse {
  status: string;
  message: string;
  token?: string;
}

async function signIn({
  loginId,
  password,
}: {
  loginId: string;
  password: string;
}): Promise<AdminLoginResponse> {
  if (!loginId?.trim() || !password) {
    throw new Error("Login ID and password are required.");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: loginId.trim(), password }),
  });
  const data = (await res.json()) as AdminLoginResponse & { error?: string };
  if (!res.ok) {
    throw new Error(
      data.message ?? data.error ?? "Sign in failed. Please try again.",
    );
  }
  if (data.status !== "SUCCESS" || !data.token) {
    throw new Error(data.message ?? "Sign in failed. Please try again.");
  }
  return data;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      if (data.token) {
        dispatch(setToken(data.token));
        toast.success(data.message ?? "Signed in successfully.");
      }
      router.push("/admin");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loginId?.trim() || !password) {
      toast.warning("Please enter your login ID and password.");
      return;
    }
    signInMutation.reset();
    signInMutation.mutate({ loginId, password });
  };

  const isLoading = signInMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/admin/login"
          className="flex items-center justify-center gap-3 mb-8 sm:mb-10"
        >
          <Image
            src="/logo.png"
            alt="Tivess Media"
            width={40}
            height={40}
            className="rounded"
            unoptimized
          />
          <span className="text-xl font-semibold text-white">Tivess Media</span>
        </Link>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin sign in</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="loginId"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Email or login ID
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="loginId"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin001@tivess.media"
                  autoComplete="username"
                  className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-gray-500 text-sm mt-6 text-center">
            Contact your administrator if you don’t have access.
          </p>
        </div>

        <p className="text-gray-500 text-sm text-center mt-6">
          © {new Date().getFullYear()} Tivess Media. All rights reserved.
        </p>
      </div>
    </div>
  );
}
