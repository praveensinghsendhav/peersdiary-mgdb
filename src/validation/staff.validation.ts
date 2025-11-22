import { z } from "zod";

// ========== STAFF VALIDATION SCHEMAS ==========
const emergencyContactSchema = z.object({
  name: z.string().min(1, "Emergency contact name is required"),
  relation: z.string().min(1, "Relation is required"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number"),
});

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

const workLocationSchema = z.object({
  type: z.enum(["onsite", "remote", "hybrid"]),
  officeAddress: z.string().optional(),
});

const reportingManagerSchema = z.object({
  managerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid manager ID"),
  role: z.enum([
    "teamLead",
    "manager",
    "supervisor",
    "departmentHead",
    "projectManager",
    "other",
  ]),
});

const employmentInfoSchema = z.object({
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  reportingManagers: z.array(reportingManagerSchema).optional(),
  joiningDate: z.string().or(z.date()),
  contractEndDate: z.string().or(z.date()).optional(),
  employmentStatus: z.enum(["active", "terminated", "resigned", "on-hold"]),
  workLocation: workLocationSchema,
});

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().or(z.date()),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "Invalid phone number"),
  emergencyContact: emergencyContactSchema,
  address: addressSchema,
  employment: employmentInfoSchema,
});

export const updateStaffSchema = createStaffSchema.partial();