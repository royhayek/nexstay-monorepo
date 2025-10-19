import { router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

export function AuthModalHandler() {
  const { showLoginModal, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && showLoginModal && !isAuthenticated) {
      router.push("/(auth)/login");
    }
  }, [showLoginModal, isLoading, isAuthenticated]);

  return null;
}
