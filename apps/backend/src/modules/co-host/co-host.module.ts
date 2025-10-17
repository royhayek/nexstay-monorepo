import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoHost, CoHostSchema } from '../../database/schemas/co-host.schema';
import { Property, PropertySchema } from '../../database/schemas/property.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';
import { CoHostService } from './services/co-host.service';
import { CoHostAppController } from './controllers/co-host-app.controller';
import { CoHostAdminController } from './controllers/co-host-admin.controller';

/**
 * Co-Host Module
 * Manages co-host invitations, permissions, and access control
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoHost.name, schema: CoHostSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CoHostAppController, CoHostAdminController],
  providers: [CoHostService],
  exports: [CoHostService],
})
export class CoHostModule {}
