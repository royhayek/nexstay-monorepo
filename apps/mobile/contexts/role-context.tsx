import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserDataDtoRolesItem } from "@/api/models/public";
import { useAuth } from "@/hooks/use-auth";
import { analytics } from "@/utils/analytics";

/**
 * Active role represents which mode the user is currently in
 * Only 'guest' and 'host' are valid for UI mode switching
 */
export type ActiveRole = "guest" | "host";

/**
 * Role context type definition
 */
interface RoleContextType {
  /** Current active role (guest or host) */
  activeRole: ActiveRole;

  /** All roles the user has */
  userRoles: UserDataDtoRolesItem[];

  /** Switch to a different role */
  switchRole: (role: ActiveRole) => Promise<void>;

  /** Check if user can act as a host */
  canBeHost: boolean;

  /** Check if user can act as a guest */
  canBeGuest: boolean;

  /** Check if user has both guest and host roles */
  isDualRole: boolean;

  /** Loading state for role operations */
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = "@nexstay:activeRole";

/**
 * RoleProvider - Manages user role context and switching between guest/host modes
 *
 * This provider handles:
 * - Tracking the active role (guest or host)
 * - Persisting role preference across app sessions
 * - Validating role switches against user's actual roles
 * - Providing role-based permissions checks
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <RoleProvider>
 *     <App />
 *   </RoleProvider>
 * </AuthProvider>
 * ```
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<ActiveRole>("guest");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserDataDtoRolesItem): boolean => {
      return user?.roles?.includes(role) ?? false;
    },
    [user?.roles]
  );

  // Derived values
  const canBeHost = hasRole(UserDataDtoRolesItem.host);
  const canBeGuest = hasRole(UserDataDtoRolesItem.guest);
  const isDualRole = canBeHost && canBeGuest;
  const userRoles = user?.roles ?? [];

  /**
   * Load persisted active role from storage
   */
  const loadPersistedRole = useCallback(async () => {
    try {
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole && (savedRole === "guest" || savedRole === "host")) {
        return savedRole as ActiveRole;
      }
    } catch (error) {
      console.error("[RoleContext] Failed to load persisted role:", error);
    }
    return null;
  }, []);

  /**
   * Save active role to storage
   */
  const saveRoleToStorage = useCallback(async (role: ActiveRole) => {
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch (error) {
      console.error("[RoleContext] Failed to save role to storage:", error);
    }
  }, []);

  /**
   * Initialize active role based on user's roles and persisted preference
   */
  useEffect(() => {
    const initializeRole = async () => {
      if (authLoading) {
        return;
      }

      setIsLoading(true);

      try {
        // If user is not authenticated, default to guest
        if (!user) {
          setActiveRole("guest");
          setIsLoading(false);
          return;
        }

        // Load persisted role preference
        const persistedRole = await loadPersistedRole();

        // If user only has one role between guest/host, use that
        if (canBeHost && !canBeGuest) {
          setActiveRole("host");
          await saveRoleToStorage("host");
        } else if (canBeGuest && !canBeHost) {
          setActiveRole("guest");
          await saveRoleToStorage("guest");
        } else if (isDualRole) {
          // User has both roles - use persisted preference or default to HOST
          const roleToSet = persistedRole || "host";

          // Validate persisted role is still valid
          if (roleToSet === "host" && canBeHost) {
            setActiveRole("host");
          } else if (roleToSet === "guest" && canBeGuest) {
            setActiveRole("guest");
          } else {
            // Fallback to host if persisted role is invalid (prioritize host)
            setActiveRole("host");
            await saveRoleToStorage("host");
          }
        } else {
          // User has no guest or host role, default to guest
          setActiveRole("guest");
        }
      } catch (error) {
        console.error("[RoleContext] Failed to initialize role:", error);
        setActiveRole("guest");
      } finally {
        setIsLoading(false);
      }
    };

    initializeRole();
  }, [user, canBeHost, canBeGuest, isDualRole, authLoading, loadPersistedRole, saveRoleToStorage]);

  /**
   * Switch to a different role
   *
   * @param role - The role to switch to ('guest' or 'host')
   * @throws Error if user doesn't have the target role
   */
  const switchRole = useCallback(
    async (role: ActiveRole): Promise<void> => {
      // Validate role switch
      if (role === "host" && !canBeHost) {
        const error = new Error("User does not have host role");

        // Track failed role switch attempt
        analytics.track("role_switch_failed", {
          attempted_role: role,
          current_role: activeRole,
          reason: "missing_host_role",
          user_id: user?.id,
        });

        throw error;
      }

      if (role === "guest" && !canBeGuest) {
        const error = new Error("User does not have guest role");

        // Track failed role switch attempt
        analytics.track("role_switch_failed", {
          attempted_role: role,
          current_role: activeRole,
          reason: "missing_guest_role",
          user_id: user?.id,
        });

        throw error;
      }

      // Don't switch if already in target role
      if (activeRole === role) {
        return;
      }

      const previousRole = activeRole;

      try {
        // Update active role
        setActiveRole(role);

        // Persist to storage
        await saveRoleToStorage(role);

        // Track successful role switch
        analytics.track("role_switched", {
          from_role: previousRole,
          to_role: role,
          is_dual_role: isDualRole,
          user_id: user?.id,
          user_roles: userRoles.join(","),
        });

        console.info(`[RoleContext] Switched to ${role} role`);
      } catch (error) {
        // Track failed role switch
        analytics.track("role_switch_failed", {
          attempted_role: role,
          current_role: previousRole,
          reason: error instanceof Error ? error.message : "unknown_error",
          user_id: user?.id,
        });

        console.error("[RoleContext] Failed to switch role:", error);
        throw error;
      }
    },
    [activeRole, canBeHost, canBeGuest, saveRoleToStorage, isDualRole, user, userRoles]
  );

  const value: RoleContextType = {
    activeRole,
    userRoles,
    switchRole,
    canBeHost,
    canBeGuest,
    isDualRole,
    isLoading,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * useRoleContext - Hook to access role context
 *
 * Must be used within a RoleProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { activeRole, switchRole, canBeHost } = useRoleContext();
 *
 *   if (canBeHost) {
 *     return <Button onPress={() => switchRole('host')}>Switch to Host Mode</Button>;
 *   }
 * }
 * ```
 */
export function useRoleContext(): RoleContextType {
  const context = useContext(RoleContext);

  if (context === undefined) {
    throw new Error("useRoleContext must be used within a RoleProvider");
  }

  return context;
}
