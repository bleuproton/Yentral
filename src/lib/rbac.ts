import type { Role } from "@prisma/client";

const rolePriority: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  ACCOUNTANT_ADMIN: 3,
  ACCOUNTANT_READONLY: 2,
  MEMBER: 1,
};

export function hasRequiredRole(userRole: Role, required: Role | Role[]) {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((role) => rolePriority[userRole] >= rolePriority[role]);
}

export function assertRole(userRole: Role, required: Role | Role[]) {
  if (!hasRequiredRole(userRole, required)) {
    throw new Error("Insufficient role for this action");
  }
}

type Permission = 'accounting.read' | 'accounting.write' | 'report.export' | 'default.read' | 'default.write';

const permissionMatrix: Record<Role, Permission[]> = {
  OWNER: ['accounting.read', 'accounting.write', 'report.export', 'default.read', 'default.write'],
  ADMIN: ['accounting.read', 'accounting.write', 'report.export', 'default.read', 'default.write'],
  ACCOUNTANT_ADMIN: ['accounting.read', 'accounting.write', 'report.export'],
  ACCOUNTANT_READONLY: ['accounting.read', 'report.export'],
  MEMBER: ['default.read'],
};

export function can(permission: Permission, role?: Role | null): boolean {
  if (!role) return false;
  const perms = permissionMatrix[role] ?? [];
  return perms.includes(permission);
}

export function requirePermission(permission: Permission, role?: Role | null) {
  if (!can(permission, role)) {
    throw new Error('Forbidden');
  }
}
