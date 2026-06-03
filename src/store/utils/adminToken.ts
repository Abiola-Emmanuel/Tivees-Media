import decode from "jsonwebtoken/decode";
import type { JwtPayload } from "jsonwebtoken";

export interface AdminTokenPayload extends JwtPayload {
  adminAdmin?: {
    loginId?: string;
  };
  type?: string;
}

export function getAdminTokenPayload(token: string | null): AdminTokenPayload | null {
  if (!token) return null;

  const payload = decode(token);

  if (!payload || typeof payload === "string") {
    return null;
  }

  return payload as AdminTokenPayload;
}

export function getAdminTokenExpiryDate(token: string | null): Date | null {
  const payload = getAdminTokenPayload(token);

  if (typeof payload?.exp !== "number") {
    return null;
  }

  return new Date(payload.exp * 1000);
}

export function isAdminTokenExpired(token: string | null): boolean {
  const expiryDate = getAdminTokenExpiryDate(token);

  if (!expiryDate) {
    return true;
  }

  return Date.now() >= expiryDate.getTime();
}

export function getValidAdminToken(token: string | null): string | null {
  return token && !isAdminTokenExpired(token) ? token : null;
}
