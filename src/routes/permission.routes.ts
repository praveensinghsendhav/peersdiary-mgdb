import { Router } from "../types/classes/router.class";
import { PermissionController } from "../controller/permission.controller";
import { validate , validateQuery } from "../middleware/validation.middleware";
import { createPermissionSchema, updatePermissionSchema } from "../validation/permission.validation"; 
import { paginationSchema } from "../validation/common.validation";

export class PermissionRoutes extends Router {
    constructor() {
        super();
    }

    define(): void {
      // ========== PERMISSION ROUTES ==========
      this.router.post("", validate(createPermissionSchema), PermissionController.createPermission);
      this.router.get("", validateQuery(paginationSchema), PermissionController.getAllPermissions);
      this.router.get("/:id", PermissionController.getPermissionById);
      this.router.get("/resource/:resource", PermissionController.getPermissionsByResource);
      this.router.put("/:id", validate(updatePermissionSchema), PermissionController.updatePermission);
      this.router.delete("/:id", PermissionController.deletePermission);
      this.router.patch("/:id/toggle-status", PermissionController.togglePermissionStatus);
    }
}
