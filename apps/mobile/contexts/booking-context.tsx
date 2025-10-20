import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface GuestInfo {
  adults: number;
  children: number;
  infants: number;
  totalGuests: number;
}

export interface BookingDraft {
  propertyId: string;
  propertyDetails: PropertyResponseDto | null;
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  guests: GuestInfo;
  guestInfo: {
    phone?: string;
    email?: string;
  };
  arrivalTime?: string;
  specialRequests?: string;
}

interface BookingContextType {
  bookingDraft: BookingDraft | null;
  setBookingDraft: (draft: BookingDraft | null) => void;
  updateProperty: (property: PropertyResponseDto) => void;
  updateDates: (checkIn: Date, checkOut: Date, nights: number) => void;
  updateGuests: (guests: GuestInfo) => void;
  updateGuestInfo: (info: { phone?: string; email?: string }) => void;
  updateArrivalTime: (time: string) => void;
  updateSpecialRequests: (requests: string) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialGuestInfo: GuestInfo = {
  adults: 1,
  children: 0,
  infants: 0,
  totalGuests: 1,
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);

  const updateProperty = (property: PropertyResponseDto) => {
    setBookingDraft((prev) => ({
      propertyId: property._id,
      propertyDetails: property,
      checkIn: prev?.checkIn || null,
      checkOut: prev?.checkOut || null,
      nights: prev?.nights || 0,
      guests: prev?.guests || initialGuestInfo,
      guestInfo: prev?.guestInfo || {},
      arrivalTime: prev?.arrivalTime,
      specialRequests: prev?.specialRequests,
    }));
  };

  const updateDates = (checkIn: Date, checkOut: Date, nights: number) => {
    setBookingDraft((prev) => {
      if (!prev) {
        // If no booking draft exists, we can't update it safely
        console.warn('updateDates called without an existing booking draft');
        return prev;
      }
      return {
        ...prev,
        checkIn,
        checkOut,
        nights,
      };
    });
  };

  const updateGuests = (guests: GuestInfo) => {
    setBookingDraft((prev) => {
      if (!prev) {
        // If no booking draft exists, we can't update it safely
        console.warn('updateGuests called without an existing booking draft');
        return prev;
      }
      return {
        ...prev,
        guests,
      };
    });
  };

  const updateGuestInfo = (info: { phone?: string; email?: string }) => {
    setBookingDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          ...info,
        },
      };
    });
  };

  const updateArrivalTime = (time: string) => {
    setBookingDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        arrivalTime: time,
      };
    });
  };

  const updateSpecialRequests = (requests: string) => {
    setBookingDraft((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        specialRequests: requests,
      };
    });
  };

  const clearBooking = () => {
    setBookingDraft(null);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingDraft,
        setBookingDraft,
        updateProperty,
        updateDates,
        updateGuests,
        updateGuestInfo,
        updateArrivalTime,
        updateSpecialRequests,
        clearBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
