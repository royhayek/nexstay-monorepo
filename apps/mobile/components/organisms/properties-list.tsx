import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import { IconButton, Text } from "@/components/atoms";
import { ms, mvs } from "@/utils/scaling";
import { CaretRightIcon } from "phosphor-react-native";
import React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PropertyCard } from "../molecules/property-card";

const CARD_WIDTH = ms(160);

interface PropertiesListProps {
  title?: string;
  properties: PropertyResponseDto[];
  loading?: boolean;
  onPropertyPress?: (property: PropertyResponseDto) => void;
  onFavoritePress?: (property: PropertyResponseDto) => void;
  onSeeAllPress?: () => void;
}

export function PropertiesList({
  title = "Places near you",
  properties,
  loading = false,
  onPropertyPress,
  onFavoritePress,
  onSeeAllPress,
}: PropertiesListProps) {
  const styles = propertiesListStyles;

  const renderProperty = ({ item }: { item: PropertyResponseDto }) => (
    <PropertyCard
      property={item}
      width={CARD_WIDTH}
      onPress={() => onPropertyPress?.(item)}
      onFavoritePress={() => onFavoritePress?.(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLargeRegular" color="textSecondary">
          No properties available
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text variant="bodyLargeSemiBold" color="text">
          {title}
        </Text>
        {onSeeAllPress && (
          <IconButton style={styles.seeAllButton} onPress={onSeeAllPress}>
            <CaretRightIcon size={ms(20)} color="#000" weight="bold" />
          </IconButton>
        )}
      </View>

      <FlatList
        horizontal
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: ms(12) }} />}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + ms(12),
          offset: (CARD_WIDTH + ms(12)) * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={false}
        updateCellsBatchingPeriod={100}
        decelerationRate="fast"
        bounces={true}
        alwaysBounceHorizontal={false}
        overScrollMode="auto"
        nestedScrollEnabled={false}
        directionalLockEnabled={true}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  );
}

const propertiesListStyles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  seeAllButton: {
    padding: theme.spacing.xs,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  loadingContainer: {
    height: mvs(300),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: mvs(200),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
}));
