/**
 * Analytics Utility
 *
 * Simple analytics tracking system that logs events.
 * Can be extended to integrate with Firebase Analytics, Amplitude, Mixpanel, etc.
 *
 * @example
 * ```ts
 * import { analytics } from '@/utils/analytics';
 *
 * analytics.track('button_clicked', { button_name: 'sign_up' });
 * ```
 */

export type AnalyticsEventName =
  // Role Switching Events
  | "role_switched"
  | "role_switch_failed"
  // Navigation Events
  | "screen_viewed"
  | "tab_pressed"
  // User Actions
  | "button_clicked"
  | "form_submitted"
  | "search_performed"
  // Generic Events
  | string;

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Analytics class for tracking user events
 */
class Analytics {
  private enabled: boolean = true;

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.info(`[Analytics] Tracking ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Track an analytics event
   *
   * @param eventName - Name of the event to track
   * @param properties - Optional properties associated with the event
   *
   * @example
   * ```ts
   * analytics.track('role_switched', {
   *   from_role: 'guest',
   *   to_role: 'host',
   *   timestamp: Date.now(),
   * });
   * ```
   */
  track(eventName: AnalyticsEventName, properties?: AnalyticsEventProperties): void {
    if (!this.enabled) {
      return;
    }

    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      properties: properties || {},
    };

    // Log to console in development
    if (__DEV__) {
      console.log("[Analytics] Event tracked:", eventData);
    }

    // TODO: Integrate with analytics services here
    // Examples:
    // - Firebase Analytics: firebase.analytics().logEvent(eventName, properties)
    // - Amplitude: amplitude.track(eventName, properties)
    // - Mixpanel: mixpanel.track(eventName, properties)
    // - Segment: analytics.track(eventName, properties)
  }

  /**
   * Track a screen view event
   *
   * @param screenName - Name of the screen being viewed
   * @param properties - Optional properties associated with the screen view
   */
  screen(screenName: string, properties?: AnalyticsEventProperties): void {
    this.track("screen_viewed", {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Identify a user (for user-centric analytics)
   *
   * @param userId - Unique user identifier
   * @param traits - Optional user traits/properties
   */
  identify(userId: string, traits?: AnalyticsEventProperties): void {
    if (!this.enabled) {
      return;
    }

    if (__DEV__) {
      console.log("[Analytics] User identified:", { userId, traits });
    }

    // TODO: Integrate with analytics services here
    // Examples:
    // - Amplitude: amplitude.setUserId(userId)
    // - Mixpanel: mixpanel.identify(userId)
    // - Segment: analytics.identify(userId, traits)
  }

  /**
   * Reset analytics data (typically on logout)
   */
  reset(): void {
    if (!this.enabled) {
      return;
    }

    if (__DEV__) {
      console.log("[Analytics] User data reset");
    }

    // TODO: Integrate with analytics services here
    // Examples:
    // - Amplitude: amplitude.regenerateDeviceId()
    // - Mixpanel: mixpanel.reset()
    // - Segment: analytics.reset()
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export default for convenience
export default analytics;
