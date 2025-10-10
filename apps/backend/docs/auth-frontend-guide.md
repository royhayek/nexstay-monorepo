# Frontend Authentication Implementation Guide

This guide provides complete implementation details for the simplified authentication flow, including sign-up and sign-in processes with optional secondary contact information.

## Overview

The authentication system supports:
- **Sign-up/Sign-in** with email or phone number
- **Automatic flow detection** (signup vs signin based on identifier existence)
- **Optional secondary contact** collection during signup
- **Device verification** for new/unusual sign-ins
- **Password reset** functionality

## Base URL

All endpoints are under: `/public/auth`

---

## 🔍 **Step 1: Check Identifier**

**Purpose**: Determine if user should go through signup or signin flow

### Endpoint
```
POST /public/auth/check-identifier
```

### Request
```json
{
  "identifier": "user@example.com"  // or "+1234567890"
}
```

### Response
```json
{
  "status": "success",
  "title": "Identifier Checked",
  "message": "Identifier checked successfully",
  "data": {
    "exists": true,                           // false = signup, true = signin
    "methods": ["email", "google", "facebook"] // available signin methods
  }
}
```

### Frontend Implementation
```javascript
const checkIdentifier = async (identifier) => {
  const response = await fetch('/public/auth/check-identifier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });

  const result = await response.json();

  if (result.data.exists) {
    // Route to SIGNIN flow
    return { flow: 'signin', methods: result.data.methods };
  } else {
    // Route to SIGNUP flow
    return { flow: 'signup' };
  }
};
```

---

## 📧 **SIGNUP FLOW**

### Step 1: Verify Contact
**Purpose**: Send verification code to email or phone

#### Endpoint
```
POST /public/auth/signup/verify-contact
```

#### Request
```json
{
  "identifier": "user@example.com"  // or "+1234567890"
}
```

#### Response
```json
{
  "status": "success",
  "title": "Verification Code Sent",
  "message": "Verification code sent for signup",
  "data": {
    "success": true,
    "testCode": "123456",                    // development only
    "registrationState": "CONTACT_PENDING",
    "codeDeliveryMethod": "email"            // or "sms"
  }
}
```

### Step 2: Verify Code
**Purpose**: Verify the OTP code sent to email/phone

#### Endpoint
```
POST /public/auth/verify
```

#### Request
```json
{
  "method": "email",        // or "phone"
  "identifier": "user@example.com",
  "code": "123456"
}
```

#### Response
```json
{
  "status": "success",
  "title": "Verification Successful",
  "message": "Verification successful",
  "data": {
    "verified": true,
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // use for next step
    "nextStep": "complete_profile"
  }
}
```

### Step 3: Complete Profile
**Purpose**: Provide personal details and optional secondary contact

#### Endpoint
```
POST /public/auth/signup/complete-profile
```

#### Request
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "1990-01-15",
  "password": "MySecurePassword123!",
  "email": "john@example.com",              // optional if signed up with phone
  "phone": "+1234567890",                   // optional if signed up with email
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
```json
{
  "status": "success",
  "title": "Registration Completed",
  "message": "Account created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "registrationState": "PROFILE_COMPLETE",
    "hasSecondaryContact": true,              // false if no secondary contact provided
    "missingContactType": "phone",            // "email" | "phone" | undefined
    "secondaryContactNeedsVerification": true // true if secondary contact provided
  }
}
```

### Optional: Verify Secondary Contact
If `secondaryContactNeedsVerification: true`, call the verify endpoint again:

```json
{
  "method": "phone",        // the secondary contact type
  "identifier": "+1234567890",
  "code": "456789"
}
```

---

## 🔐 **SIGNIN FLOW**

### Step 1: Initiate Sign-in
**Purpose**: Start signin process and get session token

#### Endpoint
```
POST /public/auth/signin/initiate
```

#### Request
```json
{
  "identifier": "user@example.com"  // or "+1234567890"
}
```

#### Response
```json
{
  "status": "success",
  "title": "Sign-in Initiated",
  "message": "Sign-in flow initiated successfully",
  "data": {
    "userExists": true,
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nextStep": "password",                   // or "sms_code" for passwordless
    "hasPassword": true,                      // false for phone users without password
    "testCode": "123456",                     // development only, for passwordless
    "codeDeliveryMethod": "sms"               // when applicable
  }
}
```

### Step 2: Enter Password
**Purpose**: Authenticate with password or request SMS code

#### Endpoint
```
POST /public/auth/signin/password
```

#### Request
```json
{
  "password": "MySecurePassword123!",
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requestSmsCode": false                     // set to true for passwordless phone login
}
```

#### Response

