import axios, { AxiosError, AxiosRequestConfig } from "axios";

/**
 * Custom Axios instance function for Orval
 *
 * This is a minimal implementation that Orval can parse during code generation.
 * At runtime, the generated code will use this function which creates requests
 * using a basic axios instance.
 *
 * Note: For the configured axios instance with interceptors, we'll need to
 * manually adjust the generated imports after generation or use a post-generation script.
 */

export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  // Create a basic axios instance for Orval
  // This allows Orval to parse the file without React Native dependencies
  const instance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  });

  // eslint-disable-next-line import/no-named-as-default-member
  const source = axios.CancelToken.source();

  const promise = instance({
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
