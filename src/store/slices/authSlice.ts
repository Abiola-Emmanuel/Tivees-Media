import { createSlice } from "@reduxjs/toolkit";
import { ADMIN_TOKEN_KEY } from "../constants/auth";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
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
      state.token = action.payload;
      if (typeof window !== "undefined" && action.payload !== null) {
        localStorage.setItem(ADMIN_TOKEN_KEY, action.payload);
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
