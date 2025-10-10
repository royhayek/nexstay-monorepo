// Nexstay shared types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "guest" | "host" | "admin";
}

export interface Property {
  id: string;
  title: string;
  description: string;
  hostId: string;
  pricePerNight: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  images: string[];
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

// Add more shared types as needed
