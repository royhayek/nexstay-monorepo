import { Injectable } from '@nestjs/common';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  subject?: string; // For email templates
  content: string;
  variables: string[]; // List of variables that can be substituted
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface TemplateRenderData {
  [key: string]: string | number | boolean | Date;
}

/**
 * Notification Templates Service
 * Manages notification templates for emails, SMS, push notifications, and webhooks
 * Provides template rendering with variable substitution
 */
@Injectable()
export class NotificationTemplatesService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new notification template
   */
  createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateTemplateId();
    const now = new Date();

    const newTemplate: NotificationTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, newTemplate);
    LoggingUtil.log(
      `Created notification template: ${template.name} (${id})`,
      'NotificationTemplatesService',
    );

    return id;
  }

  /**
   * Update an existing template
   */
  updateTemplate(
    templateId: string,
    updates: Partial<Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
  ): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      LoggingUtil.log(`Template not found: ${templateId}`, 'NotificationTemplatesService');
      return false;
    }

    const updatedTemplate: NotificationTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updatedTemplate);
    LoggingUtil.log(`Updated notification template: ${templateId}`, 'NotificationTemplatesService');

    return true;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get template by name
   */
  getTemplateByName(name: string): NotificationTemplate | undefined {
    for (const template of this.templates.values()) {
      if (template.name === name && template.isActive) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * Get all templates by type
   */
  getTemplatesByType(type: NotificationTemplate['type']): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(
      (template) => template.type === type && template.isActive,
    );
  }

  /**
   * Get all active templates
   */
  getAllActiveTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter((template) => template.isActive);
  }

  /**
   * Render template with provided data
   */
  renderTemplate(
    templateId: string,
    data: TemplateRenderData,
  ): { subject?: string; content: string } | null {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) {
      LoggingUtil.log(
        `Template not found or inactive: ${templateId}`,
        'NotificationTemplatesService',
      );
      return null;
    }

    try {
      const renderedContent = this.substituteVariables(template.content, data);
      const renderedSubject = template.subject
        ? this.substituteVariables(template.subject, data)
        : undefined;

      return {
        subject: renderedSubject,
        content: renderedContent,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error rendering template ${templateId}:`,
        error,
        'NotificationTemplatesService',
      );
      return null;
    }
  }

  /**
   * Render template by name with provided data
   */
  renderTemplateByName(
    templateName: string,
    data: TemplateRenderData,
  ): { subject?: string; content: string } | null {
    const template = this.getTemplateByName(templateName);
    if (!template) {
      LoggingUtil.log(`Template not found: ${templateName}`, 'NotificationTemplatesService');
      return null;
    }

    return this.renderTemplate(template.id, data);
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      LoggingUtil.log(
        `Deleted notification template: ${templateId}`,
        'NotificationTemplatesService',
      );
    }
    return deleted;
  }

  /**
   * Activate/deactivate template
   */
  setTemplateActive(templateId: string, isActive: boolean): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    template.isActive = isActive;
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    LoggingUtil.log(
      `Template ${templateId} ${isActive ? 'activated' : 'deactivated'}`,
      'NotificationTemplatesService',
    );
    return true;
  }

  /**
   * Validate template variables
   */
  validateTemplate(template: Pick<NotificationTemplate, 'content' | 'subject' | 'variables'>): {
    isValid: boolean;
    missingVariables: string[];
    unusedVariables: string[];
  } {
    const declaredVariables = new Set(template.variables);
    const usedVariables = new Set<string>();

    // Extract variables from content and subject
    const content = template.content + (template.subject || '');
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g) || [];

    variableMatches.forEach((match: string) => {
      const variable = match.replace(/[{}]/g, '').trim();
      if (variable) {
        usedVariables.add(variable);
      }
    });

    const missingVariables = Array.from(usedVariables).filter(
      (variable) => !declaredVariables.has(variable),
    );
    const unusedVariables = Array.from(declaredVariables).filter(
      (variable) => !usedVariables.has(variable),
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      unusedVariables,
    };
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): {
    total: number;
    active: number;
    byType: Record<string, number>;
  } {
    const templates = Array.from(this.templates.values());
    const activeTemplates = templates.filter((t) => t.isActive);

    const byType = templates.reduce(
      (acc, template) => {
        acc[template.type] = (acc[template.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: templates.length,
      active: activeTemplates.length,
      byType,
    };
  }

  /**
   * Private helper methods
   */
  private substituteVariables(template: string, data: TemplateRenderData): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match: string, variable: string) => {
      const trimmedVariable = variable.trim();
      const value = data[trimmedVariable] as string | number | Date | undefined;

      if (value === undefined || value === null) {
        LoggingUtil.log(
          `Variable "${trimmedVariable}" not found in template data`,
          'NotificationTemplatesService',
        );
        return match; // Return original placeholder if variable not found
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      return String(value);
    });
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Initialize default templates for common use cases
   */
  private initializeDefaultTemplates(): void {
    // Booking confirmation email template
    this.createTemplate({
      name: 'booking-confirmation-email',
      type: 'email',
      subject: 'Booking Confirmation - {{propertyName}}',
      content: `
        Dear {{guestName}},

        Your booking has been confirmed!

        Booking Details:
        - Property: {{propertyName}}
        - Check-in: {{checkInDate}}
        - Check-out: {{checkOutDate}}
        - Guests: {{guestCount}}
        - Total Amount: {{totalAmount}}
        - Confirmation Code: {{confirmationCode}}

        Thank you for choosing our platform!

        Best regards,
        The Team
      `,
      variables: [
        'guestName',
        'propertyName',
        'checkInDate',
        'checkOutDate',
        'guestCount',
        'totalAmount',
        'confirmationCode',
      ],
      isActive: true,
    });

    // Booking confirmation SMS template
    this.createTemplate({
      name: 'booking-confirmation-sms',
      type: 'sms',
      content:
        'Hi {{guestName}}! Your booking for {{propertyName}} is confirmed. Check-in: {{checkInDate}}. Confirmation: {{confirmationCode}}',
      variables: ['guestName', 'propertyName', 'checkInDate', 'confirmationCode'],
      isActive: true,
    });

    // Host notification email template
    this.createTemplate({
      name: 'host-booking-notification-email',
      type: 'email',
      subject: 'New Booking Received - {{propertyName}}',
      content: `
        Dear {{hostName}},

        You have received a new booking for your property!

        Booking Details:
        - Property: {{propertyName}}
        - Guest: {{guestName}}
        - Check-in: {{checkInDate}}
        - Check-out: {{checkOutDate}}
        - Guests: {{guestCount}}
        - Total Earnings: {{hostEarnings}}

        Please log in to your dashboard to review the booking.

        Best regards,
        The Team
      `,
      variables: [
        'hostName',
        'propertyName',
        'guestName',
        'checkInDate',
        'checkOutDate',
        'guestCount',
        'hostEarnings',
      ],
      isActive: true,
    });

    // Booking cancellation email template
    this.createTemplate({
      name: 'booking-cancellation-email',
      type: 'email',
      subject: 'Booking Cancelled - {{propertyName}}',
      content: `
        Dear {{userName}},

        Your booking has been cancelled.

        Booking Details:
        - Property: {{propertyName}}
        - Check-in: {{checkInDate}}
        - Check-out: {{checkOutDate}}
        - Confirmation Code: {{confirmationCode}}
        - Cancellation Reason: {{cancellationReason}}

        {{refundInfo}}

        We apologize for any inconvenience.

        Best regards,
        The Team
      `,
      variables: [
        'userName',
        'propertyName',
        'checkInDate',
        'checkOutDate',
        'confirmationCode',
        'cancellationReason',
        'refundInfo',
      ],
      isActive: true,
    });

    // Push notification templates
    this.createTemplate({
      name: 'booking-reminder-push',
      type: 'push',
      content: 'Your check-in at {{propertyName}} is tomorrow at {{checkInTime}}!',
      variables: ['propertyName', 'checkInTime'],
      isActive: true,
    });

    // Welcome email template
    this.createTemplate({
      name: 'welcome-email',
      type: 'email',
      subject: 'Welcome to Our Platform!',
      content: `
        Dear {{userName}},

        Welcome to our platform! We're excited to have you join our community.

        Your account has been successfully created with the email: {{userEmail}}

        Get started by:
        - Completing your profile
        - Exploring amazing properties
        - Booking your first stay

        If you have any questions, feel free to reach out to our support team.

        Happy travels!
        The Team
      `,
      variables: ['userName', 'userEmail'],
      isActive: true,
    });

    LoggingUtil.log('Initialized default notification templates', 'NotificationTemplatesService');
  }
}
