import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Avatar, Text } from "@/components/atoms";

export interface ProfileInfoCardProps {
  /** Avatar source */
  avatarSource?: string;
  /** User name */
  name: string;
  /** User email or subtitle */
  subtitle: string;
  /** Show edit button */
  showEdit?: boolean;
  /** Edit button callback */
  onEditPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  avatarSource,
  name,
  subtitle,
  showEdit = true,
  onEditPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.profileInfo}>
        <Avatar source={avatarSource} size="medium" initials={name.substring(0, 2)} />
        <View style={styles.profileText}>
          <Text variant="bodyLargeSemiBold" color="neutral800">
            {name}
          </Text>
          <Text variant="bodySmallRegular" color="neutral600">
            {subtitle}
          </Text>
        </View>
      </View>
      {showEdit && onEditPress && (
        <TouchableOpacity onPress={onEditPress} style={styles.editButton} activeOpacity={0.7}>
          <Text variant="bodyMediumMedium" color="neutral800">
            Edit
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  editButton: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
}));
