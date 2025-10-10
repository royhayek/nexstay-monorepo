import { Injectable } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { LoggingUtil } from '../../../common/utils/logging.util';

interface OposumStats {
  fires: number;
  successes: number;
  failures: number;
  rejects: number;
  latencyMean: number;
}

interface ExtendedCircuitBreaker<T> {
  stats: OposumStats;
  opened: boolean;
  halfOpen: boolean;
  open(): void;
  close(): void;
  clearCache(): void;
  fire(...args: unknown[]): Promise<T>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

export interface CircuitBreakerOptions {
  timeout?: number; // Time in ms to wait for function to complete
  errorThresholdPercentage?: number; // Percentage of failures to open circuit
  resetTimeout?: number; // Time in ms to wait before attempting to close circuit
  rollingCountTimeout?: number; // Time window for failure percentage calculation
  rollingCountBuckets?: number; // Number of buckets for rolling window
  volumeThreshold?: number; // Minimum number of requests before circuit can open
  errorFilter?: (error: Error) => boolean; // Function to determine if error should count as failure
}

export interface CircuitBreakerMonitoringStats {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  requests: number;
  successes: number;
  failures: number;
  rejections: number;
  errorRate: number;
  meanResponseTime: number;
}

/**
 * Circuit Breaker Service
 * Provides circuit breaker functionality for external services (Twilio, Email)
 * to prevent cascade failures and improve system resilience
 */
@Injectable()
export class CircuitBreakerService {
  private circuitBreakers: Map<string, ExtendedCircuitBreaker<unknown>> = new Map();
  private defaultOptions: CircuitBreakerOptions = {
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 50, // 50% error rate
    resetTimeout: 30000, // 30 seconds
    rollingCountTimeout: 10000, // 10 seconds rolling window
    rollingCountBuckets: 10,
    volumeThreshold: 10, // Minimum 10 requests
  };

  /**
   * Create or get existing circuit breaker for a service
   */
  createCircuitBreaker<T>(
    name: string,
    serviceFunction: (...args: unknown[]) => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): ExtendedCircuitBreaker<T> {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)! as ExtendedCircuitBreaker<T>;
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const circuitBreaker = this.createOposumCircuitBreaker<T>(serviceFunction, mergedOptions);

    this.setupCircuitBreakerEvents(circuitBreaker, name);
    this.circuitBreakers.set(name, circuitBreaker as ExtendedCircuitBreaker<unknown>);

    LoggingUtil.log(`Created circuit breaker for service: ${name}`, 'CircuitBreakerService');
    return circuitBreaker;
  }

  /**
   * Execute function with circuit breaker protection for Twilio SMS
   */
  async executeTwilioSMS<T>(
    serviceFunction: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
  ): Promise<T> {
    const circuitBreaker = this.createCircuitBreaker('twilio-sms', serviceFunction, {
      timeout: 15000, // Twilio can be slower
      errorThresholdPercentage: 60, // Higher threshold for SMS
      resetTimeout: 60000, // 1 minute reset
      volumeThreshold: 5,
      errorFilter: (error) => {
        // Don't count rate limiting as circuit breaker failure
        if ((error as { code?: number })?.code === 20429) {
          return false;
        }
        // Don't count invalid phone numbers as circuit breaker failure
        if (
          (error as { code?: number })?.code === 21211 ||
          (error as { code?: number })?.code === 21614
        ) {
          return false;
        }
        return true;
      },
    });

    return await circuitBreaker.fire(...args);
  }

  /**
   * Execute function with circuit breaker protection for Email service
   */
  async executeEmailService<T>(
    serviceFunction: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
  ): Promise<T> {
    const circuitBreaker = this.createCircuitBreaker('email-service', serviceFunction, {
      timeout: 30000, // Email can take longer
      errorThresholdPercentage: 40, // Lower threshold for email
      resetTimeout: 45000, // 45 seconds reset
      volumeThreshold: 10,
      errorFilter: (error) => {
        // Don't count invalid email addresses as circuit breaker failure
        if ((error as { message?: string })?.message?.includes('Invalid email')) {
          return false;
        }
        // Don't count temporary SMTP issues as circuit breaker failure
        if (
          (error as { code?: string })?.code === 'ECONNRESET' ||
          (error as { code?: string })?.code === 'ETIMEDOUT'
        ) {
          return true; // These should count as failures
        }
        return true;
      },
    });

    return await circuitBreaker.fire(...args);
  }

  /**
   * Execute function with circuit breaker protection for Firebase Push Notifications
   */
  async executeFirebasePush<T>(
    serviceFunction: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
  ): Promise<T> {
    const circuitBreaker = this.createCircuitBreaker('firebase-push', serviceFunction, {
      timeout: 20000, // Firebase timeout
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 8,
      errorFilter: (error) => {
        // Don't count invalid tokens as circuit breaker failure
        if (
          (error as { errorInfo?: { code?: string } })?.errorInfo?.code ===
          'messaging/invalid-registration-token'
        ) {
          return false;
        }
        if (
          (error as { errorInfo?: { code?: string } })?.errorInfo?.code ===
          'messaging/registration-token-not-registered'
        ) {
          return false;
        }
        return true;
      },
    });

    return await circuitBreaker.fire(...args);
  }

