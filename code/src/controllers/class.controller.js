// Class Controller - JSON API Edition

import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { getUpcomingQuarters } from "../utils/html-templates.js";
import { createClassForm } from "../utils/html-templates.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const klass = await classService.createClass(req.body);

  // Check if request is HTMX
  const isHTMX = req.headers['hx-request'];

  const inviteUrl = `${req.protocol}://${req.get('host')}/invite/${klass.inviteCode}`;

  if (isHTMX) {
    res.status(201).send(`
      <section id="modal" class="modal__overlay" hx-on="click: if(event.target === this) this.remove()">
        <div class="modal">
          <h2>Class Created!</h2>
          <p>Your class invite:</p>
          <section style="display:flex; align-items:center; gap:10px;">
            <input type="text" id="class-code" readonly value="${inviteUrl}" class="modal__input" />
            <button class="modal__button modal__button--primary" onclick="navigator.clipboard.writeText(document.getElementById('class-code').value)">Copy</button>
          </section>
          <section class="modal__actions">
            <button type="button" class="modal__button modal__button--secondary" onclick="this.closest('.modal__overlay').remove()">Close</button>
          </section>
        </div>
      </section>
    `);
  } else {
    res.status(201).json(klass);
  }
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
 * Delete a class by ID
 */
export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(204).send();
});


/**
 * Class HTMX Section
 * 
 */

export const renderCreateClassForm = asyncHandler(async (req, res)  => {
  const upcomingQuarters = getUpcomingQuarters();
  res.send(createClassForm(upcomingQuarters));
});