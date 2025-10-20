import React, { useState } from "react";
import { Image, View, FlatList, ActivityIndicator } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router } from "expo-router";

import { Input, Text } from "@/components/atoms";
import { EmptyState, PropertyCard } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { mvs, ms } from "@/utils/scaling";
import { SearchNormal1 } from "iconsax-react-native";
import { useUsersAppControllerGetWishlist } from "@/api/queries/protected/users/users";
import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import type { WishlistItemDto } from "@/api/models/protected/wishlistItemDto";
import type { AddressResponseDto } from "@/api/models/public/addressResponseDto";
import type { PriceInfoResponseDto } from "@/api/models/public/priceInfoResponseDto";
import type { PropertyImageResponseDto } from "@/api/models/public/propertyImageResponseDto";
import type { PropertyResponseDtoStatus } from "@/api/models/public/propertyResponseDtoStatus";

// Helper function to transform WishlistItemDto to PropertyResponseDto
// Note: This creates a partial PropertyResponseDto with only the fields needed for display
const transformWishlistItem = (item: WishlistItemDto): PropertyResponseDto => {
  return {
    _id: item.id,
    name: item.name,
    description: "",
    propertyType: "",
    roomType: "",
    bedType: "",
    accommodates: 0,
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
    address: {
      city: item.city,
      country: item.country,
    } as AddressResponseDto,
    price: {
      basePrice: item.pricePerNight,
      pricePerNight: item.pricePerNight,
    } as PriceInfoResponseDto,
    images: [
      {
        url: item.thumbnailUrl,
      },
    ] as PropertyImageResponseDto[],
    pictureUrl: item.thumbnailUrl,
    averageRating: item.rating,
    reviewCount: item.reviewCount,
    minimumNights: 1,
    maximumNights: 365,
    status: "active" as PropertyResponseDtoStatus,
  } as unknown as PropertyResponseDto;
};

export default function FavoritesScreen() {
  const { theme } = useUnistyles();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch wishlist
  const { data: wishlistResponse, isLoading, error, refetch } = useUsersAppControllerGetWishlist();
  const wishlistItems = wishlistResponse?.data?.properties || [];

  // Transform wishlist items to property format
  const properties = wishlistItems.map(transformWishlistItem);

  // Filter properties based on search query
  const filteredProperties = properties.filter((property: PropertyResponseDto) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      property.name?.toLowerCase().includes(query) ||
      property.address?.city?.toLowerCase().includes(query) ||
      property.address?.country?.toLowerCase().includes(query)
    );
  });

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  return (
    <TabScreenTemplate title="My Favorites">
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Input
            variant="search"
            value={searchQuery}
            placeholder="Search collection"
            onChangeText={setSearchQuery}
            leftIcon={<SearchNormal1 size={20} color={theme.colors.neutral600} variant="Outline" />}
          />
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
              Loading your favorites...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.emptyStateWrapper}>
            <EmptyState
              icon={
                <Image
                  source={require("@/assets/images/empty-folder.png")}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
              }
              title="Unable to Load Favorites"
              description="Please try again later"
              primaryAction={{
                text: "Retry",
                onPress: () => refetch(),
                variant: "filled",
              }}
            />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProperties.length === 0 && !searchQuery && (
          <View style={styles.emptyStateWrapper}>
            <EmptyState
              icon={
                <Image
                  source={require("@/assets/images/empty-folder.png")}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
              }
              title="No Favorites Yet"
              description="Start adding properties to your favorites for quick access"
            />
          </View>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredProperties.length === 0 && searchQuery && (
          <View style={styles.emptyStateWrapper}>
            <EmptyState
              icon={
                <Image
                  source={require("@/assets/images/empty-folder.png")}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
              }
              title="No Results Found"
              description={`No favorites match "${searchQuery}"`}
            />
          </View>
        )}

        {/* Favorites List */}
        {!isLoading && !error && filteredProperties.length > 0 && (
          <FlatList
            data={filteredProperties}
            keyExtractor={(item: PropertyResponseDto) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => handlePropertyPress(item._id)}
                width={(mvs(375) - ms(48)) / 2} // Account for padding and gap
                imageHeight={mvs(130)}
                showFavorite={true}
              />
            )}
          />
        )}
      </View>
    </TabScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: mvs(100),
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: mvs(100), // Account for tab bar height
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: mvs(100), // Account for tab bar
  },
  row: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
}));
