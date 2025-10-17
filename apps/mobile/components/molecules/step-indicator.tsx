import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../atoms/text";

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Step Counter */}
      <View style={styles.stepInfo}>
        <Text variant="bodySmallMedium" color="neutral600">
          Step {currentStep} of {totalSteps}
        </Text>
        {stepLabels && stepLabels[currentStep - 1] && (
          <Text variant="bodyLargeSemiBold" color="neutral900" style={styles.stepLabel}>
            {stepLabels[currentStep - 1]}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.xl,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBarBackground: {
    height: mvs(4),
    backgroundColor: theme.colors.neutral200,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  stepInfo: {
    alignItems: "center",
  },
  stepLabel: {
    marginTop: theme.spacing.xs,
  },
}));
