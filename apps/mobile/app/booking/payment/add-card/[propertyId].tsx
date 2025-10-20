import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { useBooking } from "@/contexts";
import { useAuth } from "@/hooks/use-auth";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  LockKeyIcon,
} from "phosphor-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import {
  usePaymentsAppControllerConfirmPaymentIntent,
  usePaymentsAppControllerCreatePaymentIntent,
} from "@/api/queries/protected/payments/payments";
import { useBookingsAppControllerCreate } from "@/api/queries/protected/bookings/bookings";
import type { CreateBookingDto } from "@/api/models/protected/createBookingDto";
import type { CurrencyCode } from "@/api/models/protected/currencyCode";
import { CreatePaymentIntentDtoProvider } from "@/api/models/protected/createPaymentIntentDtoProvider";

// Card type detection
type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

const getCardType = (number: string): CardType => {
  const cleaned = number.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return "visa";
  if (/^5[1-5]/.test(cleaned)) return "mastercard";
  if (/^3[47]/.test(cleaned)) return "amex";
  if (/^6(?:011|5)/.test(cleaned)) return "discover";
  return "unknown";
};

// Card number formatting
const formatCardNumber = (text: string): string => {
  const cleaned = text.replace(/\s/g, "");
  const cardType = getCardType(cleaned);

  if (cardType === "amex") {
    // Amex: 4-6-5 format
    return cleaned
      .replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3")
      .substring(0, 17);
  }

  // Others: 4-4-4-4 format
  return cleaned
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .substring(0, 19);
};

// Expiry date formatting
const formatExpiryDate = (text: string): string => {
  const cleaned = text.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  }
  return cleaned;
};

