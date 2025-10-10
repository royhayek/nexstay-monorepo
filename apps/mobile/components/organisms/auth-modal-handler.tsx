import { router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

export function AuthModalHandler() {
  const { showLoginModal, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && showLoginModal) {
      router.push("/(auth)/login");
    }
  }, [showLoginModal, isLoading]);

  return null;
}
