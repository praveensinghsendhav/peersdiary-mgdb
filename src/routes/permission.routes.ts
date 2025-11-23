import { Router } from "../types/classes/router.class";
import { PermissionController } from "../controller/permission.controller";
import { validate , validateQuery } from "../middleware/validation.middleware";
import { createPermissionSchema, updatePermissionSchema } from "../validation/permission.validation"; 
import { paginationSchema } from "../validation/common.validation";
import { authenticate, authorize, checkPermission } from "../middleware/auth.middleware";
export class PermissionRoutes extends Router {
    constructor() {
        super();
    }

    define(): void { 
      const { router } = this;
      // ========== PERMISSION ROUTES ==========
    router.post(
  "",
  authenticate,
  authorize("Administrator"),
  validate(createPermissionSchema),
  PermissionController.createPermission
);

router.get(
  "",
  authenticate,
  checkPermission("settings", "read"),
  validateQuery(paginationSchema),
  PermissionController.getAllPermissions
);

router.get(
  "/:id",
  authenticate,
  checkPermission("settings", "read"),
  PermissionController.getPermissionById
);

router.get(
  "/resource/:resource",
  authenticate,
  checkPermission("settings", "read"),
  PermissionController.getPermissionsByResource
);

router.put(
  "/:id",
  authenticate,
  authorize("Administrator"),
  validate(updatePermissionSchema),
  PermissionController.updatePermission
);

router.delete(
  "/:id",
  authenticate,
  authorize("Administrator"),
  PermissionController.deletePermission
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("Administrator"),
  PermissionController.togglePermissionStatus
);
    }
}
