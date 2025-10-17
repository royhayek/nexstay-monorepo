import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { tokenManager } from "../utils/auth";
import { API_CONFIG } from "./config";
import { handleApiError } from "./error-handler";

// Forward declaration for refresh function to avoid circular dependency
// This will be assigned after module initialization
let authPublicControllerRefresh: any = null;

// Extend AxiosRequestConfig to include our custom metadata
declare module "axios" {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

// Create axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    console.log("[Axios] :: ", config);
    // Add auth token to requests
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for performance tracking
    config.metadata = { startTime: new Date() };

    // Log request in development
    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(handleApiError(error));
  }
);

// Track concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (__DEV__) {
      const startTime = response.config.metadata?.startTime;
      const duration = startTime ? new Date().getTime() - startTime.getTime() : 0;
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`,
        response.data
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Check network status before attempting refresh
        const networkState = await NetInfo.fetch();
        const isOffline = !networkState.isConnected || networkState.isInternetReachable === false;

        if (isOffline) {
          // Don't attempt refresh when offline
          if (__DEV__) {
            console.warn("🔄 Token refresh skipped - device is offline");
          }
          throw new Error("No internet connection. Please check your network and try again.");
        }

        // If a refresh is already in progress, wait for it
        if (refreshPromise) {
          const newAccessToken = await refreshPromise;
          if (newAccessToken) {
            originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
          throw new Error("Token refresh failed");
        }

        // Start a new refresh
        refreshPromise = (async () => {
          try {
            const refreshToken = await tokenManager.getRefreshToken();
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Use the refresh function (set via setRefreshFunction after module initialization)
            if (!authPublicControllerRefresh) {
              throw new Error("Refresh function not initialized");
            }

            // Call refresh using the generated Orval function
            const response = await authPublicControllerRefresh({
              refreshToken: refreshToken,
            });

            // Extract tokens from response (Orval already unwraps the data)
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            if (!accessToken || !newRefreshToken) {
              throw new Error("Invalid refresh response");
            }

            await tokenManager.setTokens(accessToken, newRefreshToken);

            if (__DEV__) {
              console.info("🔄 Tokens refreshed successfully");
            }

            return accessToken;
          } catch (error) {
            // Clear tokens on refresh failure
            await tokenManager.clearTokens();
            if (__DEV__) {
              console.error("🔄 Token refresh failed:", error);
            }
            throw error;
          } finally {
            refreshPromise = null; // Clear the promise
          }
        })();

        const newAccessToken = await refreshPromise;
        if (newAccessToken) {
          // Retry original request with new token
          originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        // Token refresh failed, error is already logged in the refresh promise
        // User will need to login again
        if (__DEV__) {
          console.error("🔄 Token refresh failed, user needs to re-authenticate");
        }
      }
    }

    // Log error in development
    if (__DEV__) {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || "Network Error"}`,
        error.response?.data || error.message
      );
    }

    return Promise.reject(handleApiError(error));
  }
);

// Custom instance function for generated Orval code
// This will be used by the generated API client after post-processing
export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  // eslint-disable-next-line import/no-named-as-default-member
  const source = axios.CancelToken.source();

  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // Add cancellation method to promise
  (promise as any).cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

// Type definitions for orval
export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;

// Function to set the refresh function after module initialization
// This breaks the circular dependency by allowing late binding
export const setRefreshFunction = (refreshFn: any) => {
  authPublicControllerRefresh = refreshFn;
};

// Export configured instance for direct use
export default axiosInstance;
