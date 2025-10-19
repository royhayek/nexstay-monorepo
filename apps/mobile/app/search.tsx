import React, { useState } from "react";
import { View, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { router, Stack } from "expo-router";
import { SearchNormal1, CloseCircle } from "iconsax-react-native";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/atoms/button";
import { DateRangeSelector } from "@/components/organisms/date-range-selector";
import { GuestSelector } from "@/components/organisms/guest-selector";
import { AmenityChip } from "@/components/molecules/amenity-chip";
import { SelectionCard } from "@/components/molecules/selection-card";
import { CounterInput } from "@/components/molecules/counter-input";
import { ScreenTemplate } from "@/components/templates";
import { ms } from "@/utils/scaling";
import type { GuestInfo } from "@/contexts";
import { usePropertiesPublicControllerSearch } from "@/api/queries/public/properties-public/properties-public";

interface SearchFilters {
  search?: string;
  location?: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: GuestInfo;
  propertyTypes: string[];
  roomTypes: string[];
  priceRange: { min: number; max: number };
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  instantBookable: boolean;
}

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "CONDO", label: "Condo" },
  { value: "STUDIO", label: "Studio" },
  { value: "TOWNHOUSE", label: "Townhouse" },
];

const ROOM_TYPES = [
  { value: "ENTIRE_HOME", label: "Entire place" },
  { value: "PRIVATE_ROOM", label: "Private room" },
  { value: "SHARED_ROOM", label: "Shared room" },
];

const COMMON_AMENITIES = [
  { id: "wifi", label: "WiFi" },
  { id: "kitchen", label: "Kitchen" },
  { id: "parking", label: "Free parking" },
  { id: "pool", label: "Pool" },
  { id: "gym", label: "Gym" },
  { id: "air_conditioning", label: "AC" },
  { id: "heating", label: "Heating" },
  { id: "washer", label: "Washer" },
  { id: "dryer", label: "Dryer" },
  { id: "tv", label: "TV" },
  { id: "workspace", label: "Workspace" },
  { id: "pet_friendly", label: "Pet friendly" },
];

