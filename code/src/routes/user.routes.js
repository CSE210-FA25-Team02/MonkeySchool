import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// CRUD
router.get(
  '/profile',
  requireAuth,
  asyncHandler(userController.renderUserProfilePage)
);
router.get(
  '/profile/link-field',
  requireAuth,
  asyncHandler(userController.renderProfileLinkField)
);
router.post('/', asyncHandler(userController.createUser));
router.get('/:id', asyncHandler(userController.getUser));
router.put('/:id', asyncHandler(userController.updateUser));
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
