import { createSlice } from "@reduxjs/toolkit";
import { ADMIN_TOKEN_KEY } from "../constants/auth";
import { getValidAdminToken } from "../utils/adminToken";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = getValidAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY));

    if (!token) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }

    return token;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  token: getStoredToken(),
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: { payload: string | null }) {
      const token = getValidAdminToken(action.payload);

      state.token = token;

      if (typeof window !== "undefined" && token !== null) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else if (typeof window !== "undefined") {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    },
    clearAuth(state) {
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    },
    hydrateFromStorage(state) {
      state.token = getStoredToken();
      state.isHydrated = true;
    },
  },
});

export const { setToken, clearAuth, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
