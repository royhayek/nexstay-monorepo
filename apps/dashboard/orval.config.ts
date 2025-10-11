import { defineConfig } from 'orval';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // Public API - No authentication required
  public: {
    input: {
      target: 'http://localhost:3000/public/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/queries/public',
      schemas: './src/api/models/public',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
        },
      },
    },
  },
  // Admin API - Dashboard endpoints
  admin: {
    input: {
      target: 'http://localhost:3000/admin/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/queries/admin',
      schemas: './src/api/models/admin',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './src/lib/axios.ts',
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