export default function SearchScreen() {
  const searchMutation = usePropertiesPublicControllerSearch();

  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    location: "",
    checkIn: null,
    checkOut: null,
    guests: { adults: 1, children: 0, infants: 0, totalGuests: 1 },
    propertyTypes: [],
    roomTypes: [],
    priceRange: { min: 0, max: 10000 },
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
    amenities: [],
    instantBookable: false,
  });

  const [activeFilters, setActiveFilters] = useState({
    search: false,
    location: false,
    dates: false,
    guests: false,
    propertyTypes: false,
    roomTypes: false,
    price: false,
    rooms: false,
    amenities: false,
  });

  const handleSearch = () => {
    // Build search payload
    const searchPayload: any = {
      page: 1,
      limit: 20,
    };

    if (filters.search) searchPayload.search = filters.search;
    if (filters.location) searchPayload.location = filters.location;
    if (filters.checkIn) searchPayload.checkIn = filters.checkIn.toISOString();
    if (filters.checkOut) searchPayload.checkOut = filters.checkOut.toISOString();
    if (filters.guests.adults > 0) searchPayload.adults = filters.guests.adults;
    if (filters.guests.children > 0) searchPayload.children = filters.guests.children;
    if (filters.guests.infants > 0) searchPayload.infants = filters.guests.infants;
    if (filters.propertyTypes.length > 0) searchPayload.propertyTypes = filters.propertyTypes;
    if (filters.roomTypes.length > 0) searchPayload.roomTypes = filters.roomTypes;
    if (filters.priceRange.min > 0) searchPayload.minPrice = filters.priceRange.min;
    if (filters.priceRange.max < 10000) searchPayload.maxPrice = filters.priceRange.max;
    if (filters.bedrooms > 0) searchPayload.bedrooms = filters.bedrooms;
    if (filters.beds > 0) searchPayload.beds = filters.beds;
    if (filters.bathrooms > 0) searchPayload.bathrooms = filters.bathrooms;
    if (filters.amenities.length > 0) searchPayload.amenities = filters.amenities;
    if (filters.instantBookable) searchPayload.instantBookable = true;

    searchMutation.mutate(
      { data: searchPayload },
      {
        onSuccess: (response) => {
          // Navigate to results with search data
          router.push({
            pathname: "/search-results",
            params: { filters: JSON.stringify(searchPayload) },
          });
        },
      }
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      location: "",
      checkIn: null,
      checkOut: null,
      guests: { adults: 1, children: 0, infants: 0, totalGuests: 1 },
      propertyTypes: [],
      roomTypes: [],
      priceRange: { min: 0, max: 10000 },
      bedrooms: 0,
      beds: 0,
      bathrooms: 0,
      amenities: [],
      instantBookable: false,
    });
  };

  const togglePropertyType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const toggleRoomType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(type)
        ? prev.roomTypes.filter((t) => t !== type)
        : [...prev.roomTypes, type],
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.location) count++;
    if (filters.checkIn || filters.checkOut) count++;
    if (filters.guests.totalGuests > 1) count++;
    if (filters.propertyTypes.length > 0) count++;
    if (filters.roomTypes.length > 0) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++;
    if (filters.bedrooms > 0 || filters.beds > 0 || filters.bathrooms > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.instantBookable) count++;
    return count;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScreenTemplate
        title="Search & Filters"
        headerRightElement={
          <TouchableOpacity onPress={handleClearFilters}>
            <Text variant="bodyMediumSemiBold" color="primary">
              Clear All
            </Text>
          </TouchableOpacity>
        }
        bottomActions={
          <Button
            variant="filled"
            size="large"
            onPress={handleSearch}
            loading={searchMutation.isPending}
            disabled={searchMutation.isPending}
          >
            Search {getActiveFilterCount() > 0 && `(${getActiveFilterCount()} filters)`}
          </Button>
        }
      >
          {/* Search Input */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              What are you looking for?
            </Text>
            <View style={styles.searchInputContainer}>
              <SearchNormal1 size={ms(20)} />
              <RNTextInput
                style={styles.searchInput}
                placeholder="Search properties..."
                value={filters.search}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
                placeholderTextColor="#999"
              />
              {filters.search !== "" && (
                <TouchableOpacity onPress={() => setFilters((prev) => ({ ...prev, search: "" }))}>
                  <CloseCircle size={ms(20)} variant="Bold" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Where
            </Text>
            <View style={styles.searchInputContainer}>
              <SearchNormal1 size={ms(20)} />
              <RNTextInput
                style={styles.searchInput}
                placeholder="City, neighborhood, or address"
                value={filters.location}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, location: text }))}
                placeholderTextColor="#999"
              />
              {filters.location !== "" && (
                <TouchableOpacity onPress={() => setFilters((prev) => ({ ...prev, location: "" }))}>
                  <CloseCircle size={ms(20)} variant="Bold" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <DateRangeSelector
              checkIn={filters.checkIn}
              checkOut={filters.checkOut}
              onCheckInChange={(date) => setFilters((prev) => ({ ...prev, checkIn: date }))}
              onCheckOutChange={(date) => setFilters((prev) => ({ ...prev, checkOut: date }))}
            />
          </View>

          {/* Guests */}
          <View style={styles.section}>
            <GuestSelector
              guests={filters.guests}
              onGuestsChange={(guests) => setFilters((prev) => ({ ...prev, guests }))}
            />
          </View>

          {/* Property Types */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Property Type
            </Text>
            <View style={styles.chipsContainer}>
              {PROPERTY_TYPES.map((type) => (
                <AmenityChip
                  key={type.value}
                  label={type.label}
                  selected={filters.propertyTypes.includes(type.value)}
                  onPress={() => togglePropertyType(type.value)}
                />
              ))}
            </View>
          </View>

          {/* Room Types */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Room Type
            </Text>
            <View style={styles.chipsContainer}>
              {ROOM_TYPES.map((type) => (
                <AmenityChip
                  key={type.value}
                  label={type.label}
                  selected={filters.roomTypes.includes(type.value)}
                  onPress={() => toggleRoomType(type.value)}
                />
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Price Range (per night)
            </Text>
            <View style={styles.priceContainer}>
              <View style={styles.priceInputGroup}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Minimum
                </Text>
                <View style={styles.priceInputContainer}>
                  <Text variant="bodyMediumRegular">$</Text>
                  <RNTextInput
                    style={styles.priceInput}
                    value={filters.priceRange.min.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: value },
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.priceSeparator}>
                <View style={styles.priceLine} />
              </View>

              <View style={styles.priceInputGroup}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Maximum
                </Text>
                <View style={styles.priceInputContainer}>
                  <Text variant="bodyMediumRegular">$</Text>
                  <RNTextInput
                    style={styles.priceInput}
                    value={filters.priceRange.max.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 10000;
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: value },
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Rooms & Spaces */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Rooms & Spaces
            </Text>
            <View style={styles.countersContainer}>
              <CounterInput
                label="Bedrooms"
                value={filters.bedrooms}
                min={0}
                max={10}
                onIncrement={() => setFilters((prev) => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
                onDecrement={() => setFilters((prev) => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))}
              />
              <CounterInput
                label="Beds"
                value={filters.beds}
                min={0}
                max={20}
                onIncrement={() => setFilters((prev) => ({ ...prev, beds: prev.beds + 1 }))}
                onDecrement={() => setFilters((prev) => ({ ...prev, beds: Math.max(0, prev.beds - 1) }))}
              />
              <CounterInput
                label="Bathrooms"
                value={filters.bathrooms}
                min={0}
                max={10}
                onIncrement={() => setFilters((prev) => ({ ...prev, bathrooms: prev.bathrooms + 1 }))}
                onDecrement={() => setFilters((prev) => ({ ...prev, bathrooms: Math.max(0, prev.bathrooms - 1) }))}
              />
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Amenities
            </Text>
            <View style={styles.chipsContainer}>
              {COMMON_AMENITIES.map((amenity) => (
                <AmenityChip
                  key={amenity.id}
                  label={amenity.label}
                  selected={filters.amenities.includes(amenity.id)}
                  onPress={() => toggleAmenity(amenity.id)}
                />
              ))}
            </View>
          </View>

          {/* Instant Bookable */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFilters((prev) => ({ ...prev, instantBookable: !prev.instantBookable }))}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, filters.instantBookable && styles.checkboxChecked]}>
                {filters.instantBookable && <View style={styles.checkboxInner} />}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text variant="bodyMediumSemiBold">Instant Bookable</Text>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Book without waiting for host approval
                </Text>
              </View>
            </TouchableOpacity>
          </View>
      </ScreenTemplate>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: "PlusJakartaSans_400Regular",
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
  },
  priceInputGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: "PlusJakartaSans_500Medium",
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  priceSeparator: {
    paddingBottom: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  priceLine: {
    width: ms(20),
    height: 2,
    backgroundColor: theme.colors.border,
  },
  countersContainer: {
    gap: theme.spacing.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  checkbox: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(6),
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  checkboxInner: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(3),
    backgroundColor: theme.colors.surface,
  },
  checkboxTextContainer: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
