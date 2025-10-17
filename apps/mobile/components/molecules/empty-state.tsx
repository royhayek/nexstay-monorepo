import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "@/components/atoms";
import { ms } from "@/utils/scaling";
import { StatusHeader } from "./status-header";

export interface EmptyStateAction {
  /**
   * Button text
   */
  text: string;

  /**
   * Button press handler
   */
  onPress: () => void;

  /**
   * Button variant
   */
  variant?: "filled" | "outlined" | "text";

  /**
   * Button color
   */
  color?: "primary" | "neutral" | "success" | "warning" | "error";

  /**
   * Optional icon to display before text
   */
  icon?: React.ReactNode;

  /**
   * Button size
   */
  size?: "small" | "medium" | "large";
}

export interface EmptyStateProps {
  /**
   * Icon or image to display above the title
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Primary action button configuration
   */
  primaryAction?: EmptyStateAction;

  /**
   * Secondary action button configuration
   */
  secondaryAction?: EmptyStateAction;

  /**
   * Custom action component (overrides primaryAction and secondaryAction)
   */
  action?: React.ReactNode;
}

/**
 * EmptyState - Molecule Component
 *
 * Displays an empty state with icon, title, description, and optional action buttons.
 * Used when lists or sections have no content to display.
 *
 * @example
 * ```tsx
 * // Simple empty state with no actions
 * <EmptyState
 *   icon={<EmptyFolderIcon width={120} height={120} />}
 *   title="No favorites yet"
 *   description="Start exploring and save your favorite properties"
 * />
 *
 * // Empty state with primary action
 * <EmptyState
 *   icon={<Home2 size={80} color={theme.colors.neutral400} variant="Bulk" />}
 *   title="No listings yet"
 *   description="Create your first listing to start earning"
 *   primaryAction={{
 *     text: "Create Listing",
 *     icon: <Add size={20} color={theme.colors.neutral0} variant="Bold" />,
 *     onPress: () => router.push("/create-listing"),
 *     variant: "filled",
 *     color: "primary",
 *   }}
 * />
 *
 * // Empty state with primary and secondary actions
 * <EmptyState
 *   icon={<SearchNormal1 size={80} color={theme.colors.neutral400} />}
 *   title="No results found"
 *   description="Try adjusting your search filters"
 *   primaryAction={{
 *     text: "Clear Filters",
 *     onPress: () => clearFilters(),
 *     variant: "filled",
 *   }}
 *   secondaryAction={{
 *     text: "Browse All",
 *     onPress: () => browseAll(),
 *     variant: "outlined",
 *   }}
 * />
 *
 * // Empty state with custom action component
 * <EmptyState
 *   icon={<Calendar size={80} color={theme.colors.neutral400} />}
 *   title="No bookings"
 *   description="Your booking history will appear here"
 *   action={<CustomActionButtons />}
 * />
 * ```
 */
export function EmptyState({ icon, title, description, primaryAction, secondaryAction, action }: EmptyStateProps) {
  const renderActions = () => {
    // If custom action is provided, use it
    if (action) {
      return <View style={styles.actionContainer}>{action}</View>;
    }

    // Otherwise, render primaryAction and secondaryAction as buttons
    if (!primaryAction && !secondaryAction) {
      return null;
    }

    return (
      <View style={styles.actionContainer}>
        <View style={styles.buttonsContainer}>
          {primaryAction && (
            <Button
              variant={primaryAction.variant || "filled"}
              color={primaryAction.color || "primary"}
              size={primaryAction.size || "medium"}
              onPress={primaryAction.onPress}
              style={styles.actionButton}
            >
              {primaryAction.icon}
              {primaryAction.text}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "outlined"}
              color={secondaryAction.color || "neutral"}
              size={secondaryAction.size || "medium"}
              onPress={secondaryAction.onPress}
              style={styles.actionButton}
            >
              {secondaryAction.icon}
              {secondaryAction.text}
            </Button>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {icon}

      <StatusHeader
        title={title}
        description={description}
        titleVariant="bodyLargeSemiBold"
        spacing="spacious"
        alignment="center"
      />

      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer: {
    marginTop: theme.spacing.lg,
    width: "100%",
  },
  buttonsContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing.sm,
    width: "100%",
  },
  actionButton: {
    minWidth: ms(160),
  },
}));
