# Role-Based Access Control (RBAC) Usage Guide

This document provides comprehensive examples of using RBAC features in the dashboard application.

## Available Roles

```typescript
- guest         // Regular users browsing/booking properties
- host          // Users who list properties
- admin         // Platform administrators
- system_admin  // Super administrators with SUPERUSER ACCESS (bypasses all role checks)
- moderator     // Content moderators
- support       // Customer support team
- compliance    // Compliance officers
```

## ⚡ IMPORTANT: System Admin Superuser Privileges

**`system_admin` has unrestricted access to ALL features and routes**, regardless of specified role requirements:

- ✅ Automatically passes ALL `hasRole()` checks
- ✅ Automatically passes ALL `hasAllRoles()` checks
- ✅ Sees ALL navigation items (even those not explicitly listing 'system_admin')
- ✅ Can access ALL protected routes and components
- ✅ Bypasses ALL role-based restrictions in the UI

This is implemented at the core level in the `useAuth` hook and backend `RolesGuard`, ensuring consistent superuser behavior throughout the application.

## 1. Using the `useAuth` Hook

The enhanced `useAuth` hook provides convenient role-checking methods:

```tsx
'use client';

import { useAuth } from 'src/auth/hooks/use-auth';

export function MyComponent() {
  const {
    user,
    hasRole,
    hasAllRoles,
    isAdmin,
    isSystemAdmin,
    isHost,
    isGuest,
    isModerator,
    isSupport,
    isCompliance,
    canAccessAdmin,
    primaryRole,
    roles,
  } = useAuth();

  // Check for a single role
  if (hasRole('admin')) {
    // User is an admin
  }

  // Check for multiple roles (user has ANY of these)
  if (hasRole(['admin', 'moderator'])) {
    // User is either admin or moderator
  }

  // Check if user has ALL specified roles
  if (hasAllRoles(['admin', 'compliance'])) {
    // User has both admin and compliance roles
  }

  // Use convenience flags
  if (isAdmin) {
    // User is admin or system_admin
  }

  if (canAccessAdmin) {
    // User can access admin features (admin, system_admin, moderator, or compliance)
  }

  return <div>User role: {primaryRole}</div>;
}
```

## 2. Using `RoleGuard` Component

`RoleGuard` conditionally renders content based on user roles:

### Basic Usage

```tsx
import { RoleGuard } from 'src/auth/guard/role-guard';

// Show content only to admins
<RoleGuard roles="admin">
  <AdminPanel />
</RoleGuard>

// Show content to multiple roles
<RoleGuard roles={['admin', 'moderator']}>
  <ModeratorTools />
</RoleGuard>
```

### With Fallback Content

```tsx
// Show different content for users without permission
<RoleGuard
  roles="admin"
  fallback={
    <Alert severity="warning">
      You need admin privileges to access this feature.
    </Alert>
  }
>
  <AdminOnlyFeature />
</RoleGuard>
```

### Require All Roles

```tsx
// User must have ALL specified roles
<RoleGuard roles={['admin', 'compliance']} requireAll>
  <SensitiveComplianceData />
</RoleGuard>
```

## 3. Using `RequireRole` Component

`RequireRole` is a stricter variant that only renders children (never shows fallback):

```tsx
import { RequireRole } from 'src/auth/guard/role-guard';

// Hide delete button for non-admins
<RequireRole roles="admin">
  <Button color="error" onClick={handleDelete}>
    Delete User
  </Button>
</RequireRole>

// Show export button only to admin or compliance
<RequireRole roles={['admin', 'compliance']}>
  <Button startIcon={<Iconify icon="mdi:download" />}>
    Export Data
  </Button>
</RequireRole>
```

## 4. Using `HideForRole` Component

`HideForRole` is the inverse - it hides content FROM specified roles:

```tsx
import { HideForRole } from 'src/auth/guard/role-guard';

// Hide from guests
<HideForRole roles="guest">
  <HostDashboardLink />
</HideForRole>

// Hide from multiple roles
<HideForRole roles={['guest', 'support']}>
  <AdvancedAdminTools />
</HideForRole>
```

## 5. Page-Level Guards

Use the existing `RoleBasedGuard` for entire pages:

```tsx
'use client';

import { useAuth } from 'src/auth/hooks/use-auth';
import { RoleBasedGuard } from 'src/auth/guard/role-based-guard';

export default function AdminPage() {
  const { primaryRole } = useAuth();

  return (
    <RoleBasedGuard
      hasContent
      currentRole={primaryRole || ''}
      allowedRoles={['admin', 'system_admin']}
    >
      <AdminPageContent />
    </RoleBasedGuard>
  );
}
```

## 6. Conditional Rendering in Tables

```tsx
import { RequireRole } from 'src/auth/guard/role-guard';

const columns = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  {
    field: 'actions',
    headerName: 'Actions',
    renderCell: (params) => (
      <>
        <IconButton onClick={() => handleView(params.row)}>
          <Iconify icon="mdi:eye" />
        </IconButton>

        <RequireRole roles={['admin', 'moderator']}>
          <IconButton onClick={() => handleEdit(params.row)}>
            <Iconify icon="mdi:pencil" />
          </IconButton>
        </RequireRole>

        <RequireRole roles="system_admin">
          <IconButton color="error" onClick={() => handleDelete(params.row)}>
            <Iconify icon="mdi:delete" />
          </IconButton>
        </RequireRole>
      </>
    ),
  },
];
```

