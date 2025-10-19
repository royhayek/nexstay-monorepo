import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, View, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Setting4 } from "iconsax-react-native";

import { EmptyState } from "@/components/molecules";
import { PropertyCard } from "@/components/molecules/property-card";
import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { mvs, ms } from "@/utils/scaling";
import { usePropertiesPublicControllerSearch } from "@/api/queries/public/properties-public/properties-public";
import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [searchFilters, setSearchFilters] = useState<any>(null);
  const [page, setPage] = useState(1);

  const searchMutation = usePropertiesPublicControllerSearch();

  useEffect(() => {
    if (params.filters) {
      const filters = JSON.parse(params.filters as string);
      setSearchFilters(filters);
      performSearch(filters, 1);
    }
  }, [params.filters]);

  const performSearch = (filters: any, pageNum: number) => {
    searchMutation.mutate({
      data: {
        ...filters,
        page: pageNum,
        limit: 20,
      },
    });
  };

  const handleRefresh = () => {
    if (searchFilters) {
      setPage(1);
      performSearch(searchFilters, 1);
    }
  };

  const handleLoadMore = () => {
    const responseData = searchMutation.data as any;
    if (responseData?.data?.hasNextPage && !searchMutation.isPending) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(searchFilters, nextPage);
    }
  };

  const handlePropertyPress = (property: PropertyResponseDto) => {
    if (!property || !property._id) {
      return;
    }
    router.push(`/property/${property._id}`);
  };

  const handleFilterPress = () => {
    router.back();
  };

  const responseData = searchMutation.data as any;
  const properties = responseData?.data?.items || [];
  const total = responseData?.data?.total || 0;
  const hasNextPage = responseData?.data?.hasNextPage || false;

  const renderPropertyCard = ({ item }: { item: PropertyResponseDto }) => (
    <PropertyCard property={item} onPress={() => handlePropertyPress(item)} />
  );

  const renderListHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text variant="bodyLargeSemiBold">
          {total} {total === 1 ? "Property" : "Properties"} Found
        </Text>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress} activeOpacity={0.7}>
          <Setting4 size={ms(20)} variant="Outline" />
          <Text variant="bodySmallSemiBold">Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (searchMutation.isPending && page > 1) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmallRegular" color="textSecondary">
            Loading more...
          </Text>
        </View>
      );
    }

    if (hasNextPage && !searchMutation.isPending) {
      return (
        <View style={styles.loadMoreContainer}>
          <Button variant="outlined" size="medium" onPress={handleLoadMore}>
            Load More
          </Button>
        </View>
      );
    }

    if (properties.length > 0 && !hasNextPage) {
      return (
        <View style={styles.endMessage}>
          <Text variant="bodySmallRegular" color="textSecondary" textAlign="center">
            You&apos;ve reached the end
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateWrapper}>
      <EmptyState
        icon={
          <Image source={require("@/assets/images/empty-folder.png")} style={styles.emptyIcon} resizeMode="contain" />
        }
        title="No Properties Found"
        description="Try adjusting your filters or search criteria to find what you&apos;re looking for."
      />
      <Button variant="filled" size="medium" onPress={handleFilterPress} style={styles.modifyFiltersButton}>
        Modify Filters
      </Button>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorStateWrapper}>
      <Text variant="bodyLargeSemiBold" textAlign="center">
        Unable to Search Properties
      </Text>
      <Text variant="bodyMediumRegular" color="textSecondary" textAlign="center" style={styles.errorMessage}>
        {searchMutation.error instanceof Error
          ? searchMutation.error.message
          : "Something went wrong. Please try again."}
      </Text>
      <Button variant="filled" size="medium" onPress={handleRefresh}>
        Try Again
      </Button>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search Results",
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        {searchMutation.isError ? (
          renderErrorState()
        ) : searchMutation.isPending && page === 1 ? (
          <>
            {renderListHeader()}
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
                Searching properties...
              </Text>
            </View>
          </>
        ) : (
          <FlatList
            data={properties}
            renderItem={renderPropertyCard}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[styles.listContent, properties.length === 0 && styles.emptyListContent]}
            refreshControl={<RefreshControl refreshing={searchMutation.isPending && page === 1} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: mvs(100),
  },
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
  modifyFiltersButton: {
    marginTop: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
  },
  loadingFooter: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  loadMoreContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  endMessage: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  errorStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorMessage: {
    marginBottom: theme.spacing.md,
  },
}));
