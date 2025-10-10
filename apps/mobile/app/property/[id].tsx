import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import { usePropertiesPublicControllerFindOne } from "@/api/queries/public/properties-public/properties-public";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { useSharedTransition } from "@/hooks/use-shared-transition";
import { router, useLocalSearchParams } from "expo-router";
import { Heart, Location, Wifi } from "iconsax-react-native";
import {
  ArrowLeftIcon,
  BarbellIcon,
  IslandIcon,
  ShareNetworkIcon,
  Star,
  SwimmingPoolIcon,
  WindIcon,
} from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { transitionData, setTransitionData } = useSharedTransition();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const imageX = useSharedValue(transitionData?.x || 0);
  const imageY = useSharedValue(transitionData?.y || 0);
  const imageWidth = useSharedValue(transitionData?.width || SCREEN_WIDTH);
  const imageHeight = useSharedValue(transitionData?.height || SCREEN_WIDTH * 0.75);
  const imageBorderRadius = useSharedValue(transitionData ? 12 : 0);
  const contentOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);
  const scrollY = useSharedValue(0);

  // API call for property details
  const {
    data: propertyResponse,
    isLoading,
    error,
  } = usePropertiesPublicControllerFindOne(id || "", {
    query: {
      enabled: !!id,
    },
  });

  const property = propertyResponse?.data as PropertyResponseDto;

  useEffect(() => {
    if (transitionData) {
      imageX.value = withTiming(0, { duration: 400 });
      imageY.value = withTiming(0, { duration: 400 });
      imageWidth.value = withTiming(SCREEN_WIDTH, { duration: 400 });
      imageHeight.value = withTiming(SCREEN_WIDTH * 0.75, { duration: 400 });
      imageBorderRadius.value = withTiming(0, { duration: 400 });
    }

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 300 });
    }, 100);
  }, [imageX, imageY, imageWidth, imageHeight, imageBorderRadius, contentOpacity, transitionData]);

  const handleBack = () => {
    contentOpacity.value = withTiming(0, { duration: 150 });

    if (transitionData) {
      imageX.value = withTiming(transitionData.x, { duration: 350 });
      imageY.value = withTiming(transitionData.y, { duration: 350 });
      imageWidth.value = withTiming(transitionData.width, { duration: 350 });
      imageHeight.value = withTiming(transitionData.height, { duration: 350 });
      imageBorderRadius.value = withTiming(12, { duration: 350 });

      setTimeout(() => {
        backgroundOpacity.value = withTiming(0, { duration: 200 });
      }, 100);

      setTimeout(() => {
        setTransitionData(null);
        router.back();
      }, 360);
    } else {
      setTimeout(() => {
        router.back();
      }, 150);
    }
  };

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: imageX.value,
    top: imageY.value,
    width: imageWidth.value,
    height: imageHeight.value,
    borderRadius: imageBorderRadius.value,
    overflow: "hidden",
    zIndex: 1,
  }));

  const imageStyleAnimated = useAnimatedStyle(() => ({
    borderRadius: imageBorderRadius.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text variant="bodyLargeRegular" color="neutral500">
            Loading property...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <Text variant="bodyLargeRegular">Unable to load property</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text variant="bodyLargeSemiBold" style={{ color: "#fff" }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get images
  const images = property.images || [];
  const imageUrl = images[currentImageIndex]?.url || property.pictureUrl || property.xlPictureUrl;

  // Helper functions
  const formatPrice = (price: number) => {
    return `${property.price?.currencySymbol || "$"}${price.toLocaleString()}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundOverlay, backgroundAnimatedStyle]} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Header with back and share buttons */}
        <Animated.View style={[styles.header, contentAnimatedStyle]}>
          <IconButton style={styles.headerButton} onPress={handleBack}>
            <ArrowLeftIcon size={20} color="#fff" />
          </IconButton>
          <IconButton style={styles.shareButton}>
            <ShareNetworkIcon size={20} color="#fff" />
          </IconButton>
        </Animated.View>

        <View style={styles.imageSpacer} />

        {/* Original Animated Image with Enhancements */}
        {transitionData?.imageUrl || imageUrl ? (
          <Animated.View style={imageAnimatedStyle}>
            <Animated.Image
              source={{ uri: transitionData?.imageUrl || imageUrl }}
              style={[StyleSheet.absoluteFillObject, imageStyleAnimated]}
              resizeMode="cover"
            />
            {/* Remaining Images Count Overlay */}
            {images.length > 4 && (
              <Animated.View style={[styles.imageCountOverlay, contentAnimatedStyle]}>
                <Text variant="bodyLargeSemiBold" style={{ color: "#fff" }}>
                  {images.length - 1}+
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[imageAnimatedStyle, styles.placeholderImageContainer]}>
            <Text variant="bodyLargeRegular" color="neutral500">
              No Image Available
            </Text>
          </Animated.View>
        )}

        {/* Image Gallery Thumbnails */}
        <Animated.View style={[styles.imageGallery, contentAnimatedStyle]}>
          {images.slice(0, 4).map((image, index) => (
            <IconButton key={index} style={styles.galleryThumbnail} onPress={() => setCurrentImageIndex(index)}>
              <Image source={{ uri: image.url }} style={styles.thumbnailImage} resizeMode="cover" />
            </IconButton>
          ))}
          {images.length > 4 && (
            <IconButton style={styles.moreImagesButton}>
              <Text variant="bodyMediumSemiBold" style={{ color: "#fff" }}>
                {images.length - 3}+
              </Text>
            </IconButton>
          )}
        </Animated.View>

        {/* Property Content */}
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* Property Title */}
          <View style={styles.titleSection}>
            <Text variant="h6SemiBold" style={{ flex: 1 }}>
              {property.name || "Hyatt Regency Bali"}
            </Text>
            <IconButton style={styles.favoriteButton}>
              <Heart size={24} color="#FF385C" variant="Outline" />
            </IconButton>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Location size={16} color={styles.locationIcon.color} />
            <Text variant="bodyMediumRegular" color="neutral500" style={{ flex: 1, marginStart: 4 }}>
              {property.address
                ? `${property.address.street || "Jl. Danau Tamblingan No. 89"}, ${property.address.city || "Sanur"}, ${
                    property.address.state || "Denpasar"
                  }`
                : "Jl. Danau Tamblingan No. 89, Sanur, Denpasar"}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingSection}>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((index) => {
                const rating = property.averageRating || 4.8;
                const filled = index <= Math.floor(rating);
                const half = index === Math.ceil(rating) && rating % 1 !== 0;

                return (
                  <Star
                    key={index}
                    size={18}
                    color="#FFB800"
                    weight={filled || half ? "fill" : "regular"}
                    style={styles.starIcon}
                  />
                );
              })}
            </View>
            <Text variant="bodySmallMedium" color="neutral800" style={{ marginRight: 4 }}>
              {property.averageRating?.toFixed(1) || "4.8"}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600" style={{ marginLeft: 4 }}>
              • {property.numberOfReviews || "374"} reviews
            </Text>
          </View>

          {/* Property Facilities */}
          <View style={styles.facilitiesSection}>
            <View style={styles.facilitiesHeader}>
              <Text variant="bodyLargeSemiBold">Property Facilities</Text>
              <IconButton>
                <Text variant="bodyMediumMedium" color="primary">
                  See all
                </Text>
              </IconButton>
            </View>

            <View style={styles.facilitiesGrid}>
              <View style={styles.facilityItem}>
                <View style={styles.facilityIconWrapper}>
                  <Wifi size={24} color={styles.facilityIcon.color} />
                </View>
                <Text variant="bodySmallRegular" color="neutral500" style={{ textAlign: "center" }}>
                  Wifi
                </Text>
              </View>
              <View style={styles.facilityItem}>
                <View style={styles.facilityIconWrapper}>
                  <SwimmingPoolIcon size={24} color={styles.facilityIcon.color} />
                </View>
                <Text variant="bodySmallRegular" color="neutral500" style={{ textAlign: "center" }}>
                  Pool
                </Text>
              </View>
              <View style={styles.facilityItem}>
                <View style={styles.facilityIconWrapper}>
                  <IslandIcon size={24} color={styles.facilityIcon.color} />
                </View>
                <Text variant="bodySmallRegular" color="neutral500" style={{ textAlign: "center" }}>
                  Beach
                </Text>
              </View>
              <View style={styles.facilityItem}>
                <View style={styles.facilityIconWrapper}>
                  <WindIcon size={24} color={styles.facilityIcon.color} />
                </View>
                <Text variant="bodySmallRegular" color="neutral500" style={{ textAlign: "center" }}>
                  AC
                </Text>
              </View>
              <View style={styles.facilityItem}>
                <View style={styles.facilityIconWrapper}>
                  <BarbellIcon size={24} color={styles.facilityIcon.color} />
                </View>
                <Text variant="bodySmallRegular" color="neutral500" style={{ textAlign: "center" }}>
                  Gym
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text variant="bodyLargeSemiBold" style={{ marginBottom: 16 }}>
              Description
            </Text>
            <Text variant="bodyMediumRegular" color="neutral500" style={{ marginBottom: 8 }}>
              {property.description && property.description.length > 200 && !showFullDescription
                ? truncateText(property.description, 200)
                : property.description ||
                  "Set on the old site of Bali Hyatt on the main street of Sanur, the hotel is located on a delightful beachfront and nine hectares of lush."}
            </Text>
            {property.description && property.description.length > 200 && (
              <IconButton onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text variant="bodyMediumRegular" color="primary">
                  {showFullDescription ? "Show less" : "Read more"}
                </Text>
              </IconButton>
            )}
          </View>

          {/* Extra spacing for fixed bottom section */}
          <View style={styles.bottomSpacer} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Fixed Bottom Price and Booking Section */}
      <Animated.View
        style={[styles.fixedBottomSection, { paddingBottom: Math.max(insets.bottom, 16) }, contentAnimatedStyle]}
      >
        <View style={styles.priceSection}>
          <View style={styles.priceInfo}>
            <Text variant="bodySmallRegular" color="neutral500">
              Price
            </Text>
            <View style={styles.priceRow}>
              <Text variant="h5SemiBold">
                {formatPrice(property.price?.basePrice || property.price?.pricePerNight || 56)}
              </Text>
              <Text variant="bodyXSmallRegular" color="neutral500" style={{ marginLeft: 4 }}>
                / night
              </Text>
            </View>
          </View>
          <Button variant="filled" size="medium">
            Book Now
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    backgroundColor: "transparent",
  },
  placeholderImageContainer: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl + theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  // Header Styles
  header: {
    position: "absolute",
    top: theme.spacing.huge + theme.spacing.xxs,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: theme.layout.headerHeight,
    height: theme.layout.headerHeight,
    borderRadius: theme.layout.headerHeight / 2,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  shareButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: theme.layout.headerHeight,
    height: theme.layout.headerHeight,
    borderRadius: theme.layout.headerHeight / 2,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  imageSpacer: {
    height: SCREEN_WIDTH * 0.75,
  },
  imageCountOverlay: {
    position: "absolute",
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  // Image Gallery Styles
  imageGallery: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm,
    zIndex: 3,
  },
  galleryThumbnail: {
    width: 60,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
    borderWidth: theme.borderWidth.medium,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  moreImagesButton: {
    width: 60,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: theme.borderWidth.medium,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  // Content Styles
  content: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  // Title Section
  titleSection: {
    flex: 1,
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  favoriteButton: {
    marginStart: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  // Location Section
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.base,
  },
  locationIcon: {
    color: theme.colors.neutral500,
    marginRight: theme.spacing.sm,
  },
  // Rating Section
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
  },
  starContainer: {
    flexDirection: "row",
    marginRight: theme.spacing.sm,
  },
  starIcon: {
    marginRight: theme.spacing.xxs,
  },
  // Facilities Section
  facilitiesSection: {
    marginBottom: theme.spacing.xxl,
  },
  facilitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  facilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  facilityItem: {
    alignItems: "center",
    width: "18%",
  },
  facilityIcon: {
    color: theme.colors.text,
  },
  facilityIconWrapper: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.neutral50,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  // Description Section
  descriptionSection: {
    marginBottom: theme.spacing.xxl,
  },
  // Price Section
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bookNowButton: {
    marginLeft: theme.spacing.lg,
  },
  // Fixed Bottom Section
  fixedBottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.sm + theme.spacing.xxs,
    backgroundColor: theme.colors.background,
    ...theme.shadows.lg,
  },
  bottomSpacer: {
    height: theme.spacing.mega + theme.spacing.lg, // Space for fixed bottom section
  },
}));
