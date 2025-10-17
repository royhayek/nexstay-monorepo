import { defineConfig } from 'orval';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // Public API - No authentication required
  public: {
    input: {
      target: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/public/docs-json`,
    },
    output: {
      mode: 'tags-split',
      target: './api/queries/public',
      schemas: './api/models/public',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './api/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
        },
      },
    },
  },
  // Protected API - Authentication required
  api: {
    input: {
      target: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/docs-json`,
    },
    output: {
      mode: 'tags-split',
      target: './api/queries/protected',
      schemas: './api/models/protected',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './api/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
        },
      },
    },
  },
});