import { INestApplication } from '@nestjs/common';
import { UsersFacadeService } from '../../modules/users/services/users-facade.service';
import { UserRole } from '../../database/schemas/user.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

export async function seedAdminUser(appContext: INestApplication) {
  await runSeeder('admin user', async () => {
    const usersService = appContext.get(UsersFacadeService);

    const adminUser = {
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Administrator of the platform',
      birthDate: '1990-01-15',
      locale: 'en-US',
      timezone: 'Asia/Beirut',
      roles: [UserRole.SYSTEM_ADMIN],
    };

    const existingUser = await usersService.findByEmail(adminUser.email);
    if (existingUser) {
      SeederLogger.skipped('admin user');
      return;
    }

    await usersService.create(adminUser);
    SeederLogger.success('admin user');
  });
}
