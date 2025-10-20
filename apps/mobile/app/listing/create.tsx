import { router } from "expo-router";
import React, { useState, useRef } from "react";
import { ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text, Input } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import {
  StepIndicator,
  FormSection,
  PropertyTypeSelector,
  RoomTypeSelector,
  BedTypeSelector,
  CounterInput,
  AmenitiesGrid,
  ImagePickerCard,
  SelectionCard,
} from "@/components/molecules";
import {
  usePropertiesAppControllerCreate,
  usePropertiesAppControllerUploadSinglePropertyImage,
  getPropertiesAppControllerGetMyPropertiesQueryKey,
} from "@/api/queries/protected/properties/properties";
import { useCatalogOptions } from "@/contexts/app-context";

interface PropertyFormData {
  // Step 1: Property Type
  propertyType: string;
  roomType: string;
  bedType: string;

  // Step 2: Property Details
  name: string;
  description: string;
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;

  // Step 3: Location
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    countryCode: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };

  // Step 4: Amenities
  amenities: string[];

  // Step 5: Pricing
  basePrice: number;
  currency: string;
  cleaningFee?: number;
  minimumNights: number;
  maximumNights: number;
  cancellationPolicy: string;

  // Step 6: Images
  images: string[];

  // Step 7: Additional Settings
  instantBookable: boolean;
  requireGuestPhoneVerification: boolean;
}

const INITIAL_FORM_DATA: PropertyFormData = {
  propertyType: "",
  roomType: "",
  bedType: "",
  name: "",
  description: "",
  accommodates: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  address: {
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    countryCode: "",
  },
  coordinates: {
    latitude: 0,
    longitude: 0,
  },
  amenities: [],
  basePrice: 0,
  currency: "USD",
  cleaningFee: 0,
  minimumNights: 1,
  maximumNights: 30,
  cancellationPolicy: "moderate",
  images: [],
  instantBookable: false,
  requireGuestPhoneVerification: true,
};

const STEP_LABELS = [
  "Property Type",
  "Property Details",
  "Location",
  "Amenities",
  "Pricing",
  "Photos",
  "Review & Publish",
];

