import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenManager } from "../utils/auth";
import { API_CONFIG } from "./config";
import { handleApiError } from "./error-handler";

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
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          await tokenManager.setTokens(access_token, newRefreshToken);

          // Retry original request with new token
          originalRequest.headers!.Authorization = `Bearer ${access_token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await tokenManager.clearTokens();
        // You might want to emit an event or use a navigation service here
        // to redirect to login screen
        if (__DEV__) {
          console.error("🔄 Token refresh failed:", refreshError);
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

// Custom instance function for Orval - matches orval documentation
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

// Export configured instance for use with Orval and React Query
export default axiosInstance;
