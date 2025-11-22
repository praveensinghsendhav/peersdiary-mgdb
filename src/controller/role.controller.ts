import { Request, Response } from "express";
import { RoleModel, RoleLevel } from "../models/role.schema";
import { Types } from "mongoose";

interface RoleQuery {
  page?: string;
  limit?: string;
  search?: string;
  level?: RoleLevel;
  isActive?: string;
  isSystemRole?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class RoleController {
  // Create new role
  static async createRole(req: Request, res: Response) {
    try {
      const [role] = await RoleModel.create(req.body); 
      await role.populate("permissions.permissionId", "name description resource actions");

      return res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Role ID or name already exists",
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Failed to create role",
        error: error.message,
      });
    }
  }

  // Get all roles with pagination
  static async getAllRoles(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        level,
        isActive,
        isSystemRole,
        sortBy = "roleName",
        sortOrder = "asc",
      } = req.query as RoleQuery;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { roleName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { roleId: { $regex: search, $options: "i" } },
        ];
      }

      if (level) {
        filter.level = level;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === "true";
      }

      if (isSystemRole !== undefined) {
        filter.isSystemRole = isSystemRole === "true";
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [roles, total] = await Promise.all([
        RoleModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate("permissions.permissionId", "name description resource actions")
          .lean(),
        RoleModel.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: roles,
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
        message: "Failed to fetch roles",
        error: error.message,
      });
    }
  }

  // Get role by ID
  static async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findById(id)
        .populate("permissions.permissionId", "name description resource actions")
        .lean();

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch role",
        error: error.message,
      });
    }
  }

  // Get roles by level
  static async getRolesByLevel(req: Request, res: Response) {
    try {
      const { level } = req.params;

      const roles = await RoleModel.find({
        level,
        isActive: true,
      })
        .populate("permissions.permissionId", "name description resource actions")
        .lean();

      return res.status(200).json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch roles by level",
        error: error.message,
      });
    }
  }

  // Update role
  static async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).populate("permissions.permissionId", "name description resource actions");

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: role,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to update role",
        error: error.message,
      });
    }
  }

  // Delete role
  static async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      if (role.isSystemRole) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete system roles",
        });
      }

      await RoleModel.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete role",
        error: error.message,
      });
    }
  }

  // Add permissions to role
  static async addPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body; // Array of { permissionId, allowedActions }

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findByIdAndUpdate(
        id,
        { $push: { permissions: { $each: permissions } } },
        { new: true, runValidators: true }
      ).populate("permissions.permissionId", "name description resource actions");

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Permissions added successfully",
        data: role,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to add permissions",
        error: error.message,
      });
    }
  }

  // Remove permissions from role
  static async removePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findByIdAndUpdate(
        id,
        { $pull: { permissions: { permissionId: { $in: permissionIds } } } },
        { new: true }
      ).populate("permissions.permissionId", "name description resource actions");

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Permissions removed successfully",
        data: role,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to remove permissions",
        error: error.message,
      });
    }
  }

  // Toggle role active status
  static async toggleRoleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await RoleModel.findById(id);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      role.isActive = !role.isActive;
      await role.save();

      return res.status(200).json({
        success: true,
        message: `Role ${role.isActive ? "activated" : "deactivated"} successfully`,
        data: role,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: "Failed to toggle role status",
        error: error.message,
      });
    }
  }
}