  /**
   * Execute function with circuit breaker protection for Webhook calls
   */
  async executeWebhook<T>(
    serviceFunction: (...args: unknown[]) => Promise<T>,
    webhookName: string,
    ...args: unknown[]
  ): Promise<T> {
    const circuitBreaker = this.createCircuitBreaker(`webhook-${webhookName}`, serviceFunction, {
      timeout: 10000,
      errorThresholdPercentage: 70, // Higher threshold for webhooks
      resetTimeout: 120000, // 2 minutes reset for webhooks
      volumeThreshold: 3,
      errorFilter: (error) => {
        // 4xx errors don't count as circuit breaker failures (client errors)
        const response = (error as { response?: { status?: number } })?.response;
        if (response?.status && response.status >= 400 && response.status < 500) {
          return false;
        }
        return true;
      },
    });

    return await circuitBreaker.fire(...args);
  }

  /**
   * Get circuit breaker statistics for monitoring
   */
  getCircuitBreakerStats(name: string): CircuitBreakerMonitoringStats | null {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (!circuitBreaker) {
      return null;
    }

    const stats = circuitBreaker.stats;
    const totalRequests: number = stats.fires;
    const errorRate = totalRequests > 0 ? (stats.failures / totalRequests) * 100 : 0;

    return {
      name,
      state: circuitBreaker.opened ? 'OPEN' : circuitBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      requests: totalRequests,
      successes: stats.successes,
      failures: stats.failures,
      rejections: stats.rejects,
      errorRate: Math.round(errorRate * 100) / 100,
      meanResponseTime: Math.round(stats.latencyMean * 100) / 100,
    };
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllCircuitBreakerStats(): CircuitBreakerMonitoringStats[] {
    const allStats: CircuitBreakerMonitoringStats[] = [];
    for (const name of this.circuitBreakers.keys()) {
      const stats = this.getCircuitBreakerStats(name);
      if (stats) {
        allStats.push(stats);
      }
    }
    return allStats;
  }

  /**
   * Manually open a circuit breaker
   */
  openCircuitBreaker(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.open();
      LoggingUtil.log(`Manually opened circuit breaker: ${name}`, 'CircuitBreakerService');
      return true;
    }
    return false;
  }

  /**
   * Manually close a circuit breaker
   */
  closeCircuitBreaker(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.close();
      LoggingUtil.log(`Manually closed circuit breaker: ${name}`, 'CircuitBreakerService');
      return true;
    }
    return false;
  }

  /**
   * Reset circuit breaker statistics
   */
  resetCircuitBreakerStats(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.clearCache();
      LoggingUtil.log(`Reset statistics for circuit breaker: ${name}`, 'CircuitBreakerService');
      return true;
    }
    return false;
  }

  /**
   * Check if circuit breaker exists
   */
  hasCircuitBreaker(name: string): boolean {
    return this.circuitBreakers.has(name);
  }

  /**
   * Remove circuit breaker
   */
  removeCircuitBreaker(name: string): boolean {
    const removed = this.circuitBreakers.delete(name);
    if (removed) {
      LoggingUtil.log(`Removed circuit breaker: ${name}`, 'CircuitBreakerService');
    }
    return removed;
  }

  /**
   * Create oposum circuit breaker with proper typing
   */
  private createOposumCircuitBreaker<T>(
    serviceFunction: (...args: unknown[]) => Promise<T>,
    options: CircuitBreakerOptions,
  ): ExtendedCircuitBreaker<T> {
    interface OposumConfig {
      timeout?: number;
      errorThresholdPercentage?: number;
      resetTimeout?: number;
      rollingCountTimeout?: number;
      rollingCountBuckets?: number;
      volumeThreshold?: number;
      errorFilter?: (error: Error) => boolean;
    }

    const config: OposumConfig = {
      timeout: options.timeout,
      errorThresholdPercentage: options.errorThresholdPercentage,
      resetTimeout: options.resetTimeout,
      rollingCountTimeout: options.rollingCountTimeout,
      rollingCountBuckets: options.rollingCountBuckets,
      volumeThreshold: options.volumeThreshold,
      errorFilter: options.errorFilter,
    };

    const OposumConstructor = CircuitBreaker as new <U>(
      action: (...args: unknown[]) => Promise<U>,
      config: OposumConfig,
    ) => ExtendedCircuitBreaker<U>;

    return new OposumConstructor<T>(serviceFunction, config);
  }

  /**
   * Setup event listeners for circuit breaker monitoring
   */
  private setupCircuitBreakerEvents(
    circuitBreaker: ExtendedCircuitBreaker<unknown>,
    name: string,
  ): void {
    circuitBreaker.on('open', () => {
      LoggingUtil.log(
        `Circuit breaker opened for service: ${name}. Service calls will be rejected.`,
        'CircuitBreakerService',
      );
    });

    circuitBreaker.on('halfOpen', () => {
      LoggingUtil.log(
        `Circuit breaker half-opened for service: ${name}. Testing if service is recovered.`,
        'CircuitBreakerService',
      );
    });

    circuitBreaker.on('close', () => {
      LoggingUtil.log(
        `Circuit breaker closed for service: ${name}. Service calls will proceed normally.`,
        'CircuitBreakerService',
      );
    });

    circuitBreaker.on('reject', () => {
      LoggingUtil.log(
        `Circuit breaker rejected call for service: ${name}. Service is currently unavailable.`,
        'CircuitBreakerService',
      );
    });

    circuitBreaker.on('timeout', () => {
      LoggingUtil.log(
        `Circuit breaker timeout for service: ${name}. Call took too long to complete.`,
        'CircuitBreakerService',
      );
    });

    circuitBreaker.on('failure', (error: Error) => {
      LoggingUtil.errorWithException(
        `Circuit breaker failure for service: ${name}`,
        error,
        'CircuitBreakerService',
      );
    });
  }
}
