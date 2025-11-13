import { prisma } from '../lib/prisma.js';
import { Router } from "express";
import { createClassRoleController } from '../controllers/classRole.controller.js';
import { createClassRoleService } from '../services/classRole.service.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
  import {
    classIdSchema,
    updateRoleSchema,
    removeUserSchema,
    // addUserSchema
  } from '../validators/classRole.validator.js';

const router = Router();
router.use(optionalAuth);  // Apply authentication to all routes in this router

// Create service instance first
const classRoleService = createClassRoleService(prisma);
// Create controller instance with the service
const classRoleController = createClassRoleController(classRoleService);

// Get roster for a class (any class member can view)
router.get('/:classId/roster',
    validate(classIdSchema),
    classRoleController.getRoster
);

    // Assign or change role (professors only)
    router.put('/:classId/roster/:userId/assign',
    validate(updateRoleSchema),
    classRoleController.updateUserRoleByClass
    );

    // Remove user from class (professors only)
    router.delete('/:classId/roster/:userId/remove',
    validate(removeUserSchema),
    classRoleController.removeUserFromClass
    );

    // Add user to class (professors only)
    //   router.post('/:classId/roster/:userId/add',
    //     requireProfessor,
    //     validate(addUserSchema),
    //     classRoleController.addUserToClass
    //   );

export default router;
