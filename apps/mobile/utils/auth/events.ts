/**
 * Authentication event emitter
 * Used to communicate auth state changes across the app
 */

type AuthEventType = "TOKEN_EXPIRED" | "LOGOUT_REQUIRED" | "REFRESH_FAILED";

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: Map<AuthEventType, Set<AuthEventListener>> = new Map();

  /**
   * Subscribe to an auth event
   */
  on(event: AuthEventType, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit an auth event
   */
  emit(event: AuthEventType): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error(`Error in auth event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event (or all events if not specified)
   */
  clear(event?: AuthEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const authEvents = new AuthEventEmitter();
