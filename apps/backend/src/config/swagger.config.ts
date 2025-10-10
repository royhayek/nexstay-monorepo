import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { filterSwaggerDocument } from '../utils/swagger-filter.util';
import { Request, Response } from 'express';

import yaml from 'js-yaml';

/**
 * Configure and setup all Swagger documentation endpoints
 * @param app - The Nest application instance
 */
export function setupSwagger(app: INestApplication): void {
  // App API Documentation (for mobile app and website)
  setupAppSwagger(app);

  // Admin API Documentation
  setupAdminSwagger(app);

  // Public API Documentation
  setupPublicSwagger(app);
}

/**
 * Setup App API Swagger documentation
 * Includes endpoints for authenticated users (guests and hosts)
 */
function setupAppSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Homestay App API')
    .setDescription(
      'API endpoints for mobile app and website (Guest & Host functionality).\n\n' +
        '**Raw OpenAPI:** [/api/docs-json](/api/docs-json) · [/api/docs-yaml](/api/docs-yaml)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Create full document
  const fullDocument = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  // Filter for app endpoints only (including their schemas)
  const document = filterSwaggerDocument(fullDocument, (path) => path.includes('/app/'));

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Homestay App API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Setup JSON endpoint
  app.getHttpAdapter().get('/api/docs-json', (_req: Request, res: Response) => {
    res.json(document);
  });

  // Setup YAML endpoint
  app.getHttpAdapter().get('/api/docs-yaml', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(document));
  });
}

/**
 * Setup Admin API Swagger documentation
 * Includes endpoints for admin dashboard and management
 */
function setupAdminSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Homestay Admin API')
    .setDescription(
      'API endpoints for admin dashboard and management.\n\n' +
        '**Raw OpenAPI:** [/admin/docs-json](/admin/docs-json) · [/admin/docs-yaml](/admin/docs-yaml)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Create full document
  const fullDocument = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  // Filter for admin endpoints only (including their schemas)
  const document = filterSwaggerDocument(fullDocument, (path) => path.includes('/admin/'));

  // Setup Swagger UI
  SwaggerModule.setup('admin/docs', app, document, {
    customSiteTitle: 'Homestay Admin API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Setup JSON endpoint
  app.getHttpAdapter().get('/admin/docs-json', (_req: Request, res: Response) => {
    res.json(document);
  });

  // Setup YAML endpoint
  app.getHttpAdapter().get('/admin/docs-yaml', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(document));
  });
}

/**
 * Setup Public API Swagger documentation
 * Includes endpoints accessible without authentication
 */
function setupPublicSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Homestay Public API')
    .setDescription(
      'Public API endpoints accessible without authentication.\n\n' +
        '**Raw OpenAPI:** [/public/docs-json](/public/docs-json) · [/public/docs-yaml](/public/docs-yaml)',
    )
    .setVersion('1.0')
    .build();

  // Create full document
  const fullDocument = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  // Filter for public endpoints only
  const document = filterSwaggerDocument(fullDocument, (path) => path.includes('/public/'));

  // Setup Swagger UI
  SwaggerModule.setup('public/docs', app, document, {
    customSiteTitle: 'Homestay Public API Docs',
    swaggerOptions: {
      persistAuthorization: false, // No auth needed for public API
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Setup JSON endpoint
  app.getHttpAdapter().get('/public/docs-json', (_req: Request, res: Response) => {
    res.json(document);
  });

  // Setup YAML endpoint
  app.getHttpAdapter().get('/public/docs-yaml', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(document));
  });
}

/**
 * Get Swagger configuration for different API types
 */
export const SwaggerConfigs = {
  app: {
    title: 'Homestay App API',
    description: 'API for mobile app and website',
    version: '1.0',
    path: 'api/docs',
    jsonPath: '/api/docs-json',
    yamlPath: '/api/docs-yaml',
  },
  admin: {
    title: 'Homestay Admin API',
    description: 'API for admin dashboard',
    version: '1.0',
    path: 'admin/docs',
    jsonPath: '/admin/docs-json',
    yamlPath: '/admin/docs-yaml',
  },
  public: {
    title: 'Homestay Public API',
    description: 'Public API endpoints',
    version: '1.0',
    path: 'public/docs',
    jsonPath: '/public/docs-json',
    yamlPath: '/public/docs-yaml',
  },
} as const;
