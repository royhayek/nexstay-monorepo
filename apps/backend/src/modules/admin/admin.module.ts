import { Module } from '@nestjs/common';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { AnalyticsModule } from '../analytics/analytics.module';

// Controllers
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminManagementController } from './controllers/admin-management.controller';

// Services
import { AdminCoreService } from './services/admin-core.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminSystemService } from './services/admin-system.service';
import { AdminFacadeService } from './services/admin-facade.service';
import { AdminActivityService } from './services/admin-activity.service';

/**
 * Admin Module
 * Enhanced with comprehensive admin functionality following architectural guidelines:
 *
 * Controllers:
 * - AdminController: Legacy dashboard controller (maintained for backward compatibility)
 * - AdminDashboardController: Dashboard overview, system health, and key metrics
 * - AdminManagementController: Administrative operations, bulk actions, and audit trails
 *
 * Services:
 * - AdminFacadeService: Coordination layer following Facade pattern
 * - AdminCoreService: Basic admin operations and bulk administrative actions
 * - AdminDashboardService: Dashboard data aggregation and statistics
 * - AdminSystemService: System health monitoring and maintenance operations
 * - AdminActivityService: Activity logging, audit trails, and notification management
 *
 * Features:
 * - Standardized validators with custom examples (@IsSearchField, @IsDateField, @IsEnumField)
 * - Response DTOs using BaseResponseDto factory pattern for consistent API responses
 * - Comprehensive error handling with proper exception types and logging
 * - Role-based authorization and access controls with admin-specific decorators
 * - Activity logging and audit trail functionality for compliance
 * - Bulk administrative operations with detailed result tracking and rollback capabilities
 * - System health monitoring with external service status checks and performance metrics
 * - Maintenance task automation with scheduling and notification integration
 * - Advanced filtering and pagination with concrete paginated DTOs for OpenAPI compatibility
 */
@Module({
  imports: [SharedSchemasModule, AnalyticsModule],
  controllers: [
    AdminController, // Legacy controller - maintained for backward compatibility
    AdminDashboardController, // New dashboard controller with enhanced functionality
    AdminManagementController, // New management controller for admin operations
  ],
  providers: [
    AdminCoreService,
    AdminDashboardService,
    AdminSystemService,
    AdminFacadeService,
    AdminActivityService, // New activity service for logging and audit trails
  ],
  exports: [
    AdminFacadeService,
    AdminActivityService, // Export for use in other modules for activity logging
  ],
})
export class AdminModule {}
