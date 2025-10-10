import { Badge, IconButton, Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";
import { Ionicons } from "@expo/vector-icons";
import { Notification } from "iconsax-react-native";
import { Image, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface HomeHeaderProps {
  userName?: string;
  userImage?: string | number;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

export function HomeHeader({
  userName = "Mohammad",
  userImage,
  notificationCount = 0,
  onNotificationPress,
}: HomeHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={styles.container}>
      {/* User Info Row */}
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          {userImage ? (
            <Image source={typeof userImage === "string" ? { uri: userImage } : userImage} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
          <View>
            <Text variant="bodySmallMedium" color="neutral600">
              {getGreeting()} 👋
            </Text>
            <Text variant="h6SemiBold">{userName}</Text>
          </View>
        </View>

        <IconButton style={styles.notificationButton} onPress={onNotificationPress}>
          <Badge showDot={notificationCount > 0}>
            <Notification size={ms(20)} color="#000" variant="Outline" />
          </Badge>
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: ms(42),
    height: ms(42),
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.md,
  },
  defaultAvatar: {
    width: ms(42),
    height: ms(42),
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  notificationButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm + 2,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.neutral200,
    borderRadius: theme.borderRadius.full,
  },
}));
