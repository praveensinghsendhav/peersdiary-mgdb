import { Request, Response } from "express";
import { StaffModel, EmploymentStatus, EmploymentType } from "../models/staff.schema";
import { Types } from "mongoose";

interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  department?: string;
  employmentStatus?: EmploymentStatus;
  employmentType?: EmploymentType;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class StaffController {
  // Create new staff member
  static async createStaff(req: Request, res: Response) {
    try {
      const staff = await StaffModel.create(req.body);
      return res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        data: staff,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Email or staff ID already exists",
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Failed to create staff member",
        error: error.message,
      });
    }
  }

  // Get all staff with pagination and search
  static async getAllStaff(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        department,
        employmentStatus,
        employmentType,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as PaginationQuery;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      const filter: any = {};

      // Search across multiple fields
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { staffId: { $regex: search, $options: "i" } },
        ];
      }

      if (department) {
        filter["employment.department"] = department;
      }

      if (employmentStatus) {
        filter["employment.employmentStatus"] = employmentStatus;
      }

      if (employmentType) {
        filter["employment.employmentType"] = employmentType;
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [staff, total] = await Promise.all([
        StaffModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("employment.reportingManagers.managerId", "firstName lastName email employment.jobTitle")
          .lean(),
        StaffModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: staff,
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
        message: "Failed to fetch staff members",
        error: error.message,
      });
    }
  }

  // Get staff by ID
  static async getStaffById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      const staff = await StaffModel.findById(id)
        .populate("employment.reportingManagers.managerId", "firstName lastName email employment.jobTitle")
        .lean();

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff member",
        error: error.message,
      });
    }
  }

  // Update staff
  static async updateStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      const staff = await StaffModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate("employment.reportingManagers.managerId", "firstName lastName email employment.jobTitle");

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        data: staff,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update staff member",
        error: error.message,
      });
    }
  }

  // Delete staff (soft delete by changing status)
  static async deleteStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      const staff = await StaffModel.findByIdAndUpdate(
        id,
        { $set: { "employment.employmentStatus": "terminated" } },
        { new: true }
      );

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Staff member terminated successfully",
        data: staff,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to terminate staff member",
        error: error.message,
      });
    }
  }

  // Permanently delete staff
  static async permanentlyDeleteStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      const staff = await StaffModel.findByIdAndDelete(id);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff member not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Staff member permanently deleted",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete staff member",
        error: error.message,
      });
    }
  }

  // Get staff by department
  static async getStaffByDepartment(req: Request, res: Response) {
    try {
      const { department } = req.params;
      const {
        page = "1",
        limit = "10",
        employmentStatus,
      } = req.query as PaginationQuery;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { "employment.department": department };
      if (employmentStatus) {
        filter["employment.employmentStatus"] = employmentStatus;
      }

      const [staff, total] = await Promise.all([
        StaffModel.find(filter).skip(skip).limit(limitNum).lean(),
        StaffModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: staff,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch staff by department",
        error: error.message,
      });
    }
  }

  // Get team members reporting to a manager
  static async getTeamMembers(req: Request, res: Response) {
    try {
      const { managerId } = req.params;

      if (!Types.ObjectId.isValid(managerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager ID",
        });
      }

      const staff = await StaffModel.find({
        "employment.reportingManagers.managerId": managerId,
        "employment.employmentStatus": "active",
      }).lean();

      return res.status(200).json({
        success: true,
        data: staff,
        count: staff.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch team members",
        error: error.message,
      });
    }
  }
}