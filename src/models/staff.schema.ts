import { Schema, model,Types, HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export type EmploymentType = "full-time" | "part-time" | "contract" | "intern";
export type EmploymentStatus = "active" | "terminated" | "resigned" | "on-hold";
export type WorkLocationType = "onsite" | "remote" | "hybrid";
export type ReportingRole =
  | "teamLead"
  | "manager"
  | "supervisor"
  | "departmentHead"
  | "projectManager"
  | "other";

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface WorkLocationInfo {
  type: WorkLocationType;
  officeAddress?: string;
}

export interface ReportingManager {
  managerId: Types.ObjectId;
  role: ReportingRole;
}

export interface EmploymentInfo {
  employmentType: EmploymentType;
  jobTitle: string;
  department: string;
  reportingManagers: ReportingManager[];
  joiningDate: Date;
  contractEndDate?: Date;
  employmentStatus: EmploymentStatus;
  workLocation: WorkLocationInfo;
}

export interface Staff {
  staffId: string;
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  email: string;
  phone: string;
  emergencyContact: EmergencyContact;
  address: Address;
  // Employment Information
  employment: EmploymentInfo;
}

export type StaffDocument = HydratedDocument<Staff>;

// Sub-schemas
const EmergencyContactSchema = new Schema<EmergencyContact>({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false });

const AddressSchema = new Schema<Address>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const WorkLocationSchema = new Schema<WorkLocationInfo>({
  type: {
    type: String,
    enum: ["onsite", "remote", "hybrid"],
    required: true,
  },
  officeAddress: {
    type: String,
    required: function (this: WorkLocationInfo) {
      return this.type === "onsite" || this.type === "hybrid";
    },
  },
}, { _id: false });

const ReportingManagerSchema = new Schema<ReportingManager>({
  managerId: {
    type: Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
  role: {
    type: String,
    enum: ["teamLead", "manager", "supervisor", "departmentHead", "projectManager", "other"],
    required: true,
  },
}, { _id: false });

const EmploymentInfoSchema = new Schema<EmploymentInfo>({
  employmentType: {
    type: String,
    enum: ["full-time", "part-time", "contract", "intern"],
    required: true,
  },
  jobTitle: { type: String, required: true },
  department: { type: String, required: true },
  reportingManagers: [ReportingManagerSchema],
  joiningDate: { type: Date, required: true },
  contractEndDate: { type: Date },
  employmentStatus: {
    type: String,
    enum: ["active", "terminated", "resigned", "on-hold"],
    required: true,
  },
  workLocation: {
    type: WorkLocationSchema,
    required: true,
  },
}, { _id: false });

// Main Staff Schema
const StaffSchema = new Schema<Staff>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true },
    emergencyContact: { type: EmergencyContactSchema, required: true },
    address: { type: AddressSchema, required: true },
    employment: { type: EmploymentInfoSchema, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
StaffSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

StaffSchema.virtual("addressSummary").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.country}`;
});

// Indexes
StaffSchema.index({ lastName: 1, firstName: 1 });
StaffSchema.index({ phone: 1 });
StaffSchema.index({ "employment.department": 1, "employment.employmentStatus": 1 });
StaffSchema.index({ "employment.jobTitle": 1 });
StaffSchema.index({ "employment.employmentType": 1 });
StaffSchema.index({ "employment.joiningDate": 1 });
StaffSchema.index({ "employment.reportingManagers.managerId": 1 });

export const StaffModel = model<Staff>("Staff", StaffSchema);