import { Request, Response } from "express";
import { PermissionModel, ResourceType } from "../models/permission.schema";
import { Types } from "mongoose"; 

// ========== PERMISSION CONTROLLER ==========
interface PermissionQuery {
  page?: string;
  limit?: string;
  search?: string;
  resource?: ResourceType;
  isActive?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class PermissionController {
  // Create new permission
  static async createPermission(req: Request, res: Response) {
    try {
      const permission = await PermissionModel.create(req.body);
      return res.status(201).json({
        success: true,
        message: "Permission created successfully",
        data: permission,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Permission ID or name already exists",
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Failed to create permission",
        error: error.message,
      });
    }
  }

  // Get all permissions with pagination
  static async getAllPermissions(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        resource,
        isActive,
        sortBy = "name",
        sortOrder = "asc",
      } = req.query as PermissionQuery;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { permissionId: { $regex: search, $options: "i" } },
        ];
      }

      if (resource) {
        filter.resource = resource;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === "true";
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [permissions, total] = await Promise.all([
        PermissionModel.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
        PermissionModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: permissions,
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
        message: "Failed to fetch permissions",
        error: error.message,
      });
    }
  }

  // Get permission by ID
  static async getPermissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission ID",
        });
      }

      const permission = await PermissionModel.findById(id).lean();

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: permission,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch permission",
        error: error.message,
      });
    }
  }

  // Get permissions by resource type
  static async getPermissionsByResource(req: Request, res: Response) {
    try {
      const { resource } = req.params;

      const permissions = await PermissionModel.find({
        resource,
        isActive: true,
      }).lean();

      return res.status(200).json({
        success: true,
        data: permissions,
        count: permissions.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch permissions by resource",
        error: error.message,
      });
    }
  }

  // Update permission
  static async updatePermission(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission ID",
        });
      }

      const permission = await PermissionModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Permission updated successfully",
        data: permission,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update permission",
        error: error.message,
      });
    }
  }

  // Delete permission
  static async deletePermission(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission ID",
        });
      }

      const permission = await PermissionModel.findByIdAndDelete(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Permission deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete permission",
        error: error.message,
      });
    }
  }

  // Toggle permission active status
  static async togglePermissionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission ID",
        });
      }

      const permission = await PermissionModel.findById(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permission not found",
        });
      }

      permission.isActive = !permission.isActive;
      await permission.save();

      return res.status(200).json({
        success: true,
        message: `Permission ${permission.isActive ? "activated" : "deactivated"} successfully`,
        data: permission,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to toggle permission status",
        error: error.message,
      });
    }
  }
}