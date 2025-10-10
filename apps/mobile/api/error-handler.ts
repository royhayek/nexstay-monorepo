import { AxiosError } from "axios";
import { HTTP_STATUS, API_MESSAGES } from "./config";

// Custom API Error class
export class ApiError extends Error {
  public statusCode: number;
  public data?: any;
  public isApiError = true;

  constructor(message: string, statusCode: number = 500, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Error response type
export interface ErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  data?: any;
}

// Handle different error types
export const handleApiError = (error: AxiosError): ApiError => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new ApiError(API_MESSAGES.TIMEOUT_ERROR, 0);
    }
    return new ApiError(API_MESSAGES.NETWORK_ERROR, 0);
  }

  const { status, data } = error.response;
  const errorData = data as any;

  // Extract error message
  let message = errorData?.message || errorData?.error || API_MESSAGES.SERVER_ERROR;

  // Handle validation errors
  if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY && errorData?.errors) {
    const validationErrors = errorData.errors;
    const firstError = Object.values(validationErrors)[0];
    if (Array.isArray(firstError)) {
      message = firstError[0];
    } else if (typeof firstError === "string") {
      message = firstError;
    }
  }

  // Handle specific status codes
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return new ApiError(message || API_MESSAGES.VALIDATION_ERROR, status, errorData);

    case HTTP_STATUS.UNAUTHORIZED:
      return new ApiError(message || API_MESSAGES.UNAUTHORIZED, status, errorData);

    case HTTP_STATUS.FORBIDDEN:
      return new ApiError(message || API_MESSAGES.FORBIDDEN, status, errorData);

    case HTTP_STATUS.NOT_FOUND:
      return new ApiError(message || API_MESSAGES.NOT_FOUND, status, errorData);

    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return new ApiError("Too many requests. Please try again later.", status, errorData);

    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
    case HTTP_STATUS.GATEWAY_TIMEOUT:
      return new ApiError(message || API_MESSAGES.SERVER_ERROR, status, errorData);

    default:
      return new ApiError(message, status, errorData);
  }
};

// Check if error is an API error
export const isApiError = (error: any): error is ApiError => {
  return error?.isApiError === true;
};

// Get user-friendly error message
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return API_MESSAGES.SERVER_ERROR;
};

// Format validation errors for display
export const formatValidationErrors = (errors: Record<string, string[]>): string[] => {
  const formattedErrors: string[] = [];

  Object.entries(errors).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      messages.forEach(message => {
        formattedErrors.push(message);
      });
    } else if (typeof messages === "string") {
      formattedErrors.push(messages);
    }
  });

  return formattedErrors;
};

// Error logger for development
export const logError = (error: any, context?: string): void => {
  if (__DEV__) {
    console.group(`❌ Error${context ? ` in ${context}` : ""}`);

    if (isApiError(error)) {
      console.error("Status Code:", error.statusCode);
      console.error("Message:", error.message);
      if (error.data) {
        console.error("Data:", error.data);
      }
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }

    console.groupEnd();
  }
};