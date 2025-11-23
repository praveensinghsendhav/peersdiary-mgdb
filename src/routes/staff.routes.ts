import { Router } from "../types/classes/router.class"; 
import { StaffController } from "../controller/staff.controller"; 
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { createStaffSchema, updateStaffSchema } from "../validation/staff.validation"; 
import { paginationSchema } from "../validation/common.validation";
import { authenticate, authorize, checkPermission } from "../middleware/auth.middleware"; 


export class StaffRoutes extends Router { 
    constructor() { 
        super(); 
    } 
    define(): void {   
      const { router } = this;
    // ========== STAFF ROUTES ==========
router.post(
  "",
  authenticate,
  checkPermission("staff", "create"),
  validate(createStaffSchema),
  StaffController.createStaff
);

router.get(
  "",
  authenticate,
  checkPermission("staff", "read"),
  validateQuery(paginationSchema),
  StaffController.getAllStaff
);

router.get(
  "/:id",
  authenticate,
  checkPermission("staff", "read"),
  StaffController.getStaffById
);

router.put(
  "/:id",
  authenticate,
  checkPermission("staff", "update"),
  validate(updateStaffSchema),
  StaffController.updateStaff
);

router.delete(
  "/:id",
  authenticate,
  checkPermission("staff", "delete"),
  StaffController.deleteStaff
);

router.delete(
  "/:id/permanent",
  authenticate,
  authorize("Administrator", "HR Manager"),
  StaffController.permanentlyDeleteStaff
);

router.get(
  "/department/:department",
  authenticate,
  checkPermission("staff", "read"),
  validateQuery(paginationSchema),
  StaffController.getStaffByDepartment
);

router.get(
  "/manager/:managerId/team",
  authenticate,
  checkPermission("staff", "read"),
  StaffController.getTeamMembers
);
    } 
}