import { Router } from 'express';
import * as classController from '../controllers/class.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';

// const router = Router();
const router = Router({ mergeParams: true });

// HTML page route for HTMX (uses optionalAuth to check if user is logged in)
router.get(
  '/my-classes',
  requireAuth,
  asyncHandler(classController.renderUserClasses)
);

// Class Create Form
router.get(
  '/form',
  requireAuth,
  asyncHandler(classController.renderCreateClassForm)
);
router.get('/close-form', asyncHandler(classController.closeCreateClassForm));

// JSON API route for programmatic access
// Using optionalAuth to allow query param fallback for tests
// TODO: Change back to requireAuth once full JWT testing is implemented
router.get(
  '/user/classes',
  requireAuth,
  asyncHandler(classController.getUserClasses)
);

// Invite lookup must come before /:id
router.get(
  '/invite/:code',
  requireAuth,
  asyncHandler(classController.getClassByInviteCode)
);

// CRUD
router.post('/create', requireAuth, asyncHandler(classController.createClass));
router.get(
  '/:id',
  requireAuth,
  (req, res, next) => {
    // Only apply requireRole if quarter param exists (for /:quarter/classes routes)
    if (req.params.quarter) {
      return requireRole('class', ['PROFESSOR', 'TA', 'TUTOR', 'STUDENT'])(
        req,
        res,
        next
      );
    }
    next();
  },
  asyncHandler(classController.getClass)
);
router.get(
  '/:id/directory/json',
  asyncHandler(classController.getClassDirectory)
); // For testing and preview
router.get(
  '/:id/directory',
  asyncHandler(classController.renderClassDirectory)
);
router.put(
  '/:id',
  requireAuth,
  (req, res, next) => {
    // Only apply requireRole if quarter param exists (for /:quarter/classes routes)
    if (req.params.quarter) {
      return requireRole('class', ['PROFESSOR', 'TA'])(req, res, next);
    }
    next();
  },
  asyncHandler(classController.updateClass)
);
router.delete(
  '/:id',
  requireAuth,
  (req, res, next) => {
    // Only apply requireRole if quarter param exists (for /:quarter/classes routes)
    if (req.params.quarter) {
      return requireRole('class', ['PROFESSOR'])(req, res, next);
    }
    next();
  },
  asyncHandler(classController.deleteClass)
);

export default router;
