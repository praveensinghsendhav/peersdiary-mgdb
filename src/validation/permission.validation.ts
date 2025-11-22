import { z } from "zod"; 

// ========== PERMISSION VALIDATION SCHEMAS ==========
export const createPermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  resource: z.enum([
    "staff",
    "employment",
    "payroll",
    "attendance",
    "leave",
    "performance",
    "recruitment",
    "training",
    "documents",
    "reports",
    "settings",
  ]),
  actions: z
    .array(z.enum(["create", "read", "update", "delete", "approve", "reject", "export"]))
    .min(1, "At least one action is required"),
  isActive: z.boolean().default(true),
});

export const updatePermissionSchema = createPermissionSchema.partial();