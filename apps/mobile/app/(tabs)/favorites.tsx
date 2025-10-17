import React, { useState } from "react";
import { Image, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Input } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { mvs } from "@/utils/scaling";
import { SearchNormal1 } from "iconsax-react-native";

export default function FavoritesScreen() {
  const { theme } = useUnistyles();
  const [searchQuery, setSearchQuery] = useState("");
  const favorites = []; // This would be connected to your state management

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

        {/* Content */}
        {favorites.length === 0 ? (
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
              description="Start adding items to your favorites list for quick access"
            />
          </View>
        ) : (
          <View style={styles.content}>{/* Favorites list would go here */}</View>
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
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
}));
