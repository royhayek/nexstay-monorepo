'use client';

import { useContext } from 'react';

import { AppContext } from './app-context';

// ----------------------------------------------------------------------

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}

// Convenience hooks for specific catalog data
export function useCatalogData() {
  const { catalog } = useAppContext();
  return catalog;
}

export function useEnumDisplays() {
  const { catalog } = useAppContext();
  return catalog?.enumDisplays;
}

export function useAmenityCategories() {
  const { catalog } = useAppContext();
  return catalog?.amenityCategories;
}

export function useAmenities() {
  const { catalog } = useAppContext();
  return catalog?.amenities;
}

export function useBedTypes() {
  const { catalog } = useAppContext();
  return catalog?.bedTypes;
}

export function usePropertyTypes() {
  const { catalog } = useAppContext();
  return catalog?.propertyTypes;
}

export function useRoomTypes() {
  const { catalog } = useAppContext();
  return catalog?.roomTypes;
}

export function useCancellationPolicies() {
  const { catalog } = useAppContext();
  return catalog?.cancellationPolicies;
}

export function useCurrencies() {
  const { catalog } = useAppContext();
  return catalog?.currencies;
}

export function useNotificationTypes() {
  const { catalog } = useAppContext();
  return catalog?.notificationTypes;
}

export function usePaymentProviders() {
  const { catalog } = useAppContext();
  return catalog?.paymentProviders;
}

export function useSupportedLanguages() {
  const { supportedLanguages } = useAppContext();
  return supportedLanguages;
}
