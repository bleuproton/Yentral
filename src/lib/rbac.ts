import type { Role } from "@prisma/client";

const rolePriority: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1
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
