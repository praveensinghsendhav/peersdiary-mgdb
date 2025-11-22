import { z } from "zod"; 
// ========== STAFF PROFILE VALIDATION SCHEMAS ==========
const professionalInfoSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  designation: z.string().min(1, "Designation is required"),
  totalExperience: z.number().min(0, "Experience cannot be negative"),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead", "principal"]),
  previousCompanyExperience: z.number().min(0).optional(),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

const socialLinksSchema = z
  .object({
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  })
  .optional();

const staffCustomPermissionSchema = z.object({
  permissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid permission ID"),
  allowedActions: z.array(
    z.enum(["create", "read", "update", "delete", "approve", "reject", "export"])
  ),
  isRevoked: z.boolean().optional(),
});

export const createProfileSchema = z.object({
  staffId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID"),
  profileUrl: z.string().url().optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  professionalInfo: professionalInfoSchema,
  socialLinks: socialLinksSchema,
  assignedRoles: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID"))
    .default([]),
  customPermissions: z.array(staffCustomPermissionSchema).optional(),
  isActive: z.boolean().default(true),
});

export const updateProfileSchema = createProfileSchema.partial();

export const assignRolesSchema = z.object({
  roleIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID"))
    .min(1, "At least one role ID is required"),
});

export const addCustomPermissionsSchema = z.object({
  permissions: z
    .array(staffCustomPermissionSchema)
    .min(1, "At least one permission is required"),
});