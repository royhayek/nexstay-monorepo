import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { RatingInput } from "@/components/molecules";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeftIcon,
  CameraIcon,
  XIcon,
} from "phosphor-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import * as ImagePicker from "expo-image-picker";
import type { CreateReviewDto } from "@/api/models/protected/createReviewDto";
import { useReviewsAppControllerCreateReview } from "@/api/queries/protected/reviews/reviews";
import { CreateReviewDtoReviewType } from "@/api/models/protected/createReviewDtoReviewType";

interface RatingCategory {
  key: keyof Omit<CreateReviewDto, "propertyId" | "bookingId" | "reviewType" | "revieweeId" | "publicReview" | "privateFeedback">;
  label: string;
  description: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  {
    key: "cleanliness",
    label: "Cleanliness",
    description: "How clean was the property?",
  },
  {
    key: "accuracy",
    label: "Accuracy",
    description: "How accurate was the listing description?",
  },
  {
    key: "checkIn",
    label: "Check-in",
    description: "How smooth was the check-in process?",
  },
  {
    key: "communication",
    label: "Communication",
    description: "How well did the host communicate?",
  },
  {
    key: "location",
    label: "Location",
    description: "How was the property's location?",
  },
  {
    key: "value",
    label: "Value",
    description: "How was the value for money?",
  },
];

