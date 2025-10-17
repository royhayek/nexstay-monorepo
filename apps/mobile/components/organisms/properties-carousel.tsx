import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import { IconButton, Text } from "@/components/atoms";
import { EmptyState } from "@/components/molecules/empty-state";
import { PropertyCard } from "@/components/molecules/property-card";
import { ms, mvs } from "@/utils/scaling";
import { CaretRightIcon, HouseSimpleIcon } from "phosphor-react-native";
import React, { useCallback, useRef } from "react";
import { Dimensions, FlatList, View } from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const { width: screenWidth } = Dimensions.get("window");
const HORIZONTAL_PADDING = ms(24); // xl padding (theme.spacing.xl)
const CARD_SPACING = ms(16); // md spacing between cards
const CARD_WIDTH = screenWidth - HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = mvs(200);

interface PropertiesCarouselProps {
  title?: string;
  properties: PropertyResponseDto[];
  loading?: boolean;
  onPropertyPress?: (property: PropertyResponseDto) => void;
  onFavoritePress?: (property: PropertyResponseDto) => void;
  onSeeAllPress?: () => void;
}

interface AnimatedCardProps {
  item: PropertyResponseDto;
  index: number;
  scrollX: SharedValue<number>;
  onPropertyPress?: (property: PropertyResponseDto) => void;
  onFavoritePress?: (property: PropertyResponseDto) => void;
}

const AnimatedCard = React.memo(({ item, index, scrollX, onPropertyPress, onFavoritePress }: AnimatedCardProps) => {
  const itemWidth = CARD_WIDTH + CARD_SPACING; // Card width + spacing
  const inputRange = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], "clamp");
    const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], "clamp");

    return {
      transform: [{ scale }],
      opacity,
    };
  }, []);

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <PropertyCard
        property={item}
        width={CARD_WIDTH}
        imageHeight={mvs(220)}
        titleVariant="bodyMediumSemiBold"
        onPress={() => onPropertyPress?.(item)}
        onFavoritePress={() => onFavoritePress?.(item)}
      />
    </Animated.View>
  );
});

AnimatedCard.displayName = "AnimatedCard";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<PropertyResponseDto>);

export function PropertiesCarousel({
  title = "Popular homestays",
  properties,
  loading = false,
  onPropertyPress,
  onFavoritePress,
  onSeeAllPress,
}: PropertiesCarouselProps) {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<PropertyResponseDto>>(null);
  const { theme } = useUnistyles();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderProperty = useCallback(
    ({ item, index }: { item: PropertyResponseDto; index: number }) => (
      <AnimatedCard
        item={item}
        index={index}
        scrollX={scrollX}
        onPropertyPress={onPropertyPress}
        onFavoritePress={onFavoritePress}
      />
    ),
    [scrollX, onPropertyPress, onFavoritePress]
  );

  const keyExtractor = useCallback((item: PropertyResponseDto) => item._id, []);

  if (loading) {
    return (
      <View>
        <View style={styles.header}>
          <Text variant="bodyLargeSemiBold" color="text">
            {title}
          </Text>
        </View>
        <View style={styles.loadingPlaceholder}>
          <View style={styles.placeholderCard} />
        </View>
      </View>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<HouseSimpleIcon size={ms(80)} color={theme.colors.neutral400} weight="light" />}
          title="No properties available"
          description="Check back later for new listings"
        />
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
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

      {/* Animated Carousel */}
      <AnimatedFlatList
        ref={flatListRef}
        data={properties}
        renderItem={renderProperty}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        decelerationRate={0.9}
        snapToOffsets={properties.map((_, index) => index * (CARD_WIDTH + CARD_SPACING))}
        snapToAlignment="start"
        contentContainerStyle={styles.carouselContainer}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        updateCellsBatchingPeriod={100}
        disableIntervalMomentum={true}
        bounces={true}
        bouncesZoom={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
        directionalLockEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  seeAllButton: {
    padding: theme.spacing.xs,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    marginRight: CARD_SPACING,
  },
  carouselContainer: {
    paddingHorizontal: theme.spacing.xl,
  },
  loadingPlaceholder: {
    paddingHorizontal: theme.spacing.xl,
  },
  placeholderCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.neutral200,
    borderRadius: theme.borderRadius.lg,
  },
  emptyContainer: {
    height: mvs(200),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
}));