export default function CreateListingScreen() {
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(INITIAL_FORM_DATA);
  const [uploadingImage, setUploadingImage] = useState(false);

  const totalSteps = 7;

  // API Hooks
  const { mutateAsync: createProperty, isPending: isSubmitting } = usePropertiesAppControllerCreate();
  const { mutateAsync: uploadImage } = usePropertiesAppControllerUploadSinglePropertyImage();

  // Fetch catalog options from app context
  const cancellationPolicyCatalog = useCatalogOptions("CancellationPolicy");
  const amenitiesCatalog = useCatalogOptions("Amenity");

  const updateFormData = <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = <K extends keyof PropertyFormData, NK extends keyof PropertyFormData[K]>(
    field: K,
    nestedField: NK,
    value: PropertyFormData[K][NK]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [nestedField]: value,
      },
    }));
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when moving to next step
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Scroll to top when going back
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.propertyType || !formData.roomType || !formData.bedType) {
          Alert.alert("Required", "Please select all property type options");
          return false;
        }
        break;
      case 2:
        if (!formData.name || formData.name.length < 10) {
          Alert.alert("Required", "Property name must be at least 10 characters");
          return false;
        }
        if (!formData.description || formData.description.length < 50) {
          Alert.alert("Required", "Description must be at least 50 characters");
          return false;
        }
        break;
      case 3:
        if (!formData.address.street || !formData.address.city || !formData.address.country) {
          Alert.alert("Required", "Please fill in all required address fields");
          return false;
        }
        break;
      case 4:
        if (formData.amenities.length === 0) {
          Alert.alert("Required", "Please select at least one amenity");
          return false;
        }
        break;
      case 5:
        if (formData.basePrice <= 0) {
          Alert.alert("Required", "Please enter a valid base price");
          return false;
        }
        break;
      case 6:
        if (formData.images.length === 0) {
          Alert.alert("Required", "Please upload at least one photo");
          return false;
        }
        break;
    }
    return true;
  };

  // Check if current step is valid without showing alert
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.propertyType && formData.roomType && formData.bedType);
      case 2:
        return !!(
          formData.name &&
          formData.name.length >= 10 &&
          formData.description &&
          formData.description.length >= 50
        );
      case 3:
        return !!(formData.address.street && formData.address.city && formData.address.country);
      case 4:
        return formData.amenities.length > 0;
      case 5:
        return formData.basePrice > 0;
      case 6:
        return formData.images.length > 0;
      case 7:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        try {
          // Extract filename from URI
          const uriParts = result.assets[0].uri.split("/");
          const filename = uriParts[uriParts.length - 1];

          // Create file object in React Native format for FormData
          const imageFile = {
            uri: result.assets[0].uri,
            type: result.assets[0].type === "image" ? "image/jpeg" : "image/jpeg",
            name: filename,
          } as any;

          // Upload to backend
          const uploadResult = await uploadImage({
            data: { image: imageFile },
          });

          // Add uploaded image URL to form data
          if (uploadResult.data?.url) {
            updateFormData("images", [...formData.images, uploadResult.data.url]);
          } else {
            throw new Error("No URL returned from upload");
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          Alert.alert("Error", "Failed to upload image to server");
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    updateFormData(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      // Prepare property data for API
      // Note: Catalog keys are already in the format expected by backend
      const propertyData = {
        name: formData.name,
        description: formData.description,
        propertyType: formData.propertyType,
        roomType: formData.roomType,
        bedType: formData.bedType,
        accommodates: formData.accommodates,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        address: {
          ...formData.address,
          countryCode: formData.address.countryCode || "LB",
        },
        coordinates: formData.coordinates,
        location: {
          type: "Point" as const,
          coordinates: [formData.coordinates.longitude, formData.coordinates.latitude],
        },
        amenities: formData.amenities,
        features: {
          wifi: formData.amenities.includes("wifi"),
          freeParking: formData.amenities.includes("parking"),
          pool: formData.amenities.includes("pool"),
          kitchen: formData.amenities.includes("kitchen"),
          airConditioning: formData.amenities.includes("air_conditioning"),
          heating: formData.amenities.includes("heating"),
          petsAllowed: formData.amenities.includes("pets_allowed"),
          familyKidFriendly: formData.amenities.includes("family_friendly"),
          wheelchairAccessible: formData.amenities.includes("accessible"),
          laptopFriendlyWorkspace: formData.amenities.includes("workspace"),
        },
        price: {
          basePrice: formData.basePrice,
          currency: formData.currency,
          currencySymbol: "$",
          pricePerNight: formData.basePrice,
          cleaningFee: formData.cleaningFee || 0,
        },
        minimumNights: formData.minimumNights,
        maximumNights: formData.maximumNights,
        cancellationPolicy: formData.cancellationPolicy,
        images: formData.images.map((url, index) => ({
          url,
          key: `image-${index}`,
          isPrimary: index === 0,
          sortOrder: index,
        })),
        availability: {
          availability30: 30,
          availability60: 60,
          availability90: 90,
          availability365: 365,
          hasAvailability: true,
        },
        instantBookable: formData.instantBookable,
        isBusinessTravelReady: false,
        requireGuestProfilePicture: false,
        requireGuestPhoneVerification: formData.requireGuestPhoneVerification,
      };

      // Call backend API
      const response = await createProperty({ data: propertyData });

      if (response.data) {
        // Invalidate properties queries to refetch data
        const queryKey = getPropertiesAppControllerGetMyPropertiesQueryKey();
        await queryClient.invalidateQueries({ queryKey });

        Alert.alert("Success!", "Your property listing has been created successfully", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/host-listings"),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error creating property:", error);
      const errorMessage = error?.response?.data?.message || "Failed to create property listing";
      Alert.alert("Error", errorMessage);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <FormSection
              title="What type of property is this?"
              description="Choose the category that best describes your place"
              required
            >
              <PropertyTypeSelector
                value={formData.propertyType}
                onChange={(value) => updateFormData("propertyType", value)}
              />
            </FormSection>

            <FormSection
              title="What type of room will guests have?"
              description="Choose how much space guests will have access to"
              required
            >
              <RoomTypeSelector value={formData.roomType} onChange={(value) => updateFormData("roomType", value)} />
            </FormSection>

            <FormSection title="What type of beds are available?" description="Select the primary bed type" required>
              <BedTypeSelector value={formData.bedType} onChange={(value) => updateFormData("bedType", value)} />
            </FormSection>
          </>
        );

      case 2:
        return (
          <>
            <FormSection
              title="Name your property"
              description="Catch guests' attention with a listing title that highlights what makes your place special"
              required
            >
              <Input
                key="property-name-input"
                placeholder="e.g., Cozy Downtown Apartment with City Views"
                value={formData.name}
                onChangeText={(text) => updateFormData("name", text)}
                maxLength={100}
              />
              <Text variant="bodyXSmallRegular" color="neutral500" style={styles.helperText}>
                {formData.name.length}/100 characters
              </Text>
            </FormSection>

            <FormSection
              title="Describe your property"
              description="Tell guests what makes your place special"
              required
            >
              <Input
                key="property-description-input"
                variant="multiline"
                placeholder="Share what makes your place unique..."
                value={formData.description}
                onChangeText={(text) => updateFormData("description", text)}
                multiline
                numberOfLines={6}
                maxLength={500}
              />
              <Text variant="bodyXSmallRegular" color="neutral500" style={styles.helperText}>
                {formData.description.length}/500 characters (minimum 50)
              </Text>
            </FormSection>

            <FormSection title="Property basics" description="How many guests can your place accommodate?">
              <CounterInput
                label="Guests"
                description="Maximum number of guests"
                value={formData.accommodates}
                onIncrement={() => updateFormData("accommodates", formData.accommodates + 1)}
                onDecrement={() => updateFormData("accommodates", formData.accommodates - 1)}
                min={1}
                max={16}
              />
              <CounterInput
                label="Bedrooms"
                value={formData.bedrooms}
                onIncrement={() => updateFormData("bedrooms", formData.bedrooms + 1)}
                onDecrement={() => updateFormData("bedrooms", formData.bedrooms - 1)}
                min={0}
                max={20}
              />
              <CounterInput
                label="Beds"
                value={formData.beds}
                onIncrement={() => updateFormData("beds", formData.beds + 1)}
                onDecrement={() => updateFormData("beds", formData.beds - 1)}
                min={1}
                max={20}
              />
              <CounterInput
                label="Bathrooms"
                value={formData.bathrooms}
                onIncrement={() => updateFormData("bathrooms", formData.bathrooms + 1)}
                onDecrement={() => updateFormData("bathrooms", formData.bathrooms - 1)}
                min={1}
                max={10}
              />
            </FormSection>
          </>
        );

      case 3:
        return (
          <>
            <FormSection
              title="Where is your property located?"
              description="Guests will only get your exact address after booking"
              required
            >
              <Input
                key="street-input"
                label="Street address"
                placeholder="123 Main Street"
                value={formData.address.street}
                onChangeText={(text) => updateNestedFormData("address", "street", text)}
                autoComplete="off"
              />
              <Input
                key="city-input"
                label="City"
                placeholder="New York"
                value={formData.address.city}
                onChangeText={(text) => updateNestedFormData("address", "city", text)}
                autoComplete="off"
              />
              <Input
                key="state-input"
                label="State/Province"
                placeholder="NY"
                value={formData.address.state}
                onChangeText={(text) => updateNestedFormData("address", "state", text)}
                autoComplete="off"
              />
              <Input
                key="country-input"
                label="Country"
                placeholder="United States"
                value={formData.address.country}
                onChangeText={(text) => updateNestedFormData("address", "country", text)}
                autoComplete="off"
              />
              <Input
                key="postal-input"
                label="Postal Code"
                placeholder="10001"
                value={formData.address.postalCode}
                onChangeText={(text) => updateNestedFormData("address", "postalCode", text)}
                autoComplete="off"
              />
            </FormSection>
          </>
        );

      case 4:
        return (
          <>
            <FormSection
              title="What amenities do you offer?"
              description="Select all amenities available at your property"
              required
            >
              {amenitiesCatalog.length > 0 ? (
                <AmenitiesGrid
                  amenities={amenitiesCatalog}
                  selectedAmenities={formData.amenities}
                  onChange={(amenities) => updateFormData("amenities", amenities)}
                />
              ) : (
                <View style={styles.loadingAmenities}>
                  <Text variant="bodyMediumRegular" color="neutral600">
                    Loading amenities...
                  </Text>
                </View>
              )}
            </FormSection>
          </>
        );

      case 5:
        return (
          <>
            <FormSection title="Set your price" description="You can always change it later" required>
              <Input
                key="base-price-input"
                label="Base price per night (USD)"
                placeholder="0"
                value={formData.basePrice.toString()}
                onChangeText={(text) => updateFormData("basePrice", parseFloat(text) || 0)}
                keyboardType="numeric"
              />
              <Input
                key="cleaning-fee-input"
                label="Cleaning fee (optional)"
                placeholder="0"
                value={formData.cleaningFee?.toString() || ""}
                onChangeText={(text) => updateFormData("cleaningFee", parseFloat(text) || 0)}
                keyboardType="numeric"
              />
            </FormSection>

            <FormSection title="Trip length" description="Set minimum and maximum stay">
              <CounterInput
                label="Minimum nights"
                value={formData.minimumNights}
                onIncrement={() => updateFormData("minimumNights", formData.minimumNights + 1)}
                onDecrement={() => updateFormData("minimumNights", formData.minimumNights - 1)}
                min={1}
                max={365}
              />
              <CounterInput
                label="Maximum nights"
                value={formData.maximumNights}
                onIncrement={() => updateFormData("maximumNights", formData.maximumNights + 1)}
                onDecrement={() => updateFormData("maximumNights", formData.maximumNights - 1)}
                min={1}
                max={365}
              />
            </FormSection>

            <FormSection
              title="Cancellation policy"
              description="Choose how flexible you want to be with cancellations"
              required
            >
              {cancellationPolicyCatalog.map((policy) => (
                <SelectionCard
                  key={policy.value}
                  title={policy.label}
                  description={policy.description}
                  selected={formData.cancellationPolicy === policy.value}
                  onPress={() => updateFormData("cancellationPolicy", policy.value)}
                />
              ))}
            </FormSection>
          </>
        );

      case 6:
        return (
          <>
            <FormSection
              title="Add photos of your property"
              description="Upload at least 5 high-quality photos. The first photo will be the cover photo."
              required
            >
              <ImagePickerCard
                images={formData.images}
                onAddImage={handlePickImage}
                onRemoveImage={handleRemoveImage}
                maxImages={20}
                uploading={uploadingImage}
              />
            </FormSection>
          </>
        );

      case 7:
        return (
          <>
            <FormSection title="Review your listing" description="Make sure everything looks good before publishing">
              <View style={styles.reviewCard}>
                <Text variant="bodyLargeSemiBold" color="neutral950" style={styles.reviewTitle}>
                  {formData.name}
                </Text>
                <Text variant="bodySmallRegular" color="neutral700" style={styles.reviewSubtitle}>
                  {formData.propertyType} • {formData.roomType}
                </Text>
                <View style={styles.reviewRow}>
                  <Text variant="bodySmallRegular" color="neutral600">
                    {formData.accommodates} guests • {formData.bedrooms} bedrooms • {formData.beds} beds •{" "}
                    {formData.bathrooms} baths
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text variant="bodyLargeSemiBold" color="primary">
                    ${formData.basePrice}
                  </Text>
                  <Text variant="bodySmallRegular" color="neutral600">
                    {" "}
                    / night
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text variant="bodySmallRegular" color="neutral600">
                    {formData.images.length} photos • {formData.amenities.length} amenities
                  </Text>
                </View>
              </View>
            </FormSection>

            <FormSection title="Guest requirements" description="Help ensure a safe and secure booking">
              <View style={styles.switchRow}>
                <Text variant="bodyMediumRegular" color="neutral800">
                  Require phone verification
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateFormData("requireGuestPhoneVerification", !formData.requireGuestPhoneVerification)
                  }
                >
                  <View style={[styles.switch, formData.requireGuestPhoneVerification && styles.switchActive]} />
                </TouchableOpacity>
              </View>
              <View style={styles.switchRow}>
                <Text variant="bodyMediumRegular" color="neutral800">
                  Instant booking
                </Text>
                <TouchableOpacity onPress={() => updateFormData("instantBookable", !formData.instantBookable)}>
                  <View style={[styles.switch, formData.instantBookable && styles.switchActive]} />
                </TouchableOpacity>
              </View>
            </FormSection>
          </>
        );

      default:
        return null;
    }
  };

  const renderBottomActions = () => (
    <>
      {currentStep > 1 && (
        <Button variant="outlined" color="neutral" size="large" onPress={handleBack} style={styles.backButton}>
          Back
        </Button>
      )}

      {currentStep < totalSteps ? (
        <Button
          variant="filled"
          color="primary"
          size="large"
          onPress={handleNext}
          disabled={!isCurrentStepValid()}
          style={styles.nextButton}
        >
          Next
        </Button>
      ) : (
        <Button
          variant="filled"
          color="primary"
          size="large"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.nextButton}
        >
          Publish Listing
        </Button>
      )}
    </>
  );

  return (
    <ScreenTemplate
      title="Create Listing"
      showBackButton
      scrollable={false}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
      bottomActions={renderBottomActions()}
    >
      <View style={styles.container}>
        {/* Fixed Step Indicator */}
        <View style={styles.stepperContainer}>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepperContainer: {
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  helperText: {
    marginTop: theme.spacing.xs,
  },
  reviewCard: {
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  reviewTitle: {
    marginBottom: theme.spacing.xxs,
  },
  reviewSubtitle: {
    marginBottom: theme.spacing.sm,
    textTransform: "capitalize",
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.base,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral300,
  },
  switchActive: {
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  loadingAmenities: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
}));
