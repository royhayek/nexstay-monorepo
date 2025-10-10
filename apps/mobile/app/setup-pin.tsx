import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Animated, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Button, OTPInput } from "@/components/atoms";
import { StatusHeader } from "@/components/molecules";
import { ScreenTemplate } from "@/components/templates";
import { ms } from "@/utils/scaling";

import { SecuritySafe } from "iconsax-react-native";

type PinStep = "create" | "confirm";

export default function SetupPinScreen() {
  const [step, setStep] = useState<PinStep>("create");
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleBack = () => {
    if (step === "confirm") {
      animateToStep("create");
    } else {
      router.back();
    }
  };

  const animateToStep = (newStep: PinStep) => {
    // Fade out and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newStep === "confirm" ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(newStep);
      if (newStep === "create") {
        setConfirmPin("");
      }

      // Fade in and reset slide
      slideAnim.setValue(newStep === "confirm" ? 50 : -50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (createPin.length === 6) {
      animateToStep("confirm");
    }
  };


  const handleConfirm = async () => {
    if (confirmPin !== createPin) {
      Alert.alert("Error", "PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to save PIN
      console.log("Saving PIN:", createPin);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "PIN created successfully", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving PIN:", error);
      Alert.alert("Error", "Failed to create PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const isNextEnabled = createPin.length === 6;
  const isConfirmEnabled = confirmPin.length === 6;

  const renderCreateStep = () => (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusHeader
        icon={<SecuritySafe size={ms(24)} color="#FFFFFF" variant="Bold" />}
        title="Create a PIN"
        description="Please create your 6 digit PIN"
      />

      {/* PIN Input */}
      <View style={styles.otpContainer}>
        <OTPInput value={createPin} onTextChange={setCreatePin} numberOfDigits={6} autoFocus />
      </View>

      {/* Next Button */}
      <Button
        variant="filled"
        onPress={handleNext}
        disabled={!isNextEnabled}
        style={styles.nextButton}
      >
        Next
      </Button>
    </Animated.View>
  );

  const renderConfirmStep = () => (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusHeader
        icon={<SecuritySafe size={ms(24)} color="#FFFFFF" variant="Bold" />}
        title="Confirm Your PIN"
        description="Please confirm your 6 digit PIN"
      />

      {/* PIN Input */}
      <View style={styles.otpContainer}>
        <OTPInput
          value={confirmPin}
          onTextChange={setConfirmPin}
          numberOfDigits={6}
          autoFocus
        />
      </View>

      {/* Confirm Button */}
      <Button
        variant="filled"
        onPress={handleConfirm}
        disabled={!isConfirmEnabled}
        loading={isLoading}
        style={styles.confirmButton}
      >
        Confirm
      </Button>
    </Animated.View>
  );

  return (
    <ScreenTemplate title="Set Up a PIN" onBackPress={handleBack} scrollable={false}>
      {step === "create" ? renderCreateStep() : renderConfirmStep()}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: theme.spacing.xxxl,
  },
  otpContainer: {
    marginBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  nextButton: {
    width: "100%",
    marginTop: theme.spacing.xl,
  },
  confirmButton: {
    width: "100%",
    marginTop: theme.spacing.xl,
  },
}));
