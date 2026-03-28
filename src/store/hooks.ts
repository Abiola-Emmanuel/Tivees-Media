import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof import("./index").store>();

/** Admin JWT token from auth slice. Use for API Authorization header. */
export const useAuthToken = () => useAppSelector((state) => state.auth.token);

/** True when a token is present (after login or hydration from localStorage). */
export const useIsAuthenticated = () =>
  useAppSelector((state) => !!state.auth.token);
