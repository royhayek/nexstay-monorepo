import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUsersAppControllerAddToWishlist,
  useUsersAppControllerRemoveFromWishlist,
  useUsersAppControllerCheckWishlistStatus,
  getUsersAppControllerGetWishlistQueryKey,
} from "@/api/queries/protected/users/users";

/**
 * Custom hook to manage favorite/wishlist state for a property
 * Provides optimistic updates and automatic cache invalidation
 */
export function useFavorite(propertyId: string) {
  const queryClient = useQueryClient();
  const [isOptimisticFavorite, setIsOptimisticFavorite] = useState<boolean | null>(null);

  // Check if property is in wishlist
  const { data: wishlistCheckData, isLoading: isCheckingStatus } =
    useUsersAppControllerCheckWishlistStatus(propertyId, {
      query: {
        enabled: !!propertyId,
      },
    });

  const isFavorite = isOptimisticFavorite ?? wishlistCheckData?.data?.inWishlist ?? false;

  // Add to wishlist mutation
  const addToWishlistMutation = useUsersAppControllerAddToWishlist({
    mutation: {
      onMutate: async () => {
        // Optimistically update UI
        setIsOptimisticFavorite(true);
      },
      onSuccess: () => {
        // Invalidate wishlist queries to refetch
        queryClient.invalidateQueries({
          queryKey: getUsersAppControllerGetWishlistQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: [`/v1/app/users/wishlist/check/${propertyId}`],
        });
        // Reset optimistic state
        setIsOptimisticFavorite(null);
      },
      onError: () => {
        // Revert optimistic update on error
        setIsOptimisticFavorite(null);
      },
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useUsersAppControllerRemoveFromWishlist({
    mutation: {
      onMutate: async () => {
        // Optimistically update UI
        setIsOptimisticFavorite(false);
      },
      onSuccess: () => {
        // Invalidate wishlist queries to refetch
        queryClient.invalidateQueries({
          queryKey: getUsersAppControllerGetWishlistQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: [`/v1/app/users/wishlist/check/${propertyId}`],
        });
        // Reset optimistic state
        setIsOptimisticFavorite(null);
      },
      onError: () => {
        // Revert optimistic update on error
        setIsOptimisticFavorite(null);
      },
    },
  });

  // Toggle favorite status
  const toggleFavorite = () => {
    if (isFavorite) {
      removeFromWishlistMutation.mutate({ propertyId });
    } else {
      addToWishlistMutation.mutate({ propertyId });
    }
  };

  const isLoading =
    isCheckingStatus ||
    addToWishlistMutation.isPending ||
    removeFromWishlistMutation.isPending;

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
    addToWishlist: () => addToWishlistMutation.mutate({ propertyId }),
    removeFromWishlist: () => removeFromWishlistMutation.mutate({ propertyId }),
  };
}
