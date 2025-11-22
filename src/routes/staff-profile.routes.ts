import { Router } from "../types/classes/router.class";  
import { StaffProfileController } from "../controller/staffprofile.controller"; 
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { createProfileSchema, updateProfileSchema , assignRolesSchema ,addCustomPermissionsSchema } from "../validation/staff-profile.validation"; 
import { paginationSchema } from "../validation/common.validation"; 

export class StaffProfileRoutes extends Router { 
    constructor() { 
        super(); 
    } 
    define(): void {   
      const { router } = this; 
      // ========== STAFF PROFILE ROUTES ==========
     router.post("", validate(createProfileSchema), StaffProfileController.createProfile);
     router.get("", validateQuery(paginationSchema), StaffProfileController.getAllProfiles);
     router.get("/:id", StaffProfileController.getProfileById);
     router.get("/staff/:staffId", StaffProfileController.getProfileByStaffId);
     router.put("/:id", validate(updateProfileSchema), StaffProfileController.updateProfile);
     router.delete("/:id", StaffProfileController.deleteProfile);
     router.post("/:id/roles", validate(assignRolesSchema), StaffProfileController.assignRoles);
     router.delete("/:id/roles", validate(assignRolesSchema), StaffProfileController.removeRoles);
     router.post("/:id/permissions", validate(addCustomPermissionsSchema), StaffProfileController.addCustomPermissions);
     router.patch("/:id/status", StaffProfileController.updateAccountStatus);
     router.patch("/:id/last-login", StaffProfileController.updateLastLogin);
    } 
}