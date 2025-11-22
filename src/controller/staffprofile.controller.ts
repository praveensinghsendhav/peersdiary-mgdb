import { Request, Response } from "express";
import { StaffProfileModel, ExperienceLevel } from "../models/staff-profile.schema";
import { Types } from "mongoose";

interface ProfilePaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  designation?: string;
  experienceLevel?: ExperienceLevel;
  isActive?: string;
  skills?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class StaffProfileController {
  // Create new staff profile
  static async createProfile(req: Request, res: Response) {
    try {
      const [profile] = await StaffProfileModel.create(req.body);
      await profile.populate("staffId", "firstName lastName email");
      
      return res.status(201).json({
        success: true,
        message: "Staff profile created successfully",
        data: profile,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Profile already exists for this staff member",
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Failed to create staff profile",
        error: error.message,
      });
    }
  }

  // Get all profiles with pagination and filters
  static async getAllProfiles(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        designation,
        experienceLevel,
        isActive,
        skills,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as ProfilePaginationQuery;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      // Search across multiple fields
      if (search) {
        filter.$or = [
          { "professionalInfo.employeeId": { $regex: search, $options: "i" } },
          { "professionalInfo.designation": { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ];
      }

      if (designation) {
        filter["professionalInfo.designation"] = { $regex: designation, $options: "i" };
      }

      if (experienceLevel) {
        filter["professionalInfo.experienceLevel"] = experienceLevel;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === "true";
      }

      if (skills) {
        const skillsArray = skills.split(",").map(s => s.trim());
        filter["professionalInfo.skills"] = { $in: skillsArray };
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [profiles, total] = await Promise.all([
        StaffProfileModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("staffId", "firstName lastName email phone employment.department employment.jobTitle")
          .populate("assignedRoles", "roleName description level")
          .lean(),
        StaffProfileModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: profiles,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff profiles",
        error: error.message,
      });
    }
  }

  // Get profile by ID
  static async getProfileById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findById(id)
        .populate("staffId", "firstName lastName email phone employment")
        .populate("assignedRoles", "roleName description level permissions")
        .populate("customPermissions.permissionId", "name description resource actions")
        .lean();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff profile",
        error: error.message,
      });
    }
  }

  // Get profile by staff ID
  static async getProfileByStaffId(req: Request, res: Response) {
    try {
      const { staffId } = req.params;

      if (!Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      const profile = await StaffProfileModel.findOne({ staffId })
        .populate("staffId", "firstName lastName email phone employment")
        .populate("assignedRoles", "roleName description level permissions")
        .populate("customPermissions.permissionId", "name description resource actions")
        .lean();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff profile",
        error: error.message,
      });
    }
  }

  // Update profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      )
        .populate("staffId", "firstName lastName email")
        .populate("assignedRoles", "roleName description level");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Staff profile updated successfully",
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update staff profile",
        error: error.message,
      });
    }
  }

  // Delete profile
  static async deleteProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndDelete(id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Staff profile deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete staff profile",
        error: error.message,
      });
    }
  }

  // Assign roles to profile
  static async assignRoles(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Role IDs must be a non-empty array",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { $addToSet: { assignedRoles: { $each: roleIds } } },
        { new: true }
      ).populate("assignedRoles", "roleName description level");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Roles assigned successfully",
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to assign roles",
        error: error.message,
      });
    }
  }

  // Remove roles from profile
  static async removeRoles(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { $pull: { assignedRoles: { $in: roleIds } } },
        { new: true }
      ).populate("assignedRoles", "roleName description level");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Roles removed successfully",
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to remove roles",
        error: error.message,
      });
    }
  }

  // Add custom permissions
  static async addCustomPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { $push: { customPermissions: { $each: permissions } } },
        { new: true }
      ).populate("customPermissions.permissionId", "name description resource actions");

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Custom permissions added successfully",
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to add custom permissions",
        error: error.message,
      });
    }
  }

  // Update account status
  static async updateAccountStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Account ${isActive ? "activated" : "deactivated"} successfully`,
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update account status",
        error: error.message,
      });
    }
  }

  // Update last login
  static async updateLastLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile ID",
        });
      }

      const profile = await StaffProfileModel.findByIdAndUpdate(
        id,
        { 
          $set: { lastLogin: new Date() },
          $inc: { loginAttempts: 0 }
        },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Staff profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Last login updated successfully",
        data: profile,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update last login",
        error: error.message,
      });
    }
  }
}