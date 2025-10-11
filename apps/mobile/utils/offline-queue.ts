import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Types of auth operations that can be queued
 */
export enum QueuedOperationType {
  SIGNUP_VERIFY_CONTACT = 'SIGNUP_VERIFY_CONTACT',
  VERIFY = 'VERIFY',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  SIGNIN_INITIATE = 'SIGNIN_INITIATE',
  SIGNIN_PASSWORD = 'SIGNIN_PASSWORD',
  SIGNIN_VERIFY_DEVICE = 'SIGNIN_VERIFY_DEVICE',
  REQUEST_RESET = 'REQUEST_RESET',
  VERIFY_RESET = 'VERIFY_RESET',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ADD_SECONDARY_CONTACT = 'ADD_SECONDARY_CONTACT',
  REQUEST_VERIFY = 'REQUEST_VERIFY',
}

/**
 * Interface for a queued operation
 */
export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  params: unknown; // Parameters for the operation
  timestamp: number; // When it was queued
  retryCount: number; // Number of retry attempts
  maxRetries: number; // Maximum retry attempts
}

/**
 * Storage key for the offline queue
 */
const QUEUE_STORAGE_KEY = '@auth_offline_queue';

/**
 * Maximum number of operations to keep in the queue
 */
const MAX_QUEUE_SIZE = 50;

/**
 * Default maximum retry attempts
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Offline Queue Manager
 * Handles queuing and processing of auth operations when offline
 */
class OfflineQueueManager {
  private queue: QueuedOperation[] = [];
  private isProcessing: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Initialize the queue by loading from storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const storedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);

        if (__DEV__) {
          console.log(`[OfflineQueue] Loaded ${this.queue.length} operations from storage`);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('[OfflineQueue] Error loading queue from storage:', error);
      this.queue = [];
      this.isInitialized = true;
    }
  }

  /**
   * Save the queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));

      if (__DEV__) {
        console.log(`[OfflineQueue] Saved ${this.queue.length} operations to storage`);
      }
    } catch (error) {
      console.error('[OfflineQueue] Error saving queue to storage:', error);
    }
  }

  /**
   * Add an operation to the queue
   */
  async addOperation(
    type: QueuedOperationType,
    params: unknown,
    maxRetries: number = DEFAULT_MAX_RETRIES
  ): Promise<string> {
    await this.initialize();

    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest operation
      this.queue.shift();

      if (__DEV__) {
        console.warn('[OfflineQueue] Queue size limit reached, removing oldest operation');
      }
    }

    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      params,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(operation);
    await this.saveQueue();

    if (__DEV__) {
      console.log(`[OfflineQueue] Added operation ${operation.type} (ID: ${operation.id})`);
    }

    return operation.id;
  }

  /**
   * Get all queued operations
   */
  async getQueue(): Promise<QueuedOperation[]> {
    await this.initialize();
    return [...this.queue];
  }

  /**
   * Get the count of queued operations
   */
  async getQueueSize(): Promise<number> {
    await this.initialize();
    return this.queue.length;
  }

  /**
   * Remove an operation from the queue
   */
  async removeOperation(operationId: string): Promise<boolean> {
    await this.initialize();

    const index = this.queue.findIndex((op) => op.id === operationId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();

      if (__DEV__) {
        console.log(`[OfflineQueue] Removed operation ${operationId}`);
      }

      return true;
    }

    return false;
  }

  /**
   * Clear all operations from the queue
   */
  async clearQueue(): Promise<void> {
    await this.initialize();

    this.queue = [];
    await this.saveQueue();

    if (__DEV__) {
      console.log('[OfflineQueue] Cleared all operations');
    }
  }

  /**
   * Process the queue by executing operations
   */
  async processQueue(
    executor: (operation: QueuedOperation) => Promise<unknown>
  ): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    await this.initialize();

    if (this.isProcessing) {
      if (__DEV__) {
        console.log('[OfflineQueue] Already processing queue, skipping');
      }
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (this.queue.length === 0) {
      if (__DEV__) {
        console.log('[OfflineQueue] Queue is empty, nothing to process');
      }
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    if (__DEV__) {
      console.log(`[OfflineQueue] Starting to process ${this.queue.length} operations`);
    }

    // Process each operation
    const operationsToProcess = [...this.queue];

    for (const operation of operationsToProcess) {
      try {
        results.processed++;

        // Execute the operation
        await executor(operation);

        // Remove from queue on success
        await this.removeOperation(operation.id);
        results.succeeded++;

        if (__DEV__) {
          console.log(`[OfflineQueue] ✅ Successfully processed ${operation.type}`);
        }
      } catch {
        // Increment retry count
        operation.retryCount++;

        if (operation.retryCount >= operation.maxRetries) {
          // Max retries reached, remove from queue
          await this.removeOperation(operation.id);
          results.failed++;

          if (__DEV__) {
            console.error(
              `[OfflineQueue] ❌ Failed to process ${operation.type} after ${operation.maxRetries} retries, removing from queue`
            );
          }
        } else {
          // Update operation in queue
          const index = this.queue.findIndex((op) => op.id === operation.id);
          if (index !== -1) {
            this.queue[index] = operation;
            await this.saveQueue();

            if (__DEV__) {
              console.warn(
                `[OfflineQueue] ⚠️ Failed to process ${operation.type} (retry ${operation.retryCount}/${operation.maxRetries})`
              );
            }
          }
        }
      }
    }

    this.isProcessing = false;

    if (__DEV__) {
      console.log(
        `[OfflineQueue] Processing complete: ${results.succeeded} succeeded, ${results.failed} failed, ${this.queue.length} remaining`
      );
    }

    return results;
  }

  /**
   * Check if queue is currently being processed
   */
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();
