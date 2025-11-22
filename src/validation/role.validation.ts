import { z } from "zod"; 

// ========== ROLE VALIDATION SCHEMAS ==========
const rolePermissionSchema = z.object({
  permissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid permission ID"),
  allowedActions: z
    .array(z.enum(["create", "read", "update", "delete", "approve", "reject", "export"]))
    .min(1, "At least one action is required"),
});

export const createRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  roleName: z.string().min(1, "Role name is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum([
    "executive",
    "senior-management",
    "middle-management",
    "team-lead",
    "staff",
    "entry-level",
  ]),
  permissions: z.array(rolePermissionSchema).default([]),
  isActive: z.boolean().default(true),
  isSystemRole: z.boolean().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

export const addPermissionsToRoleSchema = z.object({
  permissions: z
    .array(rolePermissionSchema)
    .min(1, "At least one permission is required"),
});

export const removePermissionsFromRoleSchema = z.object({
  permissionIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid permission ID"))
    .min(1, "At least one permission ID is required"),
});