// Luhn algorithm for card validation
const luhnCheck = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, "");
  if (!/^\d+$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export default function AddCardScreen() {
  const { propertyId } = useLocalSearchParams<{
    propertyId: string;
    paymentIntentId?: string;
  }>();
  const paymentIntentId = useLocalSearchParams<{ paymentIntentId?: string }>().paymentIntentId;

  const insets = useSafeAreaInsets();
  const { bookingDraft, clearBooking } = useBooking();
  const { user } = useAuth();

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [processing, setProcessing] = useState(false);

  const property = bookingDraft?.propertyDetails;
  const checkIn = bookingDraft?.checkIn;
  const checkOut = bookingDraft?.checkOut;
  const nights = bookingDraft?.nights || 0;
  const guests = bookingDraft?.guests;

  // Calculate pricing
  const basePrice = (property?.price?.pricePerNight || property?.pricePerNight || 0) * nights;
  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = basePrice * 0.12;
  const taxes = basePrice * 0.08;
  const total = basePrice + cleaningFee + serviceFee + taxes;

  const cardType = getCardType(cardNumber);

  // Mutations
  const createPaymentIntentMutation = usePaymentsAppControllerCreatePaymentIntent();
  const confirmPaymentIntentMutation = usePaymentsAppControllerConfirmPaymentIntent();
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

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
  };

  const handleCvvChange = (text: string) => {
    const maxLength = cardType === "amex" ? 4 : 3;
    const cleaned = text.replace(/\D/g, "").substring(0, maxLength);
    setCvv(cleaned);
  };

  const validateCard = (): string | null => {
    // Validate card number
    const cleanedNumber = cardNumber.replace(/\s/g, "");
    if (!cleanedNumber) {
      return "Please enter card number";
    }

    const expectedLength = cardType === "amex" ? 15 : 16;
    if (cleanedNumber.length !== expectedLength) {
      return `Card number must be ${expectedLength} digits`;
    }

    if (!luhnCheck(cleanedNumber)) {
      return "Invalid card number";
    }

    // Validate cardholder name
    if (!cardHolder.trim()) {
      return "Please enter cardholder name";
    }

    // Validate expiry date
    if (!expiryDate || expiryDate.length !== 5) {
      return "Please enter expiry date (MM/YY)";
    }

    const [month, year] = expiryDate.split("/");
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(`20${year}`, 10);

    if (monthNum < 1 || monthNum > 12) {
      return "Invalid expiry month";
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return "Card has expired";
    }

    // Validate CVV
    const expectedCvvLength = cardType === "amex" ? 4 : 3;
    if (!cvv || cvv.length !== expectedCvvLength) {
      return `CVV must be ${expectedCvvLength} digits`;
    }

    return null;
  };

  const handlePayNow = async () => {
    // Validate card
    const validationError = validateCard();
    if (validationError) {
      Alert.alert("Invalid Card Details", validationError);
      return;
    }

    if (!checkIn || !checkOut || !guests || !property) {
      Alert.alert("Missing Information", "Please complete all booking steps.");
      return;
    }

    setProcessing(true);

    try {
      let intentId = paymentIntentId;

      // Step 1: Create payment intent if not already created
      if (!intentId) {
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
        intentId = paymentIntentResponse.data._id;
      }

      // Step 2: Confirm payment intent with card details
      // In production, you would tokenize the card with your payment provider
      // and pass the token here instead of raw card details
      const confirmedPayment = await confirmPaymentIntentMutation.mutateAsync({
        id: intentId,
        data: {
          paymentMethodId: `card_${Date.now()}`, // Mock - replace with actual tokenized card
        },
      });

      // Step 3: Create booking after successful payment
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
        paymentIntentId: intentId,
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
        <Text style={styles.headerTitle}>Add Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewHeader}>
            <CreditCardIcon size={32} weight="duotone" color="#FFFFFF" />
            <LockKeyIcon size={24} weight="fill" color="#FFFFFF" />
          </View>
          <Text style={styles.cardNumber}>
            {cardNumber || "•••• •••• •••• ••••"}
          </Text>
          <View style={styles.cardPreviewFooter}>
            <View>
              <Text style={styles.cardLabel}>Card Holder</Text>
              <Text style={styles.cardValue}>
                {cardHolder || "FULL NAME"}
              </Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>Expires</Text>
              <Text style={styles.cardValue}>{expiryDate || "MM/YY"}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Card Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#9CA3AF"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="number-pad"
              maxLength={19}
            />
            {cardType !== "unknown" && cardNumber.length > 0 && (
              <Text style={styles.cardTypeHint}>
                {cardType.charAt(0).toUpperCase() + cardType.slice(1)}
              </Text>
            )}
          </View>

          {/* Card Holder */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              value={cardHolder}
              onChangeText={setCardHolder}
              autoCapitalize="words"
            />
          </View>

          {/* Expiry and CVV */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="#9CA3AF"
                value={expiryDate}
                onChangeText={handleExpiryChange}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder={cardType === "amex" ? "1234" : "123"}
                placeholderTextColor="#9CA3AF"
                value={cvv}
                onChangeText={handleCvvChange}
                keyboardType="number-pad"
                maxLength={cardType === "amex" ? 4 : 3}
                secureTextEntry
              />
            </View>
          </View>

          {/* Save Card Option */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSaveCard(!saveCard)}
          >
            <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
              {saveCard && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Save card for future payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <LockKeyIcon size={20} weight="fill" color="#047857" />
          <Text style={styles.securityText}>
            Your payment is secure and encrypted. We use industry-standard
            encryption to protect your card details.
          </Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(16) }]}>
        <Button
          onPress={handlePayNow}
          loading={
            processing ||
            createPaymentIntentMutation.isPending ||
            confirmPaymentIntentMutation.isPending ||
            createBookingMutation.isPending
          }
          disabled={processing}
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
  cardPreview: {
    backgroundColor: "#4F46E5",
    borderRadius: ms(16),
    padding: ms(24),
    marginTop: ms(24),
    marginBottom: ms(32),
    minHeight: ms(200),
    justifyContent: "space-between",
  },
  cardPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ms(32),
  },
  cardNumber: {
    fontSize: ms(22),
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: ms(24),
  },
  cardPreviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: ms(11),
    color: "#C7D2FE",
    marginBottom: ms(4),
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  form: {
    marginBottom: ms(24),
  },
  inputGroup: {
    marginBottom: ms(20),
  },
  inputLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: ms(8),
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: ms(12),
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    fontSize: ms(16),
    color: "#111827",
  },
  cardTypeHint: {
    position: "absolute",
    right: ms(16),
    top: ms(42),
    fontSize: ms(12),
    fontWeight: "600",
    color: "#4F46E5",
  },
  row: {
    flexDirection: "row",
    gap: ms(12),
  },
  halfWidth: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ms(8),
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: ms(4),
    marginRight: ms(12),
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  checkboxInner: {
    width: ms(10),
    height: ms(10),
    backgroundColor: "#FFFFFF",
    borderRadius: ms(2),
  },
  checkboxLabel: {
    fontSize: ms(14),
    color: "#374151",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: ms(16),
    borderRadius: ms(12),
    marginBottom: ms(24),
    gap: ms(12),
  },
  securityText: {
    flex: 1,
    fontSize: ms(13),
    color: "#047857",
    lineHeight: ms(18),
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: ms(16),
  },
  summaryTitle: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: ms(12),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: ms(16),
    color: "#374151",
  },
  summaryValue: {
    fontSize: ms(24),
    fontWeight: "700",
    color: "#111827",
  },
  footer: {
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
});
