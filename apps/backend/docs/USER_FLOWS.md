# Complete User Flows Documentation

This document provides comprehensive step-by-step guides for all user types using the Airbnb Clone platform, including updated API endpoints, payment processing, notification systems, and enhanced features.

## Table of Contents

1. [Host User Flow](#host-user-flow)
2. [Guest User Flow](#guest-user-flow)
3. [Admin User Flow](#admin-user-flow)
4. [Payment & Invoice System](#payment--invoice-system)
5. [Notification System](#notification-system)
6. [File Upload & Storage](#file-upload--storage)
7. [Review System](#review-system)
8. [API Integration Examples](#api-integration-examples)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## Host User Flow

### 1. Host Registration & Setup

#### Step 1: Account Registration

**Endpoint:** `POST /api/auth/register`

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "roles": ["host"],
  "acceptedTerms": true,
  "dateOfBirth": "1985-05-15",
  "language": "en"
}
```

**Response:** Account created with verification token sent via email/SMS.

#### Step 2: Email/Phone Verification

**Endpoint:** `POST /api/auth/verify`

```json
{
  "identifier": "john.smith@example.com",
  "code": "123456",
  "type": "email"
}
```

**Response:** Account verified, user can now log in.

#### Step 3: Initial Login

**Endpoint:** `POST /api/auth/login`

```json
{
  "identifier": "john.smith@example.com",
  "password": "SecurePass123!"
}
```

**Response:** JWT tokens for authenticated sessions.

#### Step 4: Complete Profile

**Endpoint:** `PUT /api/users/profile`

```json
{
  "profileImage": "base64_encoded_image_or_file_upload",
  "bio": "Experienced host with 5+ years in hospitality",
  "location": "San Francisco, CA",
  "languages": ["en", "es"],
  "preferences": {
    "emailNotifications": true,
    "smsNotifications": true,
    "currency": "USD",
    "timezone": "America/Los_Angeles"
  }
}
```

### 2. Property Management

#### Step 1: Add New Property

**Endpoint:** `POST /api/properties`

```json
{
  "name": "Cozy Downtown Apartment",
  "description": "Beautiful 2BR apartment in the heart of downtown",
  "type": "apartment",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "California",
    "country": "United States",
    "postalCode": "94102",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "amenities": ["wifi", "kitchen", "air_conditioning", "heating", "tv", "washer_dryer"],
  "capacity": {
    "guests": 4,
    "bedrooms": 2,
    "bathrooms": 1,
    "beds": 2
  },
  "pricing": {
    "basePrice": 150,
    "currency": "USD",
    "cleaningFee": 25,
    "securityDeposit": 200,
    "extraGuestFee": 15,
    "weeklyDiscount": 5,
    "monthlyDiscount": 10
  },
  "availability": {
    "minimumStay": 2,
    "maximumStay": 30,
    "advanceNotice": 24,
    "preparationTime": 2,
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "instantBooking": true
  },
  "houseRules": ["No smoking", "No pets", "No parties", "Quiet hours after 10 PM"]
}
```

#### Step 2: Upload Property Images

**Endpoint:** `POST /api/storage/upload`

```bash
# Upload multiple images
curl -X POST /api/storage/upload \
  -H "Authorization: Bearer {jwt_token}" \
  -F "files=@bedroom1.jpg" \
  -F "files=@living_room.jpg" \
  -F "files=@kitchen.jpg" \
  -F "category=property_images" \
  -F "entityId={property_id}"
```

#### Step 3: Update Property with Images

**Endpoint:** `PUT /api/properties/{property_id}`

```json
{
  "images": [
    {
      "url": "https://s3.amazonaws.com/bucket/property_images/uuid1.jpg",
      "caption": "Spacious living room",
      "isPrimary": true,
      "order": 1
    },
    {
      "url": "https://s3.amazonaws.com/bucket/property_images/uuid2.jpg",
      "caption": "Modern kitchen",
      "isPrimary": false,
      "order": 2
    }
  ]
}
```

#### Step 4: Set Availability Calendar

**Endpoint:** `PUT /api/properties/{property_id}/availability`

```json
{
  "blockedDates": [
    {
      "startDate": "2024-12-24",
      "endDate": "2024-12-26",
      "reason": "Holiday personal use"
    }
  ],
  "customPricing": [
    {
      "startDate": "2024-12-31",
      "endDate": "2024-01-01",
      "price": 300,
      "reason": "New Year premium"
    }
  ]
}
```

#### Step 5: Publish Property

**Endpoint:** `PUT /api/properties/{property_id}/status`

```json
{
  "status": "active",
  "publishedAt": "2024-08-14T10:00:00Z"
}
```

### 3. Booking Management

#### Step 1: View Incoming Booking Requests

**Endpoint:** `GET /api/bookings/host/{host_id}?status=pending`

**Response:** List of pending booking requests requiring approval.

#### Step 2: Review & Approve/Decline Booking

**Endpoint:** `PUT /api/bookings/{booking_id}`

```json
{
  "status": "confirmed",
  "hostMessage": "Welcome! Looking forward to hosting you. Check-in instructions will be sent closer to your arrival date."
}
```

#### Step 3: Handle Check-in Process

**Endpoint:** `PUT /api/bookings/{booking_id}/check-in`

```json
{
  "actualCheckInTime": "2024-08-14T15:30:00Z",
  "guestCount": 2,
  "notes": "Guest arrived on time, provided house tour"
}
```

#### Step 4: Manage During Stay

**Endpoint:** `POST /api/messaging/conversations`

```json
{
  "recipientId": "{guest_id}",
  "message": "Hi! Hope you're enjoying your stay. Let me know if you need anything!",
  "bookingId": "{booking_id}"
}
```

#### Step 5: Handle Check-out & Review

**Endpoint:** `PUT /api/bookings/{booking_id}/check-out`

```json
{
  "actualCheckOutTime": "2024-08-16T11:00:00Z",
  "propertyCondition": "excellent",
  "notes": "Property left in great condition"
}
```

**Create Review for Guest:**
**Endpoint:** `POST /api/reviews`

```json
{
  "bookingId": "{booking_id}",
  "revieweeId": "{guest_id}",
  "overallRating": 5,
  "cleanliness": 5,
  "communication": 5,
  "respectForRules": 5,
  "comment": "Excellent guest! Very respectful and left the place clean.",
  "isPublic": true
}
```

### 4. Financial Management

#### Step 1: View Earnings Dashboard

**Endpoint:** `GET /api/payments/host/{host_id}/earnings`

**Response:** Detailed earnings breakdown, pending payouts, tax information.

#### Step 2: Download Invoices

**Endpoint:** `GET /api/invoices?hostId={host_id}&format=pdf`

**Response:** PDF invoices for tax purposes and record keeping.

#### Step 3: Manage Payout Settings

**Endpoint:** `PUT /api/users/{host_id}/payout-settings`

```json
{
  "payoutMethod": "bank_transfer",
  "bankAccount": {
    "accountNumber": "****1234",
    "routingNumber": "123456789",
    "accountHolder": "John Smith"
  },
  "payoutSchedule": "weekly",
  "minimumPayout": 50
}
```

---

## Guest User Flow

### 1. Guest Registration & Setup

#### Step 1: Account Registration

**Endpoint:** `POST /api/auth/register`

```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@example.com",
  "password": "SecurePass123!",
  "phone": "+1987654321",
  "roles": ["guest"],
  "acceptedTerms": true,
  "dateOfBirth": "1992-03-20",
  "language": "en"
}
```

#### Step 2: Complete Verification & Profile

Similar to host flow, but with guest-specific preferences:

```json
{
  "travelPreferences": {
    "travelPurpose": ["leisure", "business"],
    "groupSize": "couple",
    "budgetRange": "moderate",
    "amenityPreferences": ["wifi", "kitchen", "parking"]
  },
  "emergencyContact": {
    "name": "Mike Johnson",
    "relationship": "spouse",
    "phone": "+1555123456"
  }
}
```

### 2. Property Search & Discovery

#### Step 1: Search Properties

**Endpoint:** `GET /api/properties/search`

```bash
GET /api/properties/search?
  location=San Francisco, CA&
  checkIn=2024-09-15&
  checkOut=2024-09-18&
  guests=2&
  priceMin=100&
  priceMax=300&
  amenities=wifi,kitchen&
  propertyType=apartment&
  instantBook=true&
  page=1&
  limit=20
```

#### Step 2: View Property Details

**Endpoint:** `GET /api/properties/{property_id}`

**Response:** Complete property information, photos, reviews, host details, availability calendar.

#### Step 3: Check Detailed Availability

**Endpoint:** `GET /api/properties/{property_id}/availability?startDate=2024-09-15&endDate=2024-09-18`

**Response:** Available dates, pricing breakdown, any restrictions.

### 3. Booking Process

#### Step 1: Create Booking Request

**Endpoint:** `POST /api/bookings`

```json
{
  "propertyId": "{property_id}",
  "checkIn": "2024-09-15",
  "checkOut": "2024-09-18",
  "guests": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "specialRequests": "Celebrating anniversary, any romantic touches would be appreciated!",
  "estimatedArrivalTime": "16:00",
  "guestPhone": "+1987654321",
  "guestEmail": "sarah.johnson@example.com"
}
```

#### Step 2: Process Payment

**Endpoint:** `POST /api/payments/intents`

```json
{
  "amount": {
    "amount": 525.5,
    "currency": "USD"
  },
  "provider": "aps",
  "metadata": {
    "bookingId": "{booking_id}",
    "description": "Payment for booking at property"
  },
  "returnUrl": "https://app.example.com/booking/success",
  "cancelUrl": "https://app.example.com/booking/cancel"
}
```

#### Step 3: Confirm Payment

**Endpoint:** `PUT /api/payments/intents/{intent_id}/confirm`

```json
{
  "paymentMethodId": "{payment_method_id}",
  "confirmationDetails": {
    "billingAddress": {
      "line1": "456 Oak St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "US"
    }
  }
}
```

#### Step 4: Receive Confirmation

**Response:** Booking confirmed, confirmation email sent, invoice generated.

### 4. Pre-Arrival & Communication

#### Step 1: Message Host

**Endpoint:** `POST /api/messaging/conversations`

```json
{
  "recipientId": "{host_id}",
  "message": "Hi! We're excited about our upcoming stay. Could you please share the check-in instructions?",
  "bookingId": "{booking_id}"
}
```

#### Step 2: Update Booking Details (if needed)

**Endpoint:** `PUT /api/bookings/{booking_id}`

```json
{
  "estimatedArrivalTime": "17:30",
  "specialRequests": "Update: We'll have one additional guest (friend joining last minute). Is this okay?",
  "guestPhone": "+1987654321"
}
```

### 5. During Stay

#### Step 1: Check-in

**Endpoint:** `PUT /api/bookings/{booking_id}/check-in`

```json
{
  "actualCheckInTime": "2024-09-15T17:30:00Z",
  "guestCount": 3,
  "notes": "Property exactly as described, very clean and welcoming"
}
```

#### Step 2: Report Issues (if any)

**Endpoint:** `POST /api/bookings/{booking_id}/issues`

```json
{
  "issueType": "maintenance",
  "description": "Kitchen faucet is dripping",
  "priority": "low",
  "photos": ["base64_image_or_uploaded_file_url"]
}
```

#### Step 3: Extend Stay (if available)

**Endpoint:** `POST /api/bookings/{booking_id}/extend`

```json
{
  "newCheckOut": "2024-09-19",
  "additionalNights": 1,
  "paymentMethod": "same_as_original"
}
```

### 6. Post-Stay

#### Step 1: Check-out

**Endpoint:** `PUT /api/bookings/{booking_id}/check-out`

```json
{
  "actualCheckOutTime": "2024-09-18T11:00:00Z",
  "notes": "Had a wonderful stay, everything was perfect!"
}
```

#### Step 2: Leave Review

**Endpoint:** `POST /api/reviews`

```json
{
  "bookingId": "{booking_id}",
  "revieweeId": "{host_id}",
  "overallRating": 5,
  "cleanliness": 5,
  "accuracy": 5,
  "communication": 5,
  "location": 4,
  "checkIn": 5,
  "value": 4,
  "comment": "Amazing stay! The apartment was exactly as described and John was a fantastic host. Highly recommend!",
  "isPublic": true
}
```

#### Step 3: Download Receipt/Invoice

**Endpoint:** `GET /api/invoices/{invoice_id}/pdf`

**Response:** PDF receipt for expense reporting or personal records.

---

## Admin User Flow

### 1. Admin Dashboard & Monitoring

#### Step 1: System Overview

**Endpoint:** `GET /api/admin/dashboard`

**Response:** Key metrics, recent activity, system alerts.

#### Step 2: User Management

**Endpoint:** `GET /api/users/admin/all`

```bash
GET /api/users/admin/all?
  role=host&
  status=active&
  registrationDateFrom=2024-01-01&
  search=john&
  page=1&
  limit=50
```

#### Step 3: Property Management

**Endpoint:** `GET /api/properties/admin/all`

**Response:** All properties with admin controls for approval, suspension, etc.

#### Step 4: Booking Management

**Endpoint:** `GET /api/bookings/admin/all`

**Response:** All bookings with advanced filtering and management capabilities.

#### Step 5: Financial Overview

**Endpoint:** `GET /api/payments/admin/metrics`

**Response:** Payment volume, success rates, refund metrics, revenue analytics.

### 2. Content Moderation

#### Step 1: Review Flagged Content

**Endpoint:** `GET /api/admin/moderation/flagged`

#### Step 2: Property Approval

**Endpoint:** `PUT /api/properties/{property_id}/admin/approve`

```json
{
  "approved": true,
  "notes": "Property meets all requirements and guidelines",
  "approvedBy": "{admin_id}"
}
```

#### Step 3: Handle Disputes

**Endpoint:** `POST /api/admin/disputes/{dispute_id}/resolve`

```json
{
  "resolution": "refund_guest",
  "amount": 150.0,
  "reason": "Property not as described",
  "notes": "Partial refund issued due to cleanliness issues"
}
```

---

## API Integration Examples

### Authentication Headers

All authenticated requests require JWT token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ],
  "timestamp": "2024-08-14T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Success Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "metadata": {
    "pagination": {
      "page": 1,
      "pages": 5,
      "total": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
   - Invalid or expired JWT token
   - Account not verified
   - Account suspended

2. **Authorization Errors (403)**
   - Insufficient permissions
   - Role-based access denied
   - Resource ownership mismatch

3. **Validation Errors (400)**
   - Invalid input data
   - Missing required fields
   - Business rule violations

4. **Resource Errors (404)**
   - Entity not found
   - Deleted resources
   - Invalid IDs

5. **Conflict Errors (409)**
   - Double booking attempts
   - Duplicate registration
   - Concurrent modifications

6. **Rate Limiting (429)**
   - Too many requests
   - API throttling
   - Temporary cooldowns

### Error Recovery

1. **Retry Logic**: Implement exponential backoff for temporary failures
2. **Graceful Degradation**: Provide fallback experiences
3. **User Feedback**: Clear error messages with actionable next steps
4. **Logging**: Comprehensive error logging for debugging

---

## Security Considerations

### Authentication Security

- JWT tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Multi-factor authentication for admin accounts
- Account lockout after 5 failed attempts

### Payment Security

- PCI DSS compliant payment processing
- Payment verification for large amounts (>$1000)
- Maximum 3 payment attempts per booking
- Encrypted storage of payment methods

### Data Protection

- Personal data encryption at rest
- Secure file uploads with virus scanning
- GDPR compliance for data handling
- Regular security audits

### API Security

- Rate limiting (100 requests/minute per user)
- Request/response validation
- SQL injection prevention
- XSS protection headers

---

## Additional Resources

- [API Reference Documentation](./API_REFERENCE.md)
- [Security Guidelines](./SECURITY.md)
- [Property Schema Details](./AIRBNB_PROPERTY_SCHEMA.md)
- [Controller Patterns](./CONTROLLER_PATTERNS.md)
- [Internationalization Guide](./I18N_GUIDE.md)

---

_Last Updated: August 14, 2024_
_Version: 1.0_
