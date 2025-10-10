import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: process.env.FIREBASE_CREDENTIALS,
}));