export default function WriteReviewScreen() {
  const { bookingId } = useLocalSearchParams<{
    bookingId: string;
    propertyId?: string;
    hostId?: string;
  }>();

  const propertyId = useLocalSearchParams<{ propertyId?: string }>().propertyId;
  const hostId = useLocalSearchParams<{ hostId?: string }>().hostId;

  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);

  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [checkIn, setCheckIn] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [location, setLocation] = useState(0);
  const [value, setValue] = useState(0);

  // Review text states
  const [publicReview, setPublicReview] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");

  // Photo states
  const [photos, setPhotos] = useState<string[]>([]);

  const createReviewMutation = useReviewsAppControllerCreateReview({
    mutation: {
      onSuccess: () => {
        Alert.alert(
          "Review Submitted",
          "Thank you for your review!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      },
      onError: (error: any) => {
        setSubmitting(false);
        Alert.alert(
          "Submission Failed",
          error?.response?.data?.message ||
            error?.message ||
            "Unable to submit review. Please try again.",
          [{ text: "OK" }]
        );
      },
    },
  });

  const handleBack = () => {
    if (overallRating > 0 || publicReview.length > 0) {
      Alert.alert(
        "Discard Review?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert("Maximum Photos", "You can upload up to 5 photos.");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 5));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const calculateAverageRating = () => {
    const ratings = [cleanliness, accuracy, checkIn, communication, location, value];
    const validRatings = ratings.filter((r) => r > 0);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
  };

  const validateReview = (): string | null => {
    if (overallRating === 0) {
      return "Please provide an overall rating";
    }

    if (publicReview.trim().length < 10) {
      return "Please write at least 10 characters for your review";
    }

    if (publicReview.trim().length > 1000) {
      return "Review must be 1000 characters or less";
    }

    if (privateFeedback.length > 500) {
      return "Private feedback must be 500 characters or less";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateReview();
    if (validationError) {
      Alert.alert("Invalid Review", validationError);
      return;
    }

    if (!propertyId || !hostId) {
      Alert.alert("Missing Information", "Property or host information is missing.");
      return;
    }

    setSubmitting(true);

    try {
      const reviewData: CreateReviewDto = {
        bookingId,
        propertyId,
        revieweeId: hostId,
        reviewType: CreateReviewDtoReviewType.guest_to_host,
        overallRating,
        cleanliness: cleanliness > 0 ? cleanliness : undefined,
        accuracy: accuracy > 0 ? accuracy : undefined,
        checkIn: checkIn > 0 ? checkIn : undefined,
        communication: communication > 0 ? communication : undefined,
        location: location > 0 ? location : undefined,
        value: value > 0 ? value : undefined,
        publicReview: publicReview.trim(),
        privateFeedback: privateFeedback.trim() || undefined,
      };

      await createReviewMutation.mutateAsync({ data: reviewData });

      // Note: Photo upload would be handled separately after review creation
      // using the useReviewsAppControllerUploadReviewPhotos mutation
    } catch (error) {
      // Error handling is done in the mutation onError callback
    }
  };

  const avgRating = calculateAverageRating();
  const canSubmit = overallRating > 0 && publicReview.trim().length >= 10 && !submitting;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon={ArrowLeftIcon} onPress={handleBack} size="md" variant="ghost" />
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating *</Text>
          <View style={styles.overallRatingContainer}>
            <RatingInput
              value={overallRating}
              onChange={setOverallRating}
              starSize={40}
            />
            {overallRating > 0 && (
              <Text style={styles.ratingText}>{overallRating.toFixed(1)} stars</Text>
            )}
          </View>
        </View>

        {/* Category Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          <Text style={styles.sectionDescription}>
            Rate specific aspects of your stay (optional)
          </Text>

          {avgRating > 0 && (
            <View style={styles.avgRatingCard}>
              <Text style={styles.avgRatingLabel}>Average from categories</Text>
              <Text style={styles.avgRatingValue}>{avgRating.toFixed(1)} ★</Text>
            </View>
          )}

          <View style={styles.categoriesContainer}>
            <View style={styles.categoryRow}>
              <View style={styles.category}>
                <RatingInput
                  value={cleanliness}
                  onChange={setCleanliness}
                  label="Cleanliness"
                  starSize={24}
                />
              </View>
              <View style={styles.category}>
                <RatingInput
                  value={accuracy}
                  onChange={setAccuracy}
                  label="Accuracy"
                  starSize={24}
                />
              </View>
            </View>

            <View style={styles.categoryRow}>
              <View style={styles.category}>
                <RatingInput
                  value={checkIn}
                  onChange={setCheckIn}
                  label="Check-in"
                  starSize={24}
                />
              </View>
              <View style={styles.category}>
                <RatingInput
                  value={communication}
                  onChange={setCommunication}
                  label="Communication"
                  starSize={24}
                />
              </View>
            </View>

            <View style={styles.categoryRow}>
              <View style={styles.category}>
                <RatingInput
                  value={location}
                  onChange={setLocation}
                  label="Location"
                  starSize={24}
                />
              </View>
              <View style={styles.category}>
                <RatingInput
                  value={value}
                  onChange={setValue}
                  label="Value"
                  starSize={24}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Public Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review *</Text>
          <Text style={styles.sectionDescription}>
            Share your experience with future guests
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your stay, what you loved, and any suggestions..."
            placeholderTextColor="#9CA3AF"
            value={publicReview}
            onChangeText={setPublicReview}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {publicReview.length}/1000 characters
          </Text>
        </View>

        {/* Private Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Private Feedback</Text>
          <Text style={styles.sectionDescription}>
            Share private feedback with the host (optional, not public)
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any private feedback for the host..."
            placeholderTextColor="#9CA3AF"
            value={privateFeedback}
            onChangeText={setPrivateFeedback}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {privateFeedback.length}/500 characters
          </Text>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos</Text>
          <Text style={styles.sectionDescription}>
            Share photos from your stay (up to 5 photos)
          </Text>

          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <XIcon size={16} color="#fff" weight="bold" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <CameraIcon size={32} color="#6B7280" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            By submitting this review, you agree that it complies with our review guidelines.
            Your review will be posted publicly.
          </Text>
        </View>

        <View style={{ height: ms(100) }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(16) }]}>
        <Button
          onPress={handleSubmit}
          loading={submitting || createReviewMutation.isPending}
          disabled={!canSubmit}
          fullWidth
        >
          Submit Review
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: ms(16),
  },
  section: {
    marginTop: ms(24),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: "600",
    color: "#111827",
    marginBottom: ms(8),
  },
  sectionDescription: {
    fontSize: ms(14),
    color: "#6B7280",
    marginBottom: ms(16),
  },
  overallRatingContainer: {
    alignItems: "center",
    paddingVertical: ms(16),
    backgroundColor: "#F9FAFB",
    borderRadius: ms(12),
  },
  ratingText: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#111827",
    marginTop: ms(12),
  },
  avgRatingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    padding: ms(12),
    borderRadius: ms(8),
    marginBottom: ms(16),
  },
  avgRatingLabel: {
    fontSize: ms(14),
    color: "#4F46E5",
    fontWeight: "500",
  },
  avgRatingValue: {
    fontSize: ms(18),
    fontWeight: "700",
    color: "#4F46E5",
  },
  categoriesContainer: {
    gap: ms(16),
  },
  categoryRow: {
    flexDirection: "row",
    gap: ms(16),
  },
  category: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: ms(12),
    borderRadius: ms(12),
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: ms(12),
    padding: ms(16),
    fontSize: ms(16),
    color: "#111827",
    minHeight: ms(120),
  },
  charCount: {
    fontSize: ms(12),
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: ms(8),
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ms(12),
  },
  photoItem: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(12),
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: ms(8),
    right: ms(8),
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(12),
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  addPhotoText: {
    fontSize: ms(12),
    color: "#6B7280",
    marginTop: ms(4),
  },
  infoBox: {
    backgroundColor: "#FFFBEB",
    padding: ms(16),
    borderRadius: ms(12),
    marginTop: ms(24),
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  infoText: {
    fontSize: ms(13),
    color: "#92400E",
    lineHeight: ms(18),
  },
  footer: {
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
});
