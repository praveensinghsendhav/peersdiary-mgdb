import { Schema, model, HydratedDocument } from "mongoose";

// ========== PERMISSION SCHEMA (Unchanged) ==========
export type ResourceType =
  | "staff"
  | "employment"
  | "payroll"
  | "attendance"
  | "leave"
  | "performance"
  | "recruitment"
  | "training"
  | "documents"
  | "reports"
  | "settings";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "export";

export interface Permission {
  permissionId: string;
  name: string;
  description: string;
  resource: ResourceType;
  actions: ActionType[];
  isActive: boolean;
}

export type PermissionDocument = HydratedDocument<Permission>;

const PermissionSchema = new Schema<Permission>(
  {
    permissionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true,
    },
    actions: {
      type: [String],
      enum: ["create", "read", "update", "delete", "approve", "reject", "export"],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one action is required",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

PermissionSchema.index({ resource: 1, isActive: 1 });
PermissionSchema.index({ name: "text", description: "text" });

export const PermissionModel = model<Permission>("Permission", PermissionSchema);