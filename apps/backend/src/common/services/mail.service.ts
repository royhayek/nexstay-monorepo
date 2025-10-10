import * as path from 'path';
import * as config from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import JSONTransport from 'nodemailer/lib/json-transport';
import mailConfig from '../../config/mail.config';
import type { Transporter } from 'nodemailer';
import type { TemplateDelegate } from 'handlebars';
import { DynamicConfigService } from '../../modules/config/config.service';
import { LoggingUtil } from '../utils/logging.util';
import { TemplateUtils } from '../utils/file.utils';

type Primitive = string | number | boolean | null | undefined;
type TemplateContext = Record<string, Primitive>;

/**
 * Email sending result interface
 */
interface EmailSendResult {
  messageId: string;
  preview?: string;
}

@Injectable()
export class MailService {
  private transporter?:
    | Transporter<SMTPPool.SentMessageInfo>
    | Transporter<JSONTransport.SentMessageInfo>;
  private readonly from: string;
  private readonly templatesDir: string;

  // optional behavior (still env-controlled if you want to fail hard when disabled)
  private readonly throwIfDisabled: boolean;

  // small cache to avoid hammering DB on every send
  private enabledCache?: { value: boolean; until: number };

  constructor(
    private readonly env: config.ConfigService,
    private readonly dynamicConfig: DynamicConfigService,
    @Inject(mailConfig.KEY) private readonly mail: config.ConfigType<typeof mailConfig>,
  ) {
    this.templatesDir =
      process.env.NODE_ENV === 'production'
        ? path.resolve(__dirname, '..', 'templates')
        : path.resolve(process.cwd(), 'src', 'common', 'templates');

    this.throwIfDisabled =
      this.env.get('EMAIL_THROW_IF_DISABLED') === true ||
      this.env.get<string>('EMAIL_THROW_IF_DISABLED') === 'true';
  }

  private async isEnabled(): Promise<boolean> {
    const now = Date.now();
    if (this.enabledCache && now < this.enabledCache.until) {
      return this.enabledCache.value;
    }
    const enabled = await this.dynamicConfig.getBoolean('NOTIFY_EMAIL_ENABLED', false);
    this.enabledCache = { value: enabled, until: now + 30_000 }; // cache 30s
    return enabled;
  }

  private createTransporter():
    | Transporter<SMTPPool.SentMessageInfo>
    | Transporter<JSONTransport.SentMessageInfo> {
    if (process.env.NODE_ENV === 'test') {
      LoggingUtil.log('MailService using JSON transport (test).', 'MailService');
      return nodemailer.createTransport({
        jsonTransport: true,
      }) as Transporter<JSONTransport.SentMessageInfo>;
    }

    const smtpOptions: SMTPPool.Options = {
      host: this.mail.host,
      port: this.mail.port,
      secure: this.mail.secure,
      auth:
        this.mail.user && this.mail.pass
          ? { user: this.mail.user, pass: this.mail.pass }
          : undefined,
      tls: { minVersion: 'TLSv1.2', servername: this.mail.host },
      pool: true,
      maxConnections: 3,
      dkim:
        this.mail.dkim.domain && this.mail.dkim.selector && this.mail.dkim.key
          ? {
              domainName: this.mail.dkim.domain,
              keySelector: this.mail.dkim.selector,
              privateKey: this.mail.dkim.key,
            }
          : undefined,
    };

    const transporter = nodemailer.createTransport(
      smtpOptions,
    ) as Transporter<SMTPPool.SentMessageInfo>;

    transporter.on('error', (err: Error) => {
      LoggingUtil.error(`SMTP error: ${err.message}`, err.stack, 'MailService');
    });

    // verify only outside tests
    transporter.verify().then(
      () =>
        LoggingUtil.log(
          `SMTP verified ${this.mail.host}:${this.mail.port} secure=${String(this.mail.secure)}`,
          'MailService',
        ),
      (err) =>
        LoggingUtil.error(
          `SMTP verify failed: ${err instanceof Error ? err.message : String(err)}`,
          undefined,
          'MailService',
        ),
    );

    return transporter;
  }

  /** Ensure transporter exists if email is enabled in DynamicConfig */
  private async ensureTransporter(): Promise<void> {
    if (this.transporter) return;
    const enabled = await this.isEnabled();
    if (!enabled) {
      LoggingUtil.log(
        'MailService disabled by NOTIFY_EMAIL_ENABLED=false (DynamicConfig).',
        'MailService',
      );
      return;
    }
    this.transporter = this.createTransporter();
  }

  /**
   * Send an email using a compiled Handlebars template.
   * In tests, this returns JSON transport info; when disabled, it NO-OPs by default.
   */
  async send<T extends TemplateContext>(
    to: string,
    subject: string,
    template: string,
    context: T,
  ): Promise<EmailSendResult> {
    await this.ensureTransporter();
    if (!this.transporter) {
      const msg = 'MailService is disabled; skipping send()';
      if (this.throwIfDisabled) {
        LoggingUtil.error(msg, undefined, 'MailService');
        throw new Error('MailService is disabled');
      }
      LoggingUtil.warn(msg, 'MailService');
      return { messageId: 'disabled', preview: undefined };
    }

    try {
      const html = await this.render(template, context);

      const info = await this.transporter.sendMail({
        from: this.mail.from,
        to,
        subject,
        html,
      });

      const messageId = info.messageId;

      // with JSON transport, a "message" string is available (can be used as preview)
      const preview = info.response;

      LoggingUtil.log(`Email sent to ${to}${messageId ? `: ${messageId}` : ''}`, 'MailService');
      return { messageId: info.messageId, preview };
    } catch (err) {
      LoggingUtil.error(
        `Failed to send email to ${to}`,
        err instanceof Error ? err.stack : undefined,
        'MailService',
      );
      throw err instanceof Error ? err : new Error('Failed to send email');
    }
  }

  onModuleDestroy(): void {
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch {
        // ignore
      }
      this.transporter = undefined;
    }
  }

  onApplicationShutdown(): void {
    this.onModuleDestroy();
  }

  // ---------------- Templates ----------------

  private readonly cache = new Map<string, TemplateDelegate>();

  private async render<T extends TemplateContext>(name: string, ctx: T): Promise<string> {
    const tpl = await this.getTemplate(name);
    return tpl(ctx);
  }

  private async getTemplate(name: string): Promise<TemplateDelegate> {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const filePath = TemplateUtils.getTemplatePath(this.templatesDir, name, '.hbs');
    let source: string;
    try {
      source = await TemplateUtils.readTemplate(filePath);
    } catch {
      LoggingUtil.error(`Template not found: ${filePath}`, undefined, 'MailService');
      throw new Error('Email template not found');
    }

    const compiled = handlebars.compile(source, { noEscape: true });
    this.cache.set(name, compiled);
    return compiled;
  }
}
