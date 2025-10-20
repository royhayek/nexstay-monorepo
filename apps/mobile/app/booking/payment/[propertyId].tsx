import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { useBooking } from "@/contexts";
import { useAuth } from "@/hooks/use-auth";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  PlusIcon,
  CheckCircleIcon,
} from "phosphor-react-native";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import {
  usePaymentsAppControllerGetEnabledProviders,
  usePaymentsAppControllerCreatePaymentIntent,
  usePaymentsAppControllerConfirmPaymentIntent,
} from "@/api/queries/protected/payments/payments";
import { useBookingsAppControllerCreate } from "@/api/queries/protected/bookings/bookings";
import type { CreateBookingDto } from "@/api/models/protected/createBookingDto";
import type { CurrencyCode } from "@/api/models/protected/currencyCode";
import { CreatePaymentIntentDtoProvider } from "@/api/models/protected/createPaymentIntentDtoProvider";

export default function BookingPaymentScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const insets = useSafeAreaInsets();
  const { bookingDraft, clearBooking } = useBooking();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<"credit_card" | "saved" | null>(null);
  const [processing, setProcessing] = useState(false);

  const property = bookingDraft?.propertyDetails;
  const checkIn = bookingDraft?.checkIn;
  const checkOut = bookingDraft?.checkOut;
  const nights = bookingDraft?.nights || 0;
  const guests = bookingDraft?.guests;

  // Calculate pricing
  const basePrice = (property?.price?.pricePerNight || property?.pricePerNight || 0) * nights;
  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = basePrice * 0.12; // 12% service fee
  const taxes = basePrice * 0.08; // 8% taxes
  const total = basePrice + cleaningFee + serviceFee + taxes;

  // Get enabled payment providers
  const { data: providersData } = usePaymentsAppControllerGetEnabledProviders();

  // Create payment intent mutation
  const createPaymentIntentMutation = usePaymentsAppControllerCreatePaymentIntent();

  // Confirm payment intent mutation
  const confirmPaymentIntentMutation = usePaymentsAppControllerConfirmPaymentIntent();

  // Create booking mutation
  const createBookingMutation = useBookingsAppControllerCreate({
    mutation: {
      onSuccess: (response) => {
        clearBooking();
        router.replace(`/booking/success/${response.data._id}`);
      },
      onError: (error: any) => {
        setProcessing(false);
        Alert.alert(
          "Booking Failed",
          error?.response?.data?.message || error?.message || "Unable to create booking.",
          [{ text: "OK" }]
        );
      },
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleSelectMethod = (method: "credit_card" | "saved") => {
    setSelectedMethod(method);
  };

  const handleAddNewCard = () => {
    // Navigate to credit card input screen
    router.push(`/booking/payment/add-card/${propertyId}`);
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert("Select Payment Method", "Please select a payment method to continue.");
      return;
    }

    if (!checkIn || !checkOut || !guests || !property) {
      Alert.alert("Missing Information", "Please complete all booking steps.");
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create payment intent
      const paymentIntentResponse = await createPaymentIntentMutation.mutateAsync({
        data: {
          amount: {
            amount: total,
            currency: "USD" as CurrencyCode,
          },
          provider: CreatePaymentIntentDtoProvider.aps,
          returnUrl: "nexstay://payment/success",
          cancelUrl: "nexstay://payment/cancel",
          metadata: {
            propertyId: property._id,
            userId: user?.id || "",
            totalAmount: total.toString(),
          },
        },
      });

      const paymentIntentId = paymentIntentResponse.data._id;

      // Step 2: For new credit card, navigate to card input
      if (selectedMethod === "credit_card") {
        // Navigate to card input screen with payment intent
        router.push({
          pathname: `/booking/payment/add-card/${propertyId}`,
          params: { paymentIntentId },
        });
        setProcessing(false);
        return;
      }

      // Step 3: For saved card, confirm payment (mock for now)
      // In production, you would collect CVV and confirm with saved card
      const confirmedPayment = await confirmPaymentIntentMutation.mutateAsync({
        id: paymentIntentId,
        data: {
          paymentMethodId: "saved_card_123", // Replace with actual saved card ID
        },
      });

      // Step 4: Create booking after successful payment
      const bookingData: CreateBookingDto = {
        propertyId: property._id,
        checkIn: checkIn.toISOString().split("T")[0],
        checkOut: checkOut.toISOString().split("T")[0],
        nights,
        guests: {
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
          totalGuests: guests.totalGuests,
        },
        paymentIntentId: paymentIntentId,
        ...(bookingDraft.guestInfo.phone && { guestPhone: bookingDraft.guestInfo.phone }),
        ...(bookingDraft.guestInfo.email && { guestEmail: bookingDraft.guestInfo.email }),
        ...(bookingDraft.arrivalTime && { estimatedArrivalTime: bookingDraft.arrivalTime }),
        ...(bookingDraft.specialRequests && { specialRequests: bookingDraft.specialRequests }),
      };

      createBookingMutation.mutate({ data: bookingData });
    } catch (error: any) {
      setProcessing(false);
      Alert.alert(
        "Payment Failed",
        error?.response?.data?.message || error?.message || "Unable to process payment.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon={ArrowLeftIcon} onPress={handleBack} size="md" variant="ghost" />
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Amount</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base price ({nights} nights)</Text>
            <Text style={styles.priceValue}>${basePrice.toFixed(2)}</Text>
          </View>
          {cleaningFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Cleaning fee</Text>
              <Text style={styles.priceValue}>${cleaningFee.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes</Text>
            <Text style={styles.priceValue}>${taxes.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* Add New Card */}
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              selectedMethod === "credit_card" && styles.paymentMethodSelected,
            ]}
            onPress={() => handleSelectMethod("credit_card")}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.iconContainer}>
                <CreditCardIcon size={24} weight="duotone" color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>Credit or Debit Card</Text>
                <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, Amex</Text>
              </View>
            </View>
            {selectedMethod === "credit_card" && (
              <CheckCircleIcon size={24} weight="fill" color="#10B981" />
            )}
          </TouchableOpacity>

          {/* Saved Cards (Mock - would come from API) */}
          {/* <TouchableOpacity
            style={[
              styles.paymentMethod,
              selectedMethod === "saved" && styles.paymentMethodSelected,
            ]}
            onPress={() => handleSelectMethod("saved")}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={styles.iconContainer}>
                <CreditCardIcon size={24} weight="fill" color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>Visa •••• 4242</Text>
                <Text style={styles.paymentMethodSubtitle}>Expires 12/25</Text>
              </View>
            </View>
            {selectedMethod === "saved" && (
              <CheckCircleIcon size={24} weight="fill" color="#10B981" />
            )}
          </TouchableOpacity> */}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your payment is secure and encrypted. We never store your full card details.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(16) }]}>
        <Button
          onPress={handlePayNow}
          loading={processing || createPaymentIntentMutation.isPending}
          disabled={!selectedMethod || processing}
          fullWidth
        >
          Pay ${total.toFixed(2)}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: ms(16),
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: ms(12),
    padding: ms(16),
    marginTop: ms(16),
    marginBottom: ms(24),
  },
  summaryTitle: {
    fontSize: ms(14),
    color: "#6B7280",
    marginBottom: ms(8),
  },
  totalAmount: {
    fontSize: ms(32),
    fontWeight: "700",
    color: "#111827",
    marginBottom: ms(16),
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: ms(12),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: ms(8),
  },
  priceLabel: {
    fontSize: ms(14),
    color: "#6B7280",
  },
  priceValue: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#111827",
  },
  section: {
    marginBottom: ms(24),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: "600",
    color: "#111827",
    marginBottom: ms(12),
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ms(16),
    borderRadius: ms(12),
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: ms(12),
    backgroundColor: "#FFFFFF",
  },
  paymentMethodSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
  },
  iconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodTitle: {
    fontSize: ms(16),
    fontWeight: "600",
    color: "#111827",
    marginBottom: ms(2),
  },
  paymentMethodSubtitle: {
    fontSize: ms(13),
    color: "#6B7280",
  },
  securityNote: {
    backgroundColor: "#ECFDF5",
    padding: ms(12),
    borderRadius: ms(8),
    marginBottom: ms(16),
  },
  securityText: {
    fontSize: ms(13),
    color: "#047857",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
});
