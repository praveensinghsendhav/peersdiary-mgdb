import { Router } from "../types/classes/router.class";  
import { StaffProfileController } from "../controller/staffprofile.controller"; 
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { createProfileSchema, updateProfileSchema , assignRolesSchema ,addCustomPermissionsSchema } from "../validation/staff-profile.validation"; 
import { paginationSchema } from "../validation/common.validation"; 
import { authenticate, authorize, checkPermission } from "../middleware/auth.middleware"; 

export class StaffProfileRoutes extends Router { 
    constructor() { 
        super(); 
    } 
    define(): void {   
      const { router } = this; 
      // ========== STAFF PROFILE ROUTES ==========
     router.post("",  authenticate, checkPermission("staff", "create"), validate(createProfileSchema), StaffProfileController.createProfile);
  
router.get(
  "",
  authenticate,
  checkPermission("staff", "read"),
  validateQuery(paginationSchema),
  StaffProfileController.getAllProfiles
);

router.get(
  "/:id",
  authenticate,
  checkPermission("staff", "read"),
  StaffProfileController.getProfileById
);

router.get(
  "/staff/:staffId",
  authenticate,
  checkPermission("staff", "read"),
  StaffProfileController.getProfileByStaffId
);

router.put(
  "/:id",
  authenticate,
  checkPermission("staff", "update"),
  validate(updateProfileSchema),
  StaffProfileController.updateProfile
);

router.delete(
  "/:id",
  authenticate,
  checkPermission("staff", "delete"),
  StaffProfileController.deleteProfile
);

router.post(
  "/:id/roles",
  authenticate,
  authorize("Administrator", "HR Manager"),
  validate(assignRolesSchema),
  StaffProfileController.assignRoles
);

router.delete(
  "/:id/roles",
  authenticate,
  authorize("Administrator", "HR Manager"),
  validate(assignRolesSchema),
  StaffProfileController.removeRoles
);

router.post(
  "/:id/permissions",
  authenticate,
  authorize("Administrator"),
  validate(addCustomPermissionsSchema),
  StaffProfileController.addCustomPermissions
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("Administrator", "HR Manager"),
  StaffProfileController.updateAccountStatus
);

router.patch(
  "/:id/last-login",
  authenticate,
  StaffProfileController.updateLastLogin
);
    } 
}