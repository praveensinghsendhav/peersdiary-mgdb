import { Schema, model, Types, HydratedDocument } from "mongoose";
import { ActionType } from "./permission.schema"; 

// ========== STAFF PROFILE SCHEMA (Professional & Access Control) ==========
export type ExperienceLevel =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal";

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
}

export interface ProfessionalInfo {
  employeeId: string;
  designation: string;
  totalExperience: number;
  experienceLevel: ExperienceLevel;
  previousCompanyExperience?: number;
  skills: string[];
  certifications?: string[];
  languages?: string[];
}

// Custom permission override for individual staff
export interface StaffCustomPermission {
  permissionId: Types.ObjectId;
  allowedActions: ActionType[];
  isRevoked?: boolean; // true if this permission/action is explicitly revoked
}

export interface StaffProfile {
  staffId: Types.ObjectId;
  profileUrl?: string;
  bio?: string;
  professionalInfo: ProfessionalInfo;
  socialLinks?: SocialLinks;
  // Access Control
  assignedRoles: Types.ObjectId[];
  customPermissions?: StaffCustomPermission[]; // Override role permissions
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  accountLockedUntil?: Date;
}

export type StaffProfileDocument = HydratedDocument<StaffProfile>;

const SocialLinksSchema = new Schema<SocialLinks>({
  linkedin: { type: String, trim: true },
  github: { type: String, trim: true },
  twitter: { type: String, trim: true },
  portfolio: { type: String, trim: true },
}, { _id: false });

const ProfessionalInfoSchema = new Schema<ProfessionalInfo>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  designation: {
    type: String,
    required: true,
    trim: true,
  },
  totalExperience: {
    type: Number,
    required: true,
    min: 0,
  },
  experienceLevel: {
    type: String,
    enum: ["entry", "junior", "mid", "senior", "lead", "principal"],
    required: true,
  },
  previousCompanyExperience: {
    type: Number,
    min: 0,
  },
  skills: [String],
  certifications: [String],
  languages: [String],
}, { _id: false });

const StaffCustomPermissionSchema = new Schema<StaffCustomPermission>({
  permissionId: {
    type: Schema.Types.ObjectId,
    ref: "Permission",
    required: true,
  },
  allowedActions: {
    type: [String],
    enum: ["create", "read", "update", "delete", "approve", "reject", "export"],
    required: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const StaffProfileSchema = new Schema<StaffProfile>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      unique: true, 
      index: true,
    },
    profileUrl: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    professionalInfo: {
      type: ProfessionalInfoSchema,
      required: true,
    },
    socialLinks: SocialLinksSchema,
    assignedRoles: [{
      type: Schema.Types.ObjectId,
      ref: "Role",
    }],
    customPermissions: [StaffCustomPermissionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: Date,
  },
  { timestamps: true }
);

// Indexes
StaffProfileSchema.index({ "professionalInfo.designation": 1, isActive: 1 });
StaffProfileSchema.index({ "professionalInfo.experienceLevel": 1 });
StaffProfileSchema.index({ "professionalInfo.skills": 1 });
StaffProfileSchema.index({ assignedRoles: 1 });
StaffProfileSchema.index({ isActive: 1, lastLogin: -1 });

// Virtual for years with company
StaffProfileSchema.virtual("staff", {
  ref: "Staff",
  localField: "staffId",
  foreignField: "_id",
  justOne: true,
});

export const StaffProfileModel = model<StaffProfile>(
  "StaffProfile",
  StaffProfileSchema
);