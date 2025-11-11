// Class Controller - JSON API Edition

import * as classService from "../services/class.service.js";
import {
  asyncHandler
} from "../utils/async-handler.js";
import {
  NotFoundError
} from "../utils/api-error.js";
import {
  escapeHtml
} from "../utils/html-templates.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const klass = await classService.createClass(req.body);
  res.status(201).json(klass);
});

/**
 * Get class by ID (includes roster + groups)
 */
export const getClass = asyncHandler(async (req, res) => {
  const klass = await classService.getClassById(req.params.id);
  if (!klass) throw new NotFoundError("Class not found");
  res.json(klass);
});

/**
 * Get class by invite code (public join flow)
 */
export const getClassByInviteCode = asyncHandler(async (req, res) => {
  const klass = await classService.getClassByInviteCode(req.params.code);
  if (!klass) throw new NotFoundError("Class not found");
  res.json(klass);
});

/**
 * Update class name, quarter, etc.
 */
export const updateClass = asyncHandler(async (req, res) => {
  const klass = await classService.updateClass(req.params.id, req.body);
  res.json(klass);
});

/**
 * Get all classes for a specific user
 * Requires authentication via middleware
 */
export const getUserClasses = asyncHandler(async (req, res) => {
  // Priority: JWT auth (production), fallback to query param (testing)
  // TODO: Remove query param fallback once full JWT auth is deployed
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const classes = await classService.getClassesByUserId(userId);
  res.json(classes);
});

/**
 * Render class list page for HTMX
 * Uses authenticated user from JWT cookie
 */
export const renderUserClasses = asyncHandler(async (req, res) => {
  // Priority: JWT auth (production), fallback to query param (testing)
  // TODO: Remove query param fallback once full JWT auth is deployed
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.send(renderAuthRequiredHTML());
  }

  const classes = await classService.getClassesByUserId(userId);
  const html = renderClassListHTML(classes);

  res.send(html);
});

/**
 * Delete a class by ID
 */
export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(204).send();
});

/**
 * Helper function to render class list HTML
 */
function renderClassListHTML(classes) {
  if (!classes || classes.length === 0) {
    return `
      <section class="class-list" role="region" aria-labelledby="classes-title">
        <div class="class-list__header">
          <h2 id="classes-title" class="class-list__title">My Classes</h2>
        </div>
        <div class="class-list__empty">
          <div class="class-list__empty-icon" aria-hidden="true"></div>
          <h3 class="class-list__empty-title">No Classes Found</h3>
          <p class="class-list__empty-message">
            You are not enrolled in any classes yet.<br>
            Contact your instructor for an invite code to join a class.
          </p>
        </div>
      </section>
    `;
  }

  const classCards = classes.map(klass => {
    const roleClass = klass.role.toLowerCase().replace('_', '-');
    const quarter = klass.quarter || 'Not specified';

    const createdDate = klass.createdAt ?
      new Date(klass.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) :
      '';

    return `
      <article class="class-card" role="article">
        <div class="class-card__sidebar">
          <div class="class-card__icon" aria-hidden="true"></div>
        </div>
        
        <div class="class-card__content">
          <div class="class-card__header">
            <div>
              <h3 class="class-card__title">${escapeHtml(klass.name)}</h3>
              <p class="class-card__quarter">${escapeHtml(quarter)}</p>
            </div>
            <span class="class-card__role class-card__role--${roleClass}" 
                  role="status"
                  aria-label="Your role: ${klass.role}">
              ${klass.role}
            </span>
          </div>
          
          <div class="class-card__body">
            <div class="class-card__info">
              <div class="class-card__info-item">
                <span class="class-card__info-label">Invite Code:</span>
                <code class="class-card__invite-code">${escapeHtml(klass.inviteCode)}</code>
              </div>
              ${createdDate ? `
              <div class="class-card__info-item">
                <span class="class-card__info-label">Created:</span>
                <span class="class-card__info-value">${createdDate}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="class-card__footer">
            <a href="/classes/${klass.id}" 
               class="class-card__link"
               hx-get="/api/classes/${klass.id}"
               hx-target="#main-content"
               hx-push-url="true"
               hx-indicator="#loading"
               aria-label="View details for ${escapeHtml(klass.name)}">
              View Details
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="class-list" role="region" aria-labelledby="classes-title">
      <div class="class-list__header">
        <h2 id="classes-title" class="class-list__title">My Classes</h2>
        <p class="class-list__count">${classes.length} ${classes.length === 1 ? 'class' : 'classes'}</p>
      </div>
      
      <div class="class-cards">
        ${classCards}
      </div>
    </section>
  `;
}

/**
 * Helper function to render auth required message
 */
function renderAuthRequiredHTML() {
  return `
    <section class="class-list" role="region">
      <div class="class-list__error">
        <div class="class-list__error-icon" aria-hidden="true"></div>
        <h2 class="class-list__error-title">Authentication Required</h2>
        <p class="class-list__error-message">
          Please log in to view your classes.<br>
          You need to be authenticated to access this page.
        </p>
      </div>
    </section>
  `;
}