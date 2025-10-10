import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

import { DevicePlatform, NotificationPriority } from '../../../common/enums/notification.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { JsonUtils, JsonTypeGuards } from '../../../common/utils/json.utils';

export interface FirebaseMessage {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  priority?: NotificationPriority;
  isSilent?: boolean;
  actionUrl?: string;
  platform?: DevicePlatform;
}

export interface FirebaseMulticastMessage {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  priority?: NotificationPriority;
  isSilent?: boolean;
  actionUrl?: string;
}

export interface FirebaseResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  failureCount?: number;
  successCount?: number;
  responses?: Array<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

@Injectable()
export class FirebaseService {
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const firebaseCredentials = this.configService.get<string>('FIREBASE_CREDENTIALS');
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

      if (!firebaseCredentials || !projectId) {
        LoggingUtil.warn(
          'Firebase credentials not configured. Push notifications will be disabled.',
          'FirebaseService',
        );
        return;
      }

      // Parse credentials (could be base64 encoded or JSON string)
      let credentials: admin.ServiceAccount;
      const credentialsString = Buffer.isBuffer(firebaseCredentials)
        ? firebaseCredentials.toString()
        : firebaseCredentials;

      const parseResult = JsonUtils.parseWithValidation<admin.ServiceAccount>(credentialsString, {
        context: 'FirebaseService.initializeFirebase',
        schema: (value): value is admin.ServiceAccount =>
          JsonTypeGuards.isObject(value) &&
          JsonTypeGuards.isString(value.project_id) &&
          JsonTypeGuards.isString(value.private_key) &&
          JsonTypeGuards.isString(value.client_email),
      });

      if (parseResult.success && parseResult.data) {
        credentials = parseResult.data;
      } else {
        // Try base64 decode as fallback
        const base64Decoded = Buffer.from(firebaseCredentials, 'base64').toString();
        const base64ParseResult = JsonUtils.parseWithValidation<admin.ServiceAccount>(
          base64Decoded,
          {
            context: 'FirebaseService.initializeFirebase.base64',
            schema: (value): value is admin.ServiceAccount =>
              JsonTypeGuards.isObject(value) &&
              JsonTypeGuards.isString(value.project_id) &&
              JsonTypeGuards.isString(value.private_key) &&
              JsonTypeGuards.isString(value.client_email),
          },
        );

        if (!base64ParseResult.success || !base64ParseResult.data) {
          throw new Error(
            `Failed to parse Firebase credentials: ${parseResult.error || base64ParseResult.error}`,
          );
        }

        credentials = base64ParseResult.data;
      }

      // Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId,
      });

      LoggingUtil.log('Firebase Admin SDK initialized successfully', 'FirebaseService');
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to initialize Firebase Admin SDK',
        error,
        'FirebaseService',
      );
    }
  }

  /**
   * Send a push notification to a single device
   */
  async sendToDevice(message: FirebaseMessage): Promise<FirebaseResponse> {
    if (!this.app) {
      return {
        success: false,
        error: 'Firebase not initialized',
      };
    }

    try {
      const payload = this.buildFirebaseMessage(message);
      const response = await admin.messaging(this.app).send(payload);

      LoggingUtil.log(`Push notification sent successfully: ${response}`, 'FirebaseService');
      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to send push notification', error, 'FirebaseService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a push notification to multiple devices
   */
  async sendToMultipleDevices(message: FirebaseMulticastMessage): Promise<FirebaseResponse> {
    if (!this.app) {
      return {
        success: false,
        error: 'Firebase not initialized',
      };
    }

    if (message.tokens.length === 0) {
      return {
        success: false,
        error: 'No tokens provided',
      };
    }

    try {
      const payload = this.buildFirebaseMulticastMessage(message);
      const response = await admin.messaging(this.app).sendEachForMulticast(payload);

      LoggingUtil.log(
        `Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
        'FirebaseService',
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((resp) => ({
          success: resp.success,
          messageId: resp.messageId,
          error: resp.error?.message,
        })),
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send multicast push notification',
        error,
        'FirebaseService',
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate a Firebase token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      // Send a dry-run message to validate the token
      await admin.messaging(this.app).send(
        {
          token,
          notification: {
            title: 'Test',
            body: 'Test',
          },
        },
        true,
      ); // dry-run = true

      return true;
    } catch (error) {
      LoggingUtil.errorWithException(`Invalid Firebase token: ${token}`, error, 'FirebaseService');
      return false;
    }
  }

  /**
   * Build Firebase message payload for single device
   */
  private buildFirebaseMessage(message: FirebaseMessage): admin.messaging.Message {
    const { token, title, body, imageUrl, data, priority, isSilent, actionUrl, platform } = message;

    const payload: admin.messaging.Message = {
      token,
      notification: isSilent
        ? undefined
        : {
            title,
            body,
            imageUrl,
          },
      data: {
        ...data,
        title, // Always include in data for custom handling
        body,
        ...(actionUrl && { action_url: actionUrl }),
        ...(imageUrl && { image_url: imageUrl }),
      },
    };

    // Platform-specific configuration
    if (platform === DevicePlatform.ANDROID) {
      payload.android = {
        priority: this.mapPriorityToAndroid(priority),
        notification: isSilent
          ? undefined
          : {
              title,
              body,
              imageUrl,
              channelId: this.getNotificationChannel(priority),
              sound: isSilent ? undefined : 'default',
            },
        data,
      };
    } else if (platform === DevicePlatform.IOS) {
      payload.apns = {
        payload: {
          aps: {
            alert: isSilent
              ? undefined
              : {
                  title,
                  body,
                },
            sound: isSilent ? undefined : 'default',
            badge: 1,
            'content-available': 1,
            'mutable-content': 1,
          },
        },
        headers: {
          'apns-priority': this.mapPriorityToApns(priority),
        },
      };
    }

    return payload;
  }

  /**
   * Build Firebase multicast message payload
   */
  private buildFirebaseMulticastMessage(
    message: FirebaseMulticastMessage,
  ): admin.messaging.MulticastMessage {
    const { tokens, title, body, imageUrl, data, priority, isSilent, actionUrl } = message;

    return {
      tokens,
      notification: isSilent
        ? undefined
        : {
            title,
            body,
            imageUrl,
          },
      data: {
        ...data,
        title,
        body,
        ...(actionUrl && { action_url: actionUrl }),
        ...(imageUrl && { image_url: imageUrl }),
      },
      android: {
        priority: this.mapPriorityToAndroid(priority),
        notification: isSilent
          ? undefined
          : {
              title,
              body,
              imageUrl,
              channelId: this.getNotificationChannel(priority),
              sound: isSilent ? undefined : 'default',
            },
      },
      apns: {
        payload: {
          aps: {
            alert: isSilent
              ? undefined
              : {
                  title,
                  body,
                },
            sound: isSilent ? undefined : 'default',
            badge: 1,
            'content-available': 1,
          },
        },
        headers: {
          'apns-priority': this.mapPriorityToApns(priority),
        },
      },
    };
  }

  /**
   * Map internal priority to Android priority
   */
  private mapPriorityToAndroid(priority?: NotificationPriority): 'high' | 'normal' {
    switch (priority) {
      case NotificationPriority.URGENT:
      case NotificationPriority.HIGH:
        return 'high';
      default:
        return 'normal';
    }
  }

  /**
   * Map internal priority to APNS priority
   */
  private mapPriorityToApns(priority?: NotificationPriority): '10' | '5' {
    switch (priority) {
      case NotificationPriority.URGENT:
      case NotificationPriority.HIGH:
        return '10';
      default:
        return '5';
    }
  }

  /**
   * Get Android notification channel based on priority
   */
  private getNotificationChannel(priority?: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'urgent_notifications';
      case NotificationPriority.HIGH:
        return 'high_priority_notifications';
      case NotificationPriority.LOW:
        return 'low_priority_notifications';
      default:
        return 'default_notifications';
    }
  }

  /**
   * Check if Firebase is properly initialized
   */
  isInitialized(): boolean {
    return this.app !== null;
  }
}
