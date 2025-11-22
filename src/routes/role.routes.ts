import { Router } from "../types/classes/router.class";  
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { paginationSchema } from "../validation/common.validation";  
import {createRoleSchema, updateRoleSchema, addPermissionsToRoleSchema, removePermissionsFromRoleSchema} from "../validation/role.validation";
import { RoleController } from "../controller/role.controller";

export class RoleRoutes extends Router {
    constructor() { 
        super(); 
    } 
    
    define(): void {   
      const { router } = this; 
      // ========== ROLE ROUTES ==========
      router.post("", validate(createRoleSchema), RoleController.createRole);
      router.get("", validateQuery(paginationSchema), RoleController.getAllRoles);
      router.get("/:id", RoleController.getRoleById);
      router.get("/level/:level", RoleController.getRolesByLevel);
      router.put("/:id", validate(updateRoleSchema), RoleController.updateRole);
      router.delete("/:id", RoleController.deleteRole);
      router.post("/:id/permissions", validate(addPermissionsToRoleSchema), RoleController.addPermissions);
      router.delete("/:id/permissions", validate(removePermissionsFromRoleSchema), RoleController.removePermissions);
      router.patch("/:id/toggle-status", RoleController.toggleRoleStatus); 
    } 
  }