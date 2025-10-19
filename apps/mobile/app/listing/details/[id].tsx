import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { View, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  ArrowLeft,
  Edit2,
  Trash,
  Location,
  People,
  Home2,
  DollarCircle,
  Calendar,
  TickCircle,
  CloseCircle,
} from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import {
  usePropertiesAppControllerFindOne,
  usePropertiesAppControllerRemove,
  usePropertiesAppControllerToggleStatus,
  getPropertiesAppControllerGetMyPropertiesQueryKey,
} from "@/api/queries/protected/properties/properties";

/**
 * Property Details Screen
 *
 * Displays complete information about a property listing with management options
 */
export default function ListingDetailsScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch property details
  const { data, isLoading, error } = usePropertiesAppControllerFindOne(id as string);

  // Toggle status mutation
  const { mutateAsync: toggleStatus, isPending: isTogglingStatus } = usePropertiesAppControllerToggleStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getPropertiesAppControllerGetMyPropertiesQueryKey(),
        });
      },
    },
  });

  // Delete mutation
  const { mutateAsync: removeProperty, isPending: isDeleting } = usePropertiesAppControllerRemove({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getPropertiesAppControllerGetMyPropertiesQueryKey(),
        });
        router.back();
      },
    },
  });

  console.log("Property Data:", data);
  const property = data?.data;

  const handleEdit = () => {
    router.push(`/listing/edit/${id}`);
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStatus({ id: id as string });
      Alert.alert("Success", `Listing ${property?.status === "active" ? "deactivated" : "activated"} successfully`);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to update status. Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Listing", `Are you sure you want to delete "${property?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeProperty({ id: id as string });
            Alert.alert("Success", "Listing deleted successfully");
          } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to delete listing. Please try again.");
          }
        },
      },
    ]);
  };

  const handleManageCalendar = () => {
    router.push(`/listing/calendar/${id}`);
  };

  if (isLoading) {
    return (
      <ScreenTemplate title="Listing Details" showBackButton headerRight={<View style={{ width: ms(80) }} />}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading property details...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (error || !property) {
    return (
      <ScreenTemplate title="Listing Details" showBackButton headerRight={<View style={{ width: ms(80) }} />}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error">
            Failed to load property details
          </Text>
          <Button variant="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </ScreenTemplate>
    );
  }

  const primaryImage = property.images?.find((img: any) => img.isPrimary) || property.images?.[0];

  return (
    <ScreenTemplate
      title="Listing Details"
      showBackButton
      headerRight={
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Edit2 size={ms(20)} color={theme.colors.neutral900} variant="Outline" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Trash size={ms(20)} color={theme.colors.error} variant="Outline" />
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Image */}
        {primaryImage?.url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: primaryImage.url }} style={styles.image} resizeMode="cover" />

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface }]}>
              {property.status === "active" ? (
                <TickCircle size={ms(16)} color={theme.colors.success} variant="Bold" />
              ) : (
                <CloseCircle size={ms(16)} color={theme.colors.neutral500} variant="Bold" />
              )}
              <Text variant="bodySmallSemiBold" color="neutral900">
                {property.status === "active" ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        )}

        {/* Property Info */}
        <View style={styles.section}>
          <Text variant="h5SemiBold" color="neutral900" style={styles.title}>
            {property.name}
          </Text>

          {/* Property Type & Location */}
          <View style={styles.infoRow}>
            <Home2 size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
            <Text variant="bodyMediumRegular" color="neutral600" style={styles.infoText}>
              {property.propertyType} • {property.roomType}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Location size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
            <Text variant="bodyMediumRegular" color="neutral600" style={styles.infoText}>
              {property.address?.city}
              {property.address?.state && `, ${property.address.state}`}
              {property.address?.country && `, ${property.address.country}`}
            </Text>
          </View>
        </View>

        {/* Property Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <People size={ms(24)} color={theme.colors.primary} variant="Bold" />
            <Text variant="bodyMediumSemiBold" color="neutral900" style={styles.statValue}>
              {property.accommodates}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600">
              Guests
            </Text>
          </View>

          <View style={styles.statCard}>
            <Home2 size={ms(24)} color={theme.colors.primary} variant="Bold" />
            <Text variant="bodyMediumSemiBold" color="neutral900" style={styles.statValue}>
              {property.bedrooms}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600">
              Bedrooms
            </Text>
          </View>

          <View style={styles.statCard}>
            <People size={ms(24)} color={theme.colors.primary} variant="Bold" />
            <Text variant="bodyMediumSemiBold" color="neutral900" style={styles.statValue}>
              {property.beds}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600">
              Beds
            </Text>
          </View>

          <View style={styles.statCard}>
            <Home2 size={ms(24)} color={theme.colors.primary} variant="Bold" />
            <Text variant="bodyMediumSemiBold" color="neutral900" style={styles.statValue}>
              {property.bathrooms}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600">
              Bathrooms
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral900" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMediumRegular" color="neutral700" style={styles.description}>
            {property.description}
          </Text>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral900" style={styles.sectionTitle}>
            Pricing
          </Text>

          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text variant="bodyMediumRegular" color="neutral700">
                Base price per night
              </Text>
              <Text variant="bodyLargeSemiBold" color="neutral900">
                ${property.priceInfo?.basePrice || 0}
              </Text>
            </View>

            {property.priceInfo?.cleaningFee && (
              <View style={styles.pricingRow}>
                <Text variant="bodyMediumRegular" color="neutral700">
                  Cleaning fee
                </Text>
                <Text variant="bodyMediumSemiBold" color="neutral900">
                  ${property.priceInfo.cleaningFee}
                </Text>
              </View>
            )}

            <View style={styles.pricingRow}>
              <Text variant="bodyMediumRegular" color="neutral700">
                Minimum nights
              </Text>
              <Text variant="bodyMediumSemiBold" color="neutral900">
                {property.priceInfo?.minimumNights || 1}
              </Text>
            </View>

            <View style={styles.pricingRow}>
              <Text variant="bodyMediumRegular" color="neutral700">
                Maximum nights
              </Text>
              <Text variant="bodyMediumSemiBold" color="neutral900">
                {property.priceInfo?.maximumNights || 365}
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" color="neutral900" style={styles.sectionTitle}>
              Amenities
            </Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityItem}>
                  <TickCircle size={ms(16)} color={theme.colors.success} variant="Bold" />
                  <Text variant="bodySmallRegular" color="neutral700" style={styles.amenityText}>
                    {amenity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            variant="outlined"
            color="neutral"
            size="large"
            onPress={handleToggleStatus}
            disabled={isTogglingStatus}
            style={styles.actionButton}
          >
            <Text variant="bodyMediumSemiBold" color="neutral900">
              {isTogglingStatus
                ? "Updating..."
                : property.status === "active"
                ? "Deactivate Listing"
                : "Activate Listing"}
            </Text>
          </Button>

          <Button
            variant="filled"
            color="primary"
            size="large"
            onPress={handleManageCalendar}
            style={styles.actionButton}
          >
            <Calendar size={ms(20)} color={theme.colors.neutral0} variant="Bold" />
            <Text variant="bodyMediumSemiBold" color="neutral0" style={styles.buttonText}>
              Manage Calendar
            </Text>
          </Button>
        </View>
      </ScrollView>
    </ScreenTemplate>
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
    gap: theme.spacing.md,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.neutral100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  statValue: {
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  description: {
    lineHeight: mvs(22),
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  amenityText: {
    textTransform: "capitalize",
  },
  actionsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.base,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
}));
