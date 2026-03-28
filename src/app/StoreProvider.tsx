"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateFromStorage } from "@/store/slices/authSlice";

function StoreProviderInner({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);
  return <>{children}</>;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <StoreProviderInner>{children}</StoreProviderInner>
    </Provider>
  );
}
