import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface EmptyFolderIconProps {
  size?: number;
  color?: string;
}

export function EmptyFolderIcon({ size = ms(120), color }: EmptyFolderIconProps) {
  const styles = emptyFolderStyles;
  const fillColor = color || styles.accentBar.backgroundColor;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.folderBack}>
        <View style={styles.folderTab} />
      </View>
      <View style={styles.folderFront}>
        <View style={[styles.accentBar, { backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const emptyFolderStyles = StyleSheet.create((theme) => ({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  folderBack: {
    position: "absolute",
    width: "85%",
    height: "70%",
    backgroundColor: theme.colors.neutral200,
    borderRadius: theme.borderRadius.md,
    bottom: "15%",
  },
  folderTab: {
    position: "absolute",
    top: -mvs(8),
    left: ms(12),
    width: "30%",
    height: mvs(16),
    backgroundColor: theme.colors.neutral200,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
  },
  folderFront: {
    position: "absolute",
    width: "75%",
    height: "60%",
    backgroundColor: theme.colors.neutral100,
    borderRadius: theme.borderRadius.md,
    bottom: "20%",
    justifyContent: "flex-end",
    paddingBottom: theme.spacing.md,
    alignItems: "center",
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: mvs(2),
    },
    shadowOpacity: 0.08,
    shadowRadius: mvs(4),
    elevation: 3,
  },
  accentBar: {
    width: "50%",
    height: mvs(6),
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
}));