## 7. Menu Items with Role Checks

```tsx
import { RoleGuard } from 'src/auth/guard/role-guard';

function UserMenu() {
  return (
    <Menu>
      <MenuItem onClick={handleProfile}>Profile</MenuItem>
      <MenuItem onClick={handleSettings}>Settings</MenuItem>

      <RoleGuard roles="host">
        <MenuItem onClick={handleMyProperties}>My Properties</MenuItem>
      </RoleGuard>

      <RoleGuard roles={['admin', 'system_admin']}>
        <Divider />
        <MenuItem onClick={handleAdminPanel}>Admin Panel</MenuItem>
      </RoleGuard>

      <RoleGuard roles="system_admin">
        <MenuItem onClick={handleSystemSettings}>System Settings</MenuItem>
      </RoleGuard>
    </Menu>
  );
}
```

## 8. Form Fields with Role-Based Visibility

```tsx
import { RoleGuard } from 'src/auth/guard/role-guard';

function UserForm() {
  return (
    <Form>
      <TextField name="firstName" label="First Name" />
      <TextField name="lastName" label="Last Name" />
      <TextField name="email" label="Email" />

      <RoleGuard roles={['admin', 'moderator']}>
        <Select name="status" label="Account Status">
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="banned">Banned</MenuItem>
        </Select>
      </RoleGuard>

      <RoleGuard roles="system_admin">
        <FormControlLabel
          control={<Checkbox name="isSuperAdmin" />}
          label="Grant System Admin Privileges"
        />
      </RoleGuard>
    </Form>
  );
}
```

## 9. Dashboard Widgets

```tsx
import { RoleGuard } from 'src/auth/guard/role-guard';

function Dashboard() {
  return (
    <Grid container spacing={3}>
      {/* All users see these */}
      <Grid item xs={12} md={6}>
        <RecentBookingsWidget />
      </Grid>

      {/* Only hosts see this */}
      <RoleGuard roles="host">
        <Grid item xs={12} md={6}>
          <PropertyPerformanceWidget />
        </Grid>
      </RoleGuard>

      {/* Only admins/moderators see this */}
      <RoleGuard roles={['admin', 'moderator']}>
        <Grid item xs={12}>
          <PendingApprovalsWidget />
        </Grid>
      </RoleGuard>

      {/* Only system admins see this */}
      <RoleGuard roles="system_admin">
        <Grid item xs={12}>
          <SystemHealthWidget />
        </Grid>
      </RoleGuard>
    </Grid>
  );
}
```

## 10. Navigation Config (Already Implemented)

Navigation items automatically filter based on `allowedRoles`:

```tsx
// src/layouts/nav-config-dashboard.tsx
export const navData = [
  {
    subheader: 'Management',
    items: [
      {
        title: 'Users',
        path: paths.dashboard.user.list,
        icon: ICONS.user,
        allowedRoles: ['admin', 'system_admin', 'moderator'], // Only these roles see this
      },
      {
        title: 'Settings',
        path: paths.dashboard.settings.configuration,
        icon: ICONS.params,
        allowedRoles: ['admin', 'system_admin'], // Admin-only
      },
    ],
  },
];
```

## 11. System Admin Superuser Example

```tsx
import { useAuth } from 'src/auth/hooks/use-auth';
import { RequireRole } from 'src/auth/guard/role-guard';

function FeatureDemo() {
  const { hasRole, isSystemAdmin } = useAuth();

  return (
    <div>
      {/* Only moderators can see this... but system_admin can too! */}
      <RequireRole roles="moderator">
        <ModeratorTools />
      </RequireRole>

      {/* Only hosts can see this... but system_admin can too! */}
      <RequireRole roles="host">
        <HostDashboard />
      </RequireRole>

      {/* Multiple roles required... but system_admin bypasses this check! */}
      <RequireRole roles={['admin', 'compliance']} requireAll>
        <SensitiveComplianceData />
      </RequireRole>

      {/* System admin has access to EVERYTHING */}
      {isSystemAdmin && (
        <Alert severity="info">
          You are logged in as System Admin with superuser privileges.
          You have unrestricted access to all features.
        </Alert>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use Specific Components for Specific Purposes:**
   - `RoleGuard` - When you need fallback content
   - `RequireRole` - When hiding UI elements completely
   - `HideForRole` - When inverting logic is clearer

2. **Combine Backend and Frontend Checks:**
   - Always implement role checks on the backend
   - Frontend RBAC is for UX only (hiding irrelevant features)
   - Never rely solely on frontend role checks for security
   - **Backend also implements system_admin superuser access in `RolesGuard`**

3. **Prefer Navigation-Level Hiding:**
   - Use `allowedRoles` in navigation config when possible
   - This provides consistent UX across the app
   - Remember: system_admin will see all items regardless

4. **Use Convenience Flags:**
   - `isAdmin`, `isHost`, etc. are more readable than `hasRole('admin')`
   - Use them in conditional rendering for cleaner code
   - `isSystemAdmin` flag identifies users with superuser privileges

5. **Document Role Requirements:**
   - Add comments explaining why certain roles are required
   - Makes future maintenance easier
   - Note that system_admin bypasses these requirements

6. **System Admin Best Practices:**
   - Use `isSystemAdmin` flag to show superuser indicators in the UI
   - Grant system_admin role sparingly (highest privilege level)
   - Log system_admin actions for audit purposes
   - Consider showing a visual indicator when logged in as system_admin
