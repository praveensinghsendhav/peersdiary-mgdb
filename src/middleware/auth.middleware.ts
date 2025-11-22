import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, DecodedToken } from "../utils/jwt.utils";
import { UserCredentialsModel } from "../models/user-credentials.schema";
import { StaffProfileModel } from "../models/staff-profile.schema";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      userProfile?: any;
    }
  }
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const userCredentials = await UserCredentialsModel.findOne({
      email: decoded.email,
    });

    if (!userCredentials) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Check if account is locked
    if ((userCredentials as any).isAccountLocked()) {
      return res.status(403).json({
        success: false,
        message: "Account is locked. Please try again later.",
      });
    }

    // Get staff profile
    const staffProfile = await StaffProfileModel.findById(
      userCredentials.staffProfileId
    ).populate("assignedRoles");

    if (!staffProfile || !staffProfile.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Attach user info to request
    req.user = decoded;
    req.userProfile = staffProfile;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired token",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't fail if not
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      req.user = decoded;

      const staffProfile = await StaffProfileModel.findOne({
        staffId: decoded.userId,
      });
      req.userProfile = staffProfile;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-Based Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userProfile) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userRoles = req.userProfile.assignedRoles.map(
        (role: any) => role.roleName
      );

      const hasRole = allowedRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          requiredRoles: allowedRoles,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Authorization check failed",
        error: error.message,
      });
    }
  };
};

/**
 * Permission-Based Authorization Middleware
 * Checks if user has specific permission and action
 */
export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userProfile) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const profile = await StaffProfileModel.findById(req.userProfile._id)
        .populate({
          path: "assignedRoles",
          populate: {
            path: "permissions.permissionId",
            model: "Permission",
          },
        })
        .populate("customPermissions.permissionId");

      if (!profile) {
        return res.status(403).json({
          success: false,
          message: "User profile not found",
        });
      }

      let hasPermission = false;

      // Check role permissions
      for (const role of profile.assignedRoles as any[]) {
        for (const rolePermission of role.permissions) {
          const permission = rolePermission.permissionId;
          if (
            permission.resource === resource &&
            rolePermission.allowedActions.includes(action) &&
            permission.isActive
          ) {
            hasPermission = true;
            break;
          }
        }
        if (hasPermission) break;
      }

      // Check custom permissions (can override role permissions)
      if (profile.customPermissions) {
        for (const customPerm of profile.customPermissions) {
          const permission = customPerm.permissionId as any;
          if (permission.resource === resource) {
            if (customPerm.isRevoked) {
              hasPermission = false;
              break;
            } else if (customPerm.allowedActions.includes(action as any)) {
              hasPermission = true;
              break;
            }
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${action} ${resource}`,
          required: { resource, action },
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
        error: error.message,
      });
    }
  };
};

/**
 * Rate Limiting Middleware for Auth Routes
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const rateLimitAuth = (
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const attempts = loginAttempts.get(identifier);

    if (attempts && attempts.resetAt > now) {
      if (attempts.count >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((attempts.resetAt - now) / 1000),
        });
      }
      attempts.count++;
    } else {
      loginAttempts.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
    }

    next();
  };
};