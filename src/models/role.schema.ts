import { Schema, model, Types, HydratedDocument } from "mongoose";  
import { ActionType } from "./permission.schema";  


export type RoleLevel =
  | "executive"
  | "senior-management"
  | "middle-management"
  | "team-lead"
  | "staff"
  | "entry-level";

// New interface for flexible permission-action mapping
export interface RolePermission {
  permissionId: Types.ObjectId;
  allowedActions: ActionType[]; // Only specific actions allowed for this role
}

export interface Role {
  roleId: string;
  roleName: string;
  description: string;
  level: RoleLevel;
  permissions: RolePermission[]; // Changed from ObjectId[] to RolePermission[]
  isActive: boolean;
  isSystemRole: boolean;
}

export type RoleDocument = HydratedDocument<Role>;

const RolePermissionSchema = new Schema<RolePermission>({
  permissionId: {
    type: Schema.Types.ObjectId,
    ref: "Permission",
    required: true,
  },
  allowedActions: {
    type: [String],
    enum: ["create", "read", "update", "delete", "approve", "reject", "export"],
    required: true,
    validate: {
      validator: (v: string[]) => v.length > 0,
      message: "At least one action must be allowed",
    },
  },
}, { _id: false });

const RoleSchema = new Schema<Role>(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: [
        "executive",
        "senior-management",
        "middle-management",
        "team-lead",
        "staff",
        "entry-level",
      ],
      required: true,
      index: true,
    },
    permissions: [RolePermissionSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RoleSchema.index({ roleName: "text", description: "text" });
RoleSchema.index({ level: 1, isActive: 1 });
RoleSchema.index({ "permissions.permissionId": 1 });

export const RoleModel = model<Role>("Role", RoleSchema);