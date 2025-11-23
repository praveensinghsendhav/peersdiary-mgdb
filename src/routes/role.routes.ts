import { Router } from "../types/classes/router.class";  
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { paginationSchema } from "../validation/common.validation";  
import {createRoleSchema, updateRoleSchema, addPermissionsToRoleSchema, removePermissionsFromRoleSchema} from "../validation/role.validation";
import { RoleController } from "../controller/role.controller";
import { authenticate, authorize, checkPermission } from "../middleware/auth.middleware";
export class RoleRoutes extends Router {
    constructor() { 
        super(); 
    } 
    
    define(): void {   
      const { router } = this; 
      // ========== ROLE ROUTES ==========
  router.post(
  "",
  authenticate,
  authorize("Administrator"),
  validate(createRoleSchema),
  RoleController.createRole
);

router.get(
  "",
  authenticate,
  checkPermission("settings", "read"),
  validateQuery(paginationSchema),
  RoleController.getAllRoles
);

router.get(
  "/:id",
  authenticate,
  checkPermission("settings", "read"),
  RoleController.getRoleById
);

router.get(
  "/level/:level",
  authenticate,
  checkPermission("settings", "read"),
  RoleController.getRolesByLevel
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  validate(updateRoleSchema),
  RoleController.updateRole
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  RoleController.deleteRole
);

router.post(
  "/:id/permissions",
  authenticate,
  authorize("Administrator"),
  validate(addPermissionsToRoleSchema),
  RoleController.addPermissions
);

router.delete(
  "/:id/permissions",
  authenticate,
  authorize("Administrator"),
  validate(removePermissionsFromRoleSchema),
  RoleController.removePermissions
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("Administrator"),
  RoleController.toggleRoleStatus
);
    } 
  }