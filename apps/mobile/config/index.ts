// Main configuration exports
export { APP_CONFIG, isDevelopment, isProduction, isStaging } from "./app";
export { isServiceAvailable, SERVICES_CONFIG } from "./services";

// Re-export API config from its original location for backward compatibility
export { API_CONFIG, API_MESSAGES, HTTP_STATUS } from "../api/config";
