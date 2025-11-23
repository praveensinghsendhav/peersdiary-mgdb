import { Request, Response } from "express";
import { UserCredentialsModel } from "../models/user-credentials.schema";
import { StaffProfileModel } from "../models/staff-profile.schema";

import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateResetToken,
  hashResetToken,
} from "../utils/password.utils";
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from "../utils/jwt.utils";

export class AuthController {
  /**
   * Login user
   * Validates credentials and returns tokens
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password, deviceInfo } = req.body;

      // Find user credentials with password
      const credentials = await UserCredentialsModel.findOne({ email }).select(
        "+password"
      );

      if (!credentials) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if account is locked
      if ((credentials as any).isAccountLocked()) {
        return res.status(403).json({
          success: false,
          message: "Account is locked due to multiple failed login attempts",
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(
        password,
        credentials.password
      );

      if (!isPasswordValid) {
        await (credentials as any).incrementFailedAttempts();
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Reset failed attempts on successful login
      await (credentials as any).resetFailedAttempts();

      // Get staff profile with roles
      const profile = await StaffProfileModel.findById(
        credentials.staffProfileId
      )
        .populate("staffId", "firstName lastName email employment")
        .populate("assignedRoles", "roleName level");

      if (!profile || !profile.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive",
        });
      }

      // Generate tokens
      const tokenPayload = {
        userId: profile.staffId._id.toString(),
        email: credentials.email,
        staffId: (profile.staffId as any).staffId,
        roles: profile.assignedRoles.map((role: any) => role.roleName),
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);

      // Store refresh token
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await (credentials as any).addRefreshToken(
        refreshToken,
        refreshTokenExpiry,
        deviceInfo,
        req.ip
      );

      // Update last login
      profile.lastLogin = new Date();
      await profile.save();

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: profile._id,
            staff: profile.staffId,
            email: credentials.email,
            roles: profile.assignedRoles,
            isActive: profile.isActive,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message,
      });
    }
  }

  /**
   * Refresh access token
   * Uses refresh token to get new access token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user and validate refresh token
      const credentials = await UserCredentialsModel.findOne({
        email: decoded.email,
      });

      if (!credentials) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Check if refresh token exists and is not expired
      const storedToken = credentials.refreshTokens.find(
        (rt :  any) => rt.token === refreshToken && rt.expiresAt > new Date()
      );

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token is invalid or expired",
        });
      }

      // Get profile with roles
      const profile = await StaffProfileModel.findById(
        credentials.staffProfileId
      ).populate("assignedRoles", "roleName level");

      if (!profile || !profile.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive",
        });
      }

      // Generate new access token
      const tokenPayload = {
        userId: profile.staffId.toString(),
        email: credentials.email,
        staffId: decoded.staffId,
        roles: profile.assignedRoles.map((role: any) => role.roleName),
      };

      const accessToken = generateAccessToken(tokenPayload);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: "Token refresh failed",
        error: error.message,
      });
    }
  }

  /**
   * Logout user
   * Removes refresh token
   */
  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const credentials = await UserCredentialsModel.findOne({
        email: decoded.email,
      });

      if (credentials) {
        await (credentials as any).removeRefreshToken(refreshToken);
      }

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }
  }

  /**
   * Logout from all devices
   * Removes all refresh tokens
   */
  static async logoutAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const credentials = await UserCredentialsModel.findOne({
        email: req.user.email,
      });

      if (credentials) {
        await (credentials as any).removeAllRefreshTokens();
      }

      return res.status(200).json({
        success: true,
        message: "Logged out from all devices",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
        error: error.message,
      });
    }
  }

  /**
   * Change password
   * Updates user password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: "New password does not meet requirements",
          errors: passwordValidation.errors,
        });
      }

      // Get credentials with password
      const credentials = await UserCredentialsModel.findOne({
        email: req.user.email,
      }).select("+password");

      if (!credentials) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await comparePassword(
        currentPassword,
        credentials.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash and update password
      credentials.password = await hashPassword(newPassword);
      credentials.passwordChangedAt = new Date();
      credentials.lastPasswordChange = new Date();

      // Remove all refresh tokens (logout from all devices)
      await (credentials as any).removeAllRefreshTokens();
      await credentials.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully. Please login again.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Password change failed",
        error: error.message,
      });
    }
  }

  /**
   * Forgot password
   * Generates and sends password reset token
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const credentials = await UserCredentialsModel.findOne({ email });

      if (!credentials) {
        // Don't reveal if email exists
        return res.status(200).json({
          success: true,
          message: "If the email exists, a reset link has been sent",
        });
      }

      // Generate reset token
      const { token, hashedToken } = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store hashed token
      credentials.passwordResetTokens.push({
        token: hashedToken,
        expiresAt,
        createdAt: new Date(),
        used: false,
      });

      await credentials.save();

      // TODO: Send email with reset token
      // In production, you would send an email here
      // For now, we'll return the token (DON'T DO THIS IN PRODUCTION!)
      
      return res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email",
        // Remove this in production:
        resetToken: token,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to process password reset request",
        error: error.message,
      });
    }
  }

  /**
   * Reset password
   * Uses reset token to update password
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Validate new password
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Password does not meet requirements",
          errors: passwordValidation.errors,
        });
      }

      // Hash the provided token
      const hashedToken = hashResetToken(token);

      // Find user with valid reset token
      const credentials = await UserCredentialsModel.findOne({
        "passwordResetTokens.token": hashedToken,
        "passwordResetTokens.expiresAt": { $gt: new Date() },
        "passwordResetTokens.used": false,
      }).select("+password");

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Update password
      credentials.password = await hashPassword(newPassword);
      credentials.passwordChangedAt = new Date();
      credentials.lastPasswordChange = new Date();

      // Mark token as used
      const tokenIndex = credentials.passwordResetTokens.findIndex(
        (rt :  any) => rt.token === hashedToken
      );
      if (tokenIndex !== -1) {
        credentials.passwordResetTokens[tokenIndex].used = true;
      }

      // Remove all refresh tokens
      await (credentials as any).removeAllRefreshTokens();
      await credentials.save();

      return res.status(200).json({
        success: true,
        message: "Password reset successful. Please login with your new password.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Password reset failed",
        error: error.message,
      });
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user || !req.userProfile) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const profile = await StaffProfileModel.findById(req.userProfile._id)
        .populate("staffId", "firstName lastName email phone employment")
        .populate("assignedRoles", "roleName description level");

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to get user info",
        error: error.message,
      });
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      const credentials = await UserCredentialsModel.findOne({
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() },
      });

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }

      credentials.isEmailVerified = true;
      credentials.emailVerificationToken = undefined;
      credentials.emailVerificationExpiry = undefined;
      await credentials.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Email verification failed",
        error: error.message,
      });
    }
  }
}