**No Device Verification Needed:**
```json
{
  "status": "success",
  "title": "Password Verified",
  "message": "Password verification completed",
  "data": {
    "requiresDeviceVerification": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Device Verification Required:**
```json
{
  "status": "success",
  "title": "Password Verified",
  "message": "Password verification completed",
  "data": {
    "requiresDeviceVerification": true,
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "testCode": "789012",                     // development only
    "codeDeliveryMethod": "email"             // or "sms"
  }
}
```

### Step 3: Verify Device (if required)
**Purpose**: Complete signin with device verification

#### Endpoint
```
POST /public/auth/signin/verify-device
```

#### Request
```json
{
  "code": "789012",
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
```json
{
  "status": "success",
  "title": "Sign-in Completed",
  "message": "Device verification successful, sign-in completed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📱 **Add Secondary Contact (Post-Registration)**

**Purpose**: Add missing email or phone after account creation

### Endpoint
```
POST /public/auth/add-secondary-contact
```

### Headers
```
Authorization: Bearer <accessToken>
```

### Request
```json
{
  "contactType": "email",           // or "phone"
  "email": "new@example.com"        // or "phone": "+1234567890"
}
```

### Response
```json
{
  "status": "success",
  "title": "Secondary Contact Added",
  "message": "Secondary contact added successfully",
  "data": {
    "success": true,
    "verificationRequired": true,
    "codeDeliveryMethod": "email",    // or "sms"
    "testCode": "456789"              // development only
  }
}
```

### Follow-up: Verify Secondary Contact
Use the standard verify endpoint:
```json
{
  "method": "email",                // matches contactType
  "identifier": "new@example.com",
  "code": "456789"
}
```

---

## 🔄 **Password Reset Flow**

### Step 1: Request Reset
```
POST /public/auth/request-reset
```

```json
{
  "method": "email",                // or "phone"
  "identifier": "user@example.com"
}
```

### Step 2: Verify Reset Code
```
POST /public/auth/verify-reset
```

```json
{
  "method": "email",
  "identifier": "user@example.com",
  "code": "123456"
}
```

### Step 3: Reset Password
```
POST /public/auth/reset-password
```

```json
{
  "method": "email",
  "identifier": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

---

## 🔧 **Frontend Implementation Examples**

### React Hook Example
```javascript
import { useState } from 'react';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startAuthFlow = async (identifier) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check if user exists
      const checkResponse = await fetch('/public/auth/check-identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const result = await checkResponse.json();

      if (result.data.exists) {
        // Start signin flow
        return await startSignin(identifier);
      } else {
        // Start signup flow
        return await startSignup(identifier);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startSignup = async (identifier) => {
    // Send verification code
    const response = await fetch('/public/auth/signup/verify-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });

    return await response.json();
  };

  const verifyCode = async (method, identifier, code) => {
    const response = await fetch('/public/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, identifier, code })
    });

    return await response.json();
  };

  const completeProfile = async (profileData) => {
    const response = await fetch('/public/auth/signup/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    return await response.json();
  };

  return { startAuthFlow, verifyCode, completeProfile, loading, error };
};
```

### Vue.js Composable Example
```javascript
import { ref } from 'vue';

export const useAuth = () => {
  const loading = ref(false);
  const error = ref(null);
  const currentStep = ref('identifier'); // identifier, verify, profile, complete

  const authFlow = async (identifier) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/public/auth/check-identifier', {
        method: 'POST',
        body: { identifier }
      });

      if (response.data.exists) {
        currentStep.value = 'signin';
        return { flow: 'signin', methods: response.data.methods };
      } else {
        currentStep.value = 'signup-verify';
        // Auto-send verification code
        await $fetch('/public/auth/signup/verify-contact', {
          method: 'POST',
          body: { identifier }
        });
        return { flow: 'signup', step: 'verify' };
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { authFlow, loading, error, currentStep };
};
```

---

## ⚠️ **Error Handling**

### Common Error Responses
```json
{
  "status": "error",
  "title": "Validation Failed",
  "message": "Invalid email format",
  "error": {
    "code": "VALIDATION_FAILED",
    "details": ["Email must be a valid email address"]
  }
}
```

### Error Codes to Handle
- `VALIDATION_FAILED` - Invalid input data
- `USER_NOT_FOUND` - User doesn't exist (signin)
- `USER_ALREADY_EXISTS` - User exists (signup)
- `INVALID_CREDENTIALS` - Wrong password
- `INVALID_CODE` - Wrong OTP code
- `CODE_EXPIRED` - OTP code expired
- `ACCOUNT_DISABLED` - User account is disabled
- `TOO_MANY_ATTEMPTS` - Rate limited

---

## 🔐 **Security Best Practices**

1. **Store tokens securely** (httpOnly cookies or secure storage)
2. **Implement token refresh** logic
3. **Validate responses** on client side
4. **Handle network errors** gracefully
5. **Clear sensitive data** from memory/storage on logout
6. **Use HTTPS** in production
7. **Implement proper session timeout**

---

## 🧪 **Testing & Development**

### Development Features
- `testCode` field in responses (development/test only)
- No actual SMS/email sending when `EMAIL_DISABLED=true`
- Detailed error messages and validation

### Testing Endpoints
Use tools like Postman or curl to test the flows:

```bash
# Check identifier
curl -X POST http://localhost:3000/public/auth/check-identifier \
  -H "Content-Type: application/json" \
  -d '{"identifier": "test@example.com"}'

# Start signup
curl -X POST http://localhost:3000/public/auth/signup/verify-contact \
  -H "Content-Type: application/json" \
  -d '{"identifier": "test@example.com"}'
```

---

This guide provides everything needed to implement the complete authentication flow on the frontend. The API is designed to be intuitive and follows RESTful conventions while providing clear guidance on next steps through response data.