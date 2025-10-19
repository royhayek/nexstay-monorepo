import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CalendarIcon, MapPinIcon } from "phosphor-react-native";
import { Badge } from "../atoms/badge";
import { Text } from "../atoms/text";
import { ms } from "@/utils/scaling";
import type { BookingResponseDto } from "@/api/models/protected/bookingResponseDto";

export interface BookingCardProps {
  booking: BookingResponseDto;
  onPress: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "confirmed":
        return "success";
      case "checked_in":
        return "info";
      case "checked_out":
        return "neutral";
      case "cancelled":
        return "error";
      default:
        return "neutral";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const propertyImage = booking.property.images?.[0]?.url;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {propertyImage ? (
          <Image source={{ uri: propertyImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text variant="bodySmallRegular" color="textSecondary">
              No Image
            </Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <Badge variant={getStatusColor(booking.status)} size="small">
            {getStatusLabel(booking.status)}
          </Badge>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.content}>
        <Text variant="bodyLargeSemiBold" numberOfLines={2}>
          {booking.property.name}
        </Text>

        {booking.property.address && (
          <View style={styles.locationRow}>
            <MapPinIcon size={ms(14)} />
            <Text variant="bodySmallRegular" color="textSecondary" numberOfLines={1}>
              {booking.property.address.street}, {booking.property.address.country}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.dateInfo}>
            <CalendarIcon size={ms(16)} />
            <View>
              <Text variant="bodyXSmallRegular" color="textSecondary">
                Check-in
              </Text>
              <Text variant="bodySmallSemiBold">{formatDate(booking.checkIn)}</Text>
            </View>
          </View>

          <View style={styles.dateInfo}>
            <CalendarIcon size={ms(16)} />
            <View>
              <Text variant="bodyXSmallRegular" color="textSecondary">
                Check-out
              </Text>
              <Text variant="bodySmallSemiBold">{formatDate(booking.checkOut)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text variant="bodyXSmallRegular" color="textSecondary">
              {booking.nights} {booking.nights === 1 ? "night" : "nights"}
            </Text>
            {booking.confirmationCode && (
              <Text variant="bodyXSmallRegular" color="textSecondary">
                {booking.confirmationCode}
              </Text>
            )}
          </View>
          <Text variant="bodyLargeSemiBold" color="primary">
            ${booking.pricing.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: ms(160),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.base,
    gap: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  divider: {
    height: theme.borderWidth.thin,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  detailsRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
  },
  dateInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: theme.spacing.xs,
  },
}));
