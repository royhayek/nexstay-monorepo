import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => {
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const secure = port === 465 || process.env.EMAIL_SECURE === 'true';

  return {
    host: process.env.EMAIL_HOST,
    port,
    secure,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    dkim: {
      domain: process.env.EMAIL_DKIM_DOMAIN,
      selector: process.env.EMAIL_DKIM_SELECTOR,
      key: process.env.EMAIL_DKIM_PRIVATE_KEY,
    },
  };
});
