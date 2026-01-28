# Sigorta CRM - Access Control Rules

## User Roles
- **ADMIN**: Full access to all branches and data.
- **MANAGER**: Read/Write access restricted to their specific `branchId`.
- **EMPLOYEE**: Restricted access. Can create sales but cannot delete. Can only view own data or branch data depending on context.

## Middleware
- Always use `authenticate` middleware for protected routes.
- Verify `req.user.branchId` for non-admins.
