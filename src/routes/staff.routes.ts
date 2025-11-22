import { Router } from "../types/classes/router.class"; 
import { StaffController } from "../controller/staff.controller"; 
import { validate , validateQuery } from "../middleware/validation.middleware"; 
import { createStaffSchema, updateStaffSchema } from "../validation/staff.validation"; 
import { paginationSchema } from "../validation/common.validation";

export class StaffRoutes extends Router { 
    constructor() { 
        super(); 
    } 
    define(): void {   
      const { router } = this;
      // ========== STAFF ROUTES ==========
      router.post("", validate(createStaffSchema), StaffController.createStaff);
      router.get("", validateQuery(paginationSchema), StaffController.getAllStaff);
      router.get("/:id", StaffController.getStaffById);
      router.put("/:id", validate(updateStaffSchema), StaffController.updateStaff);
      router.delete("/:id", StaffController.deleteStaff);
      router.delete("/:id/permanent", StaffController.permanentlyDeleteStaff);
      router.get("/department/:department", validateQuery(paginationSchema), StaffController.getStaffByDepartment);
      router.get("/manager/:managerId/team", StaffController.getTeamMembers);
    } 
}