import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Filters Swagger document to only include specified endpoints and their related schemas
 * @param document - The full Swagger document
 * @param pathFilter - Function to filter paths
 * @returns Filtered Swagger document
 */
export function filterSwaggerDocument(
  document: OpenAPIObject,
  pathFilter: (path: string) => boolean,
): OpenAPIObject {
  // Filter paths
  const filteredPaths = Object.keys(document.paths || {})
    .filter(pathFilter)
    .reduce(
      (obj: Record<string, any>, key: string) => {
        if (document.paths?.[key]) {
          obj[key] = document.paths[key];
        }
        return obj;
      },
      {} as Record<string, any>,
    );

  // Collect all schema references from filtered paths
  const usedSchemas = new Set<string>();

  // Function to extract schema references from an object
  const extractSchemaRefs = (obj: unknown, visited = new Set()): void => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) {
      return;
    }
    visited.add(obj);

    if (obj && typeof obj === 'object' && '$ref' in obj) {
      const ref = (obj as { $ref?: string }).$ref;
      if (typeof ref === 'string') {
        const match = ref.match(/#\/components\/schemas\/(.+)/);
        if (match && match[1]) {
          usedSchemas.add(match[1]);
        }
      }
    }

    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          extractSchemaRefs((obj as Record<string, unknown>)[key], visited);
        }
      }
    }
  };

  // Extract schema references from filtered paths
  extractSchemaRefs(filteredPaths);

  // Recursively collect dependent schemas
  const collectDependentSchemas = (schemaName: string, collected = new Set<string>()): void => {
    if (collected.has(schemaName)) {
      return;
    }
    collected.add(schemaName);

    const schema = document.components?.schemas?.[schemaName];
    if (schema) {
      // Extract refs from this schema
      const tempSet = new Set<string>();
      const extractRefs = (obj: unknown, visited = new Set()): void => {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) {
          return;
        }
        visited.add(obj);

        if (obj && typeof obj === 'object' && '$ref' in obj) {
          const ref = (obj as { $ref?: string }).$ref;
          if (typeof ref === 'string') {
            const match = ref.match(/#\/components\/schemas\/(.+)/);
            if (match && match[1]) {
              tempSet.add(match[1]);
            }
          }
        }

        if (obj && typeof obj === 'object') {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              extractRefs((obj as Record<string, unknown>)[key], visited);
            }
          }
        }
      };

      extractRefs(schema);

      // Recursively collect dependent schemas
      tempSet.forEach((dep) => {
        collectDependentSchemas(dep, collected);
      });
    }
  };

  // Collect all schemas including dependencies
  const allUsedSchemas = new Set<string>();
  usedSchemas.forEach((schema) => {
    collectDependentSchemas(schema, allUsedSchemas);
  });

  // Filter schemas to only include used ones
  const filteredSchemas = Array.from(allUsedSchemas).reduce(
    (obj: Record<string, any>, schemaName: string) => {
      const schema = document.components?.schemas?.[schemaName];
      if (schema) {
        obj[schemaName] = schema;
      }
      return obj;
    },
    {} as Record<string, any>,
  );

  // Create filtered document
  return {
    ...document,
    paths: filteredPaths,
    components: {
      ...document.components,
      schemas: filteredSchemas,
    },
  };
}
