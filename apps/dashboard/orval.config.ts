import { defineConfig } from 'orval';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  mojo: {
    input: {
      target: 'http://localhost:3000/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/queries',
      schemas: './src/api/models',
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
