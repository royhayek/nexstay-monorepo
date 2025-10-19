import { Badge, IconButton, Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";
import { SearchNormal1, Setting4 } from "iconsax-react-native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface SearchBarProps {
  placeholder?: string;
  filterCount?: number;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
}

export function SearchBar({
  placeholder = "Search for your nexstay",
  filterCount = 0,
  onSearchPress,
  onFilterPress,
}: SearchBarProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchTouchable} onPress={onSearchPress} activeOpacity={0.7}>
        <View style={styles.searchContainer}>
          <View style={styles.leftIconContainer}>
            <SearchNormal1 size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
          </View>

          <View style={styles.textContainer}>
            <Text variant="bodyMediumRegular" color="neutral600">
              {placeholder}
            </Text>
          </View>

          <IconButton style={styles.filterButton} onPress={onFilterPress}>
            <Badge showDot={filterCount > 0}>
              <Setting4 size={ms(20)} color={theme.colors.neutral800} variant="Outline" />
            </Badge>
          </IconButton>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  searchTouchable: {
    flex: 1,
  },
  searchContainer: {
    elevation: 2,
    shadowRadius: 3,
    minHeight: ms(56),
    shadowOpacity: 0.1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    shadowOffset: { width: 0, height: 1 },
    backgroundColor: theme.colors.neutral0,
  },
  leftIconContainer: {
    marginRight: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  filterButton: {
    marginLeft: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xs,
  },
}));
