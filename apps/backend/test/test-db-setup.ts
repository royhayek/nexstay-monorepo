import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnect } from 'mongoose';

let mongod: MongoMemoryServer;

export const setupTestDatabase = async (): Promise<string> => {
  mongod = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0',
    },
  });

  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;

  return uri;
};

export const teardownTestDatabase = async (): Promise<void> => {
  if (mongod) {
    await disconnect();
    await mongod.stop();
  }
};
