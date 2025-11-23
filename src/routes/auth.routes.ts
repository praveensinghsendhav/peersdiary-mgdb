import { Router } from "../types/classes/router.class";  
import { validate  } from "../middleware/validation.middleware"; 
import { rateLimitAuth , authenticate } from "../middleware/auth.middleware";
import { loginSchema, refreshTokenSchema, logoutSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from "../validation/auth.validation";
import { AuthController } from "../controller/auth.controller";

export class AuthRoutes extends Router {
    constructor() { 
        super(); 
    } 
    
    define(): void {   
      const { router } = this; 
      // ========== AUTH ROUTES ==========

router.post(
  "/login",
  rateLimitAuth(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validate(loginSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  "/logout",
  validate(logoutSchema),
  AuthController.logout
);

router.post(
  "/forgot-password",
  rateLimitAuth(3, 60 * 60 * 1000), // 3 attempts per hour
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  rateLimitAuth(5, 60 * 60 * 1000), // 5 attempts per hour
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

// Protected routes (authentication required)
router.get(
  "/me",
  authenticate,
  AuthController.getCurrentUser
);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

router.post(
  "/logout-all",
  authenticate,
  AuthController.logoutAll
);
    } 
  }