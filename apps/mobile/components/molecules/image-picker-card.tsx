import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { TouchableOpacity, View, Image, ViewStyle, ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Gallery, Trash, CloseCircle } from "iconsax-react-native";
import { Text } from "../atoms/text";

export interface ImagePickerCardProps {
  images: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
  uploading?: boolean;
  style?: ViewStyle;
}

export const ImagePickerCard: React.FC<ImagePickerCardProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  maxImages = 10,
  uploading = false,
  style,
}) => {
  const canAddMore = images.length < maxImages;

  return (
    <View style={[styles.container, style]}>
      {/* Image Grid */}
      <View style={styles.grid}>
        {images.map((imageUri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveImage(index)}
              activeOpacity={0.7}
            >
              <CloseCircle size={ms(24)} color="#FFFFFF" variant="Bold" />
            </TouchableOpacity>

            {/* Primary Badge for first image */}
            {index === 0 && (
              <View style={styles.primaryBadge}>
                <Text variant="bodyXSmallSemiBold" color="onPrimary">
                  Primary
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Add Image Button */}
        {canAddMore && (
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={onAddImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={styles.addImageIcon.color} />
            ) : (
              <>
                <Gallery size={ms(32)} color={styles.addImageIcon.color} variant="Bulk" />
                <Text variant="bodySmallMedium" color="neutral600" style={styles.addImageText}>
                  Add photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Image Counter */}
      <View style={styles.footer}>
        <Text variant="bodySmallRegular" color="neutral600">
          {images.length} / {maxImages} photos
        </Text>
        {images.length === 0 && (
          <Text variant="bodyXSmallRegular" color="error" style={styles.errorText}>
            At least 1 photo is required
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    // Container styles
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing.xs,
  },
  imageContainer: {
    width: "31%",
    aspectRatio: 1,
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.neutral200,
  },
  removeButton: {
    position: "absolute",
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: ms(12),
  },
  primaryBadge: {
    position: "absolute",
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.sm,
  },
  addImageButton: {
    width: "31%",
    aspectRatio: 1,
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.medium,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageIcon: {
    color: theme.colors.neutral400,
  },
  addImageText: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: theme.spacing.base,
    alignItems: "center",
  },
  errorText: {
    marginTop: theme.spacing.xxs,
  },
}));
