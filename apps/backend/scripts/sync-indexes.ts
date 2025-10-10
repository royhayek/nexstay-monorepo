import mongoose from 'mongoose';
import {
  VerificationToken,
  VerificationTokenSchema,
} from '../src/database/schemas/verification-token.schema';
import { RefreshToken, RefreshTokenSchema } from '../src/database/schemas/refresh-token.schema';
import { AppConfig, AppConfigSchema } from '../src/database/schemas/app-config.schema';
import { model } from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);

  const VT = model(VerificationToken.name, VerificationTokenSchema);
  const RT = model(RefreshToken.name, RefreshTokenSchema);
  const CFG = model(AppConfig.name, AppConfigSchema);

  // Ensures the declared indexes exist, drops indexes not in the schema
  await Promise.all([VT.syncIndexes(), RT.syncIndexes(), CFG.syncIndexes()]);

  await mongoose.disconnect();
  console.log('Indexes synced');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
