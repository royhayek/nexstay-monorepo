/**
 * Common error interfaces used across the application
 */

export interface DatabaseError extends Error {
  code?: number;
}

export interface ValidationError extends Error {
  field?: string;
  value?: any;
}

export interface NotFoundError extends Error {
  resource: string;
  id?: string;
}

export interface AuthenticationError extends Error {
  code?: string;
  statusCode?: number;
}

export interface AuthorizationError extends Error {
  action?: string;
  resource?: string;
}
