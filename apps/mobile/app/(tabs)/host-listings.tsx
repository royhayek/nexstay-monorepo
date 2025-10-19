import { router } from "expo-router";
import React from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AddSquare, SearchNormal1, Category, Add, Edit2, Trash } from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Text } from "@/components/atoms";
import { TabScreenTemplate } from "@/components/templates";
import { EmptyState } from "@/components/molecules";
import { ms, mvs } from "@/utils/scaling";
import {
  usePropertiesAppControllerGetMyProperties,
  usePropertiesAppControllerRemove,
  getPropertiesAppControllerGetMyPropertiesQueryKey,
} from "@/api/queries/protected/properties/properties";

/**
 * Host Listings Screen
 *
 * Shows all properties hosted by the user with management options.
 */
export default function HostListingsScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const handleCreateListing = () => {
    router.push("/listing/create");
  };

  // Fetch user's listings from API
  const { data, isLoading, error, refetch } = usePropertiesAppControllerGetMyProperties();

  // Delete mutation
  const { mutateAsync: removeProperty, isPending: isDeleting } = usePropertiesAppControllerRemove({
    mutation: {
      onSuccess: () => {
        // Invalidate and refetch the listings
        queryClient.invalidateQueries({
          queryKey: getPropertiesAppControllerGetMyPropertiesQueryKey(),
        });
      },
    },
  });

  const listings = data?.data?.properties || [];

  const handleEditListing = (listing: any, event: any) => {
    event.stopPropagation();
    // Navigate to edit screen with property ID
    router.push(`/listing/edit/${listing._id}` as any);
  };

  const handleRemoveListing = (listing: any, event: any) => {
    event.stopPropagation();

    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${listing.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeProperty({ id: listing._id });
              Alert.alert("Success", "Listing deleted successfully");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to delete listing. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleListingPress = (listing: any) => {
    // Navigate to calendar management for now
    router.push(`/listing/calendar/${listing._id}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return theme.colors.success;
      case "inactive":
        return theme.colors.neutral500;
      case "draft":
        return theme.colors.warning;
      default:
        return theme.colors.neutral500;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "draft":
        return "In progress";
      default:
        return status || "Draft";
    }
  };

  if (isLoading) {
    return (
      <TabScreenTemplate title="Your listings" headerRight={<View style={{ width: ms(40) }} />}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading your listings...
          </Text>
        </View>
      </TabScreenTemplate>
    );
  }

  if (error) {
    return (
      <TabScreenTemplate title="Your listings" headerRight={<View style={{ width: ms(40) }} />}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load listings
          </Text>
          <Button variant="outlined" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </TabScreenTemplate>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TabScreenTemplate
        title="Your listings"
        headerRight={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <SearchNormal1 size={ms(20)} color={theme.colors.neutral900} variant="Outline" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Category size={ms(20)} color={theme.colors.neutral900} variant="Outline" />
            </TouchableOpacity>
          </View>
        }
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {listings.length === 0 ? (
          <EmptyState
            icon={<AddSquare size={ms(64)} variant="Bulk" color={theme.colors.primary} />}
            title="No listings yet"
            description="Create your first property listing to start hosting and earning"
            primaryAction={{
              text: "Create Listing",
              onPress: handleCreateListing,
            }}
          />
        ) : (
          <View style={styles.listingsContainer}>
            {listings.map((listing: any) => {
              const primaryImage = listing.images?.find((img: any) => img.isPrimary) || listing.images?.[0];
              const imageUrl = primaryImage?.url;

              return (
                <TouchableOpacity
                  key={listing._id}
                  style={styles.listingCard}
                  onPress={() => handleListingPress(listing)}
                  activeOpacity={0.7}
                >
                  {/* Image Container */}
                  <View style={styles.imageContainer}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.listingImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.listingImage, styles.placeholderImage]}>
                        <AddSquare size={ms(48)} color={theme.colors.neutral400} variant="Outline" />
                      </View>
                    )}

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface }]}>
                      <View
                        style={[styles.statusDot, { backgroundColor: getStatusColor(listing.status || "draft") }]}
                      />
                      <Text variant="bodySmallSemiBold" color="neutral900">
                        {getStatusLabel(listing.status || "draft")}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
                        onPress={(e) => handleEditListing(listing, e)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={ms(18)} color={theme.colors.neutral950} variant="Outline" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
                        onPress={(e) => handleRemoveListing(listing, e)}
                        activeOpacity={0.7}
                      >
                        <Trash size={ms(18)} color={theme.colors.error} variant="Outline" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Listing Info */}
                  <View style={styles.listingInfo}>
                    <Text variant="bodyLargeSemiBold" color="neutral900" numberOfLines={2}>
                      {listing.name}
                    </Text>
                    <Text variant="bodySmallRegular" color="neutral600" style={styles.listingLocation}>
                      {listing.propertyType} in {listing.address?.city || "Unknown location"}
                      {listing.address?.state && `, ${listing.address.state}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </TabScreenTemplate>

      {/* Floating Action Button - Always show when there are listings */}
      {listings.length > 0 && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: insets.bottom + mvs(80), // Position above tab bar
            },
          ]}
          onPress={handleCreateListing}
          activeOpacity={0.9}
        >
          <Add size={ms(28)} color={theme.colors.background} variant="Linear" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  headerButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    marginBottom: theme.spacing.md,
  },
  listingsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  listingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.neutral100,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  listingImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.lg,
  },
  placeholderImage: {
    backgroundColor: theme.colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: theme.spacing.base,
    left: theme.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  actionButtons: {
    position: "absolute",
    top: theme.spacing.base,
    right: theme.spacing.base,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listingInfo: {
    padding: theme.spacing.base,
    gap: theme.spacing.xxs,
  },
  listingLocation: {
    marginTop: theme.spacing.xxs,
  },
  fab: {
    position: "absolute",
    right: theme.spacing.lg,
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}));
