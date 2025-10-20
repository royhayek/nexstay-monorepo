import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, Gallery, DocumentText, User, TickCircle } from "iconsax-react-native";
import * as ImagePicker from "expo-image-picker";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";

interface UploadedImage {
  uri: string;
  type: string;
  name: string;
}

export default function DocumentUploadScreen() {
  const { theme } = useUnistyles();
  const { documentType } = useLocalSearchParams<{ documentType: string }>();

  const [documentFront, setDocumentFront] = useState<UploadedImage | null>(null);
  const [documentBack, setDocumentBack] = useState<UploadedImage | null>(null);
  const [selfie, setSelfie] = useState<UploadedImage | null>(null);

  // Check if document type requires back image (passport doesn't have a back)
  const requiresBackImage = documentType === "national_id" || documentType === "drivers_license" || documentType === "residence_permit";

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos of your documents"
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Gallery permission is required to select photos from your library"
      );
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async (setter: (image: UploadedImage) => void) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setter({
          uri: asset.uri,
          type: "image/jpeg",
          name: `document_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error("Error picking image from camera:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickImageFromGallery = async (setter: (image: UploadedImage) => void) => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setter({
          uri: asset.uri,
          type: "image/jpeg",
          name: `document_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error("Error picking image from gallery:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const showImageSourceOptions = (setter: (image: UploadedImage) => void) => {
    Alert.alert("Select Image Source", "Choose where to get the photo from", [
      {
        text: "Take Photo",
        onPress: () => pickImageFromCamera(setter),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImageFromGallery(setter),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleContinue = () => {
    if (!documentFront) {
      Alert.alert("Required", "Please upload the front of your document");
      return;
    }

    if (requiresBackImage && !documentBack) {
      Alert.alert("Required", "Please upload the back of your document");
      return;
    }

    if (!selfie) {
      Alert.alert("Required", "Please take a live selfie for verification");
      return;
    }

    // Navigate to details form
    router.push({
      pathname: "/identity-verification/details",
      params: {
        documentType,
        documentFrontUri: documentFront.uri,
        documentBackUri: documentBack?.uri || "",
        selfieUri: selfie.uri,
      },
    });
  };

  return (
    <ScreenTemplate title="Upload Documents" showBackButton>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.description}>
            Take clear photos of your document and a live selfie. Make sure all text is readable and there's
            no glare.
          </Text>

          {/* Document Front (Required) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="bodyMediumSemiBold" color="neutral800">
                Document Front
              </Text>
              <View style={styles.requiredBadge}>
                <Text variant="bodyXSmallSemiBold" color="error">
                  Required
                </Text>
              </View>
            </View>
            <UploadBox
              image={documentFront}
              onPress={() => showImageSourceOptions(setDocumentFront)}
              onRemove={() => setDocumentFront(null)}
              icon={<DocumentText size={ms(40)} color={theme.colors.neutral400} variant="Bulk" />}
              label="Front of Document"
            />
          </View>

          {/* Document Back (Conditional) */}
          {requiresBackImage && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="bodyMediumSemiBold" color="neutral800">
                  Document Back
                </Text>
                <View style={styles.requiredBadge}>
                  <Text variant="bodyXSmallSemiBold" color="error">
                    Required
                  </Text>
                </View>
              </View>
              <UploadBox
                image={documentBack}
                onPress={() => showImageSourceOptions(setDocumentBack)}
                onRemove={() => setDocumentBack(null)}
                icon={<DocumentText size={ms(40)} color={theme.colors.neutral400} variant="Bulk" />}
                label="Back of Document"
              />
            </View>
          )}

          {/* Live Selfie (Required) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="bodyMediumSemiBold" color="neutral800">
                Live Selfie
              </Text>
              <View style={styles.requiredBadge}>
                <Text variant="bodyXSmallSemiBold" color="error">
                  Required
                </Text>
              </View>
            </View>
            <Text variant="bodySmallRegular" color="neutral600" style={styles.sectionNote}>
              Take a clear photo of your face for identity verification
            </Text>
            <UploadBox
              image={selfie}
              onPress={() => showImageSourceOptions(setSelfie)}
              onRemove={() => setSelfie(null)}
              icon={<User size={ms(40)} color={theme.colors.neutral400} variant="Bulk" />}
              label="Your live selfie"
            />
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text variant="bodySmallSemiBold" color="neutral800" style={styles.guidelinesTitle}>
              Photo Guidelines:
            </Text>
            <GuidelineItem text="Take photos in good lighting" />
            <GuidelineItem text="Ensure all text on document is clearly readable" />
            <GuidelineItem text="Avoid glare and shadows" />
            <GuidelineItem text="Include all corners of the document" />
            <GuidelineItem text="Make sure document is not expired" />
            <GuidelineItem text="Face should be clearly visible in selfie" />
            <GuidelineItem text="No hats or sunglasses in selfie" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button variant="filled" color="primary" onPress={handleContinue}>
            Continue
          </Button>
        </View>
      </View>
    </ScreenTemplate>
  );
}

// Upload Box Component
interface UploadBoxProps {
  image: UploadedImage | null;
  onPress: () => void;
  onRemove: () => void;
  icon: React.ReactNode;
  label: string;
}

function UploadBox({ image, onPress, onRemove, icon, label }: UploadBoxProps) {
  const { theme } = useUnistyles();

  if (image) {
    return (
      <View style={uploadBoxStyles.uploadedContainer}>
        <Image source={{ uri: image.uri }} style={uploadBoxStyles.uploadedImage} resizeMode="cover" />
        <View style={uploadBoxStyles.uploadedOverlay}>
          <View style={uploadBoxStyles.successBadge}>
            <TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />
            <Text variant="bodySmallSemiBold" color="success" style={uploadBoxStyles.successText}>
              Uploaded
            </Text>
          </View>
          <View style={uploadBoxStyles.uploadedActions}>
            <TouchableOpacity style={uploadBoxStyles.actionButton} onPress={onPress}>
              <Text variant="bodySmallSemiBold" color="primary">
                Replace
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={uploadBoxStyles.actionButton} onPress={onRemove}>
              <Text variant="bodySmallSemiBold" color="error">
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={uploadBoxStyles.container} onPress={onPress} activeOpacity={0.7}>
      {icon}
      <Text variant="bodySmallRegular" color="neutral600" style={uploadBoxStyles.label}>
        {label}
      </Text>
      <View style={uploadBoxStyles.buttonContainer}>
        <View style={uploadBoxStyles.iconButton}>
          <Camera size={ms(20)} color={theme.colors.primary} variant="Bold" />
        </View>
        <View style={uploadBoxStyles.iconButton}>
          <Gallery size={ms(20)} color={theme.colors.primary} variant="Bold" />
        </View>
      </View>
      <Text variant="bodyXSmallRegular" color="primary">
        Take photo or choose from gallery
      </Text>
    </TouchableOpacity>
  );
}

const uploadBoxStyles = StyleSheet.create((theme) => ({
  container: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.neutral300,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: mvs(200),
    backgroundColor: theme.colors.surface,
  },
  label: {
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  iconButton: {
    width: ms(48),
    height: mvs(48),
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedContainer: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    height: mvs(200),
    position: "relative",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  uploadedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "space-between",
    padding: theme.spacing.md,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.neutral0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  successText: {
    marginLeft: theme.spacing.xs,
  },
  uploadedActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.neutral0,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
}));

// Guideline Item Component
function GuidelineItem({ text }: { text: string }) {
  const { theme } = useUnistyles();
  return (
    <View style={guidelineStyles.container}>
      <View style={guidelineStyles.bullet} />
      <Text variant="bodySmallRegular" color="neutral600">
        {text}
      </Text>
    </View>
  );
}

const guidelineStyles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: theme.spacing.xs,
  },
  bullet: {
    width: ms(6),
    height: mvs(6),
    borderRadius: ms(3),
    backgroundColor: theme.colors.neutral600,
    marginTop: mvs(6),
    marginRight: theme.spacing.sm,
  },
}));

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(100),
  },
  description: {
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  requiredBadge: {
    backgroundColor: theme.colors.errorLight || theme.colors.error + "15",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  optionalBadge: {
    backgroundColor: theme.colors.neutral200,
  },
  sectionNote: {
    marginBottom: theme.spacing.md,
  },
  guidelines: {
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "10",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  guidelinesTitle: {
    marginBottom: theme.spacing.sm,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(40),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral200,
    backgroundColor: theme.colors.background,
  },
}));
