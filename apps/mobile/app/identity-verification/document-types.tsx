import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router } from "expo-router";
import { DocumentText, Global, Car, CardPos } from "iconsax-react-native";
import { useQuery } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import { identityVerificationAppControllerGetSupportedDocumentTypes } from "@/api/queries/protected/identity-verification/identity-verification";

interface DocumentTypeOption {
  type: string;
  displayName: string;
  description: string;
  requiresBackImage: boolean;
  icon: React.ReactNode;
}

export default function DocumentTypesScreen() {
  const { theme } = useUnistyles();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch supported document types
  const {
    data: documentTypesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/v1/app/identity-verification/document-types"],
    queryFn: () => identityVerificationAppControllerGetSupportedDocumentTypes(),
  });

  const documentTypes = documentTypesResponse?.data;

  const handleContinue = () => {
    if (!selectedType) return;

    // Navigate to document upload screen with selected type
    router.push({
      pathname: "/identity-verification/upload",
      params: { documentType: selectedType },
    });
  };

  // Get icon for document type
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "passport":
        return <Global size={ms(32)} color={theme.colors.primary} variant="Bold" />;
      case "national_id":
        return <CardPos size={ms(32)} color={theme.colors.primary} variant="Bold" />;
      case "drivers_license":
        return <Car size={ms(32)} color={theme.colors.primary} variant="Bold" />;
      case "residence_permit":
        return <DocumentText size={ms(32)} color={theme.colors.primary} variant="Bold" />;
      default:
        return <DocumentText size={ms(32)} color={theme.colors.primary} variant="Bold" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ScreenTemplate title="Select Document Type" showBackButton>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
            Loading document types...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  // Error state
  if (error || !documentTypes || documentTypes.length === 0) {
    return (
      <ScreenTemplate title="Select Document Type" showBackButton>
        <View style={styles.errorContainer}>
          <EmptyState
            icon={<DocumentText size={ms(80)} color={theme.colors.neutral400} variant="Bulk" />}
            title="Unable to Load Document Types"
            description="Please try again later"
            primaryAction={{
              text: "Retry",
              onPress: () => refetch(),
              variant: "filled",
              color: "primary",
            }}
          />
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Select Document Type" showBackButton>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.description}>
            Choose the type of government-issued document you want to use for verification
          </Text>

          <View style={styles.optionsContainer}>
            {documentTypes.map((docType) => (
              <DocumentTypeCard
                key={docType.type}
                type={docType.type}
                displayName={docType.displayName}
                description={docType.description}
                requiresBackImage={docType.requiresBackImage}
                icon={getDocumentIcon(docType.type)}
                isSelected={selectedType === docType.type}
                onPress={() => setSelectedType(docType.type)}
              />
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text variant="bodySmallSemiBold" color="neutral800">
              Important:
            </Text>
            <Text variant="bodySmallRegular" color="neutral600" style={styles.infoText}>
              • Make sure your document is valid and not expired{"\n"}
              • All information must be clearly visible{"\n"}
              • Photos should be taken in good lighting{"\n"}
              • Ensure there's no glare or shadows
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="filled"
            color="primary"
            onPress={handleContinue}
            disabled={!selectedType}
          >
            Continue
          </Button>
        </View>
      </View>
    </ScreenTemplate>
  );
}

// Document Type Card Component
interface DocumentTypeCardProps {
  type: string;
  displayName: string;
  description: string;
  requiresBackImage: boolean;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
}

function DocumentTypeCard({
  displayName,
  description,
  requiresBackImage,
  icon,
  isSelected,
  onPress,
}: DocumentTypeCardProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity
      style={[
        cardStyles.container,
        isSelected && {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary + "10",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.iconContainer}>{icon}</View>

      <View style={cardStyles.content}>
        <Text variant="bodyMediumSemiBold" color="neutral800">
          {displayName}
        </Text>
        <Text variant="bodySmallRegular" color="neutral600" style={cardStyles.description}>
          {description}
        </Text>
        {requiresBackImage && (
          <Text variant="bodyXSmallRegular" color="primary" style={cardStyles.badge}>
            Requires front & back photos
          </Text>
        )}
      </View>

      <View
        style={[
          cardStyles.radio,
          isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
        ]}
      >
        {isSelected && <View style={cardStyles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.neutral200,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: ms(56),
    height: mvs(56),
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: theme.spacing.xs,
  },
  badge: {
    marginTop: theme.spacing.xs,
  },
  radio: {
    width: ms(24),
    height: mvs(24),
    borderRadius: ms(12),
    borderWidth: 2,
    borderColor: theme.colors.neutral300,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: ms(12),
    height: mvs(12),
    borderRadius: ms(6),
    backgroundColor: theme.colors.neutral0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  description: {
    marginBottom: theme.spacing.xl,
  },
  optionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "10",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(40),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral200,
    backgroundColor: theme.colors.background,
  },
}));
