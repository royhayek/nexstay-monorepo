import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface MessageQueueData {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipient: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  retryAttempts?: number;
  delay?: number;
}

export interface DeliveryStatusData {
  messageId: string;
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'retrying';
  provider: 'twilio' | 'email' | 'firebase' | 'webhook';
  error?: string;
  deliveredAt?: Date;
  attempts: number;
  maxAttempts: number;
}

/**
 * Message Queue Service
 * Handles message queuing with Bull/Redis for reliable message delivery
 */
@Injectable()
export class MessageQueueService {
  constructor(
    @InjectQueue('message-delivery') private messageQueue: Queue,
    @InjectQueue('notification-processing') private notificationQueue: Queue,
    @InjectQueue('delivery-status') private statusQueue: Queue,
  ) {}

  /**
   * Queue an email message for delivery
   */
  async queueEmail(
    recipient: string,
    subject: string,
    content: string,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      delay?: number;
      retryAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const jobData: MessageQueueData = {
      type: 'email',
      recipient,
      subject,
      content,
      priority: options.priority || 'normal',
      retryAttempts: options.retryAttempts || 3,
      delay: options.delay || 0,
      metadata: options.metadata,
    };

    const job = await this.messageQueue.add('send-email', jobData, {
      priority: this.getPriorityValue(options.priority || 'normal'),
      delay: options.delay || 0,
      attempts: options.retryAttempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
    });

    LoggingUtil.log(`Queued email message with job ID: ${job.id}`, 'MessageQueueService');
    return String(job.id);
  }

  /**
   * Queue an SMS message for delivery
   */
  async queueSMS(
    recipient: string,
    content: string,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      delay?: number;
      retryAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const jobData: MessageQueueData = {
      type: 'sms',
      recipient,
      content,
      priority: options.priority || 'normal',
      retryAttempts: options.retryAttempts || 3,
      delay: options.delay || 0,
      metadata: options.metadata,
    };

    const job = await this.messageQueue.add('send-sms', jobData, {
      priority: this.getPriorityValue(options.priority || 'normal'),
      delay: options.delay || 0,
      attempts: options.retryAttempts || 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    LoggingUtil.log(`Queued SMS message with job ID: ${job.id}`, 'MessageQueueService');
    return String(job.id);
  }

  /**
   * Queue a push notification for delivery
   */
  async queuePushNotification(
    recipient: string,
    content: string,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      delay?: number;
      retryAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<string> {
    const jobData: MessageQueueData = {
      type: 'push',
      recipient,
      content,
      priority: options.priority || 'normal',
      retryAttempts: options.retryAttempts || 3,
      delay: options.delay || 0,
      metadata: options.metadata,
    };

    const job = await this.notificationQueue.add('send-push', jobData, {
      priority: this.getPriorityValue(options.priority || 'normal'),
      delay: options.delay || 0,
      attempts: options.retryAttempts || 3,
      backoff: {
        type: 'exponential',
        delay: 1500,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    LoggingUtil.log(`Queued push notification with job ID: ${job.id}`, 'MessageQueueService');
    return String(job.id);
  }

  /**
   * Queue a batch of messages for delivery
   */
  async queueBatchMessages(messages: MessageQueueData[]): Promise<string[]> {
    const jobs = messages.map((messageData) => ({
      name: `send-${messageData.type}`,
      data: messageData,
      opts: {
        priority: this.getPriorityValue(messageData.priority || 'normal'),
        delay: messageData.delay || 0,
        attempts: messageData.retryAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }));

    const addedJobs = await this.messageQueue.addBulk(jobs);
    const jobIds = addedJobs.map((job) => String(job.id));

    LoggingUtil.log(`Queued ${jobIds.length} batch messages`, 'MessageQueueService');
    return jobIds;
  }

  /**
   * Track delivery status of a message
   */
  async trackDeliveryStatus(
    messageId: string,
    status: DeliveryStatusData['status'],
    provider: DeliveryStatusData['provider'],
    options: {
      error?: string;
      deliveredAt?: Date;
      attempts?: number;
      maxAttempts?: number;
    } = {},
  ): Promise<void> {
    const statusData: DeliveryStatusData = {
      messageId,
      status,
      provider,
      error: options.error,
      deliveredAt: options.deliveredAt,
      attempts: options.attempts || 1,
      maxAttempts: options.maxAttempts || 3,
    };

    await this.statusQueue.add('update-delivery-status', statusData, {
      removeOnComplete: 500, // Keep more delivery status records
      removeOnFail: 100,
    });

    LoggingUtil.log(
      `Tracked delivery status for message ${messageId}: ${status}`,
      'MessageQueueService',
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    messageQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    notificationQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    statusQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [messageStats, notificationStats, statusStats] = await Promise.all([
      this.getQueueStat(this.messageQueue),
      this.getQueueStat(this.notificationQueue),
      this.getQueueStat(this.statusQueue),
    ]);

    return {
      messageQueue: messageStats,
      notificationQueue: notificationStats,
      statusQueue: statusStats,
    };
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(queueName: 'message' | 'notification' | 'status'): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.pause();
    LoggingUtil.log(`Paused ${queueName} queue`, 'MessageQueueService');
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(queueName: 'message' | 'notification' | 'status'): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.resume();
    LoggingUtil.log(`Resumed ${queueName} queue`, 'MessageQueueService');
  }

  /**
   * Clear all jobs from queue
   */
  async clearQueue(queueName: 'message' | 'notification' | 'status'): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.empty();
    LoggingUtil.log(`Cleared ${queueName} queue`, 'MessageQueueService');
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: 'message' | 'notification' | 'status', jobId: string) {
    const queue = this.getQueueByName(queueName);
    return await queue.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: 'message' | 'notification' | 'status', jobId: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      LoggingUtil.log(`Cancelled job ${jobId} in ${queueName} queue`, 'MessageQueueService');
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: 'message' | 'notification' | 'status', jobId: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    const job = await queue.getJob(jobId);
    if (job && job.failedReason) {
      await job.retry();
      LoggingUtil.log(`Retried job ${jobId} in ${queueName} queue`, 'MessageQueueService');
    }
  }

  /**
   * Private helper methods
   */
  private getPriorityValue(priority: 'low' | 'normal' | 'high' | 'critical'): number {
    const priorityMap = {
      low: 1,
      normal: 5,
      high: 10,
      critical: 20,
    };
    return priorityMap[priority];
  }

  private getQueueByName(queueName: 'message' | 'notification' | 'status'): Queue {
    switch (queueName) {
      case 'message':
        return this.messageQueue;
      case 'notification':
        return this.notificationQueue;
      case 'status':
        return this.statusQueue;
      default:
        throw new Error(`Unknown queue name: ${String(queueName)}`);
    }
  }

  private async getQueueStat(queue: Queue): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
