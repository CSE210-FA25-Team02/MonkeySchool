/**
 * Create Punch Card Container Component
 *
 * @returns {string} HTML string for the punch card UI component.
 */
export function createPunchCard() {
  return `
        <section class="punchcard">

            <h3 class="punchcard__title">Activity Punch Card</h3>
            <!-- HTMX loads dropdown options on component load -->
            <select id="punch-select"
                    name="punchSelect"
                    class="punchcard__select"
                    hx-get="/activity/user/dropdown"
                    hx-trigger="load"
                    hx-target="#punch-select"
                    hx-swap="innerHTML"
                    hx-on:change="htmx.trigger('#punch-details', 'loadDetails')">
            </select>

            <!-- Details section updates when selection changes -->
            <div id="punch-details"
                hx-get="/activity/details"
                hx-trigger="loadDetails"
                hx-include="#punch-select"
                hx-target="#punch-details"
                hx-swap="innerHTML">
            </div>

            <div class="punchcard__buttons">
                <button 
                    class="punchcard__button punchcard__button"
                    hx-get="/activity/edit-modal" 
                    hx-target="#modal-container"
                    hx-swap="innerHTML"
                    hx-include="#punch-select">
                    Edit
                </button>
                <button 
                    class="punchcard__button"
                    hx-get="/activity/new-modal" 
                    hx-target="#modal-container"
                    hx-swap="innerHTML">
                    New
                </button>
            </div>
        </section>

        <script>
            document.body.addEventListener("htmx:afterSwap", (e) => {
                if (e.target.id === "punch-select") {
                    htmx.trigger("#punch-details", "loadDetails");
                }
            });
        </script>
    `;
}

/**
 * Create the "New Activity" modal.
 *
 * @param {Object[]} classes - List of class objects available to the user.
 * @param {string} classes[].id - Class ID.
 * @param {string} classes[].name - Class name.
 * @returns {string} HTML string for the new activity modal.
 */
export function createActivityModal(classes) {
  return `
        <div class="modal-overlay open" id="activity-modal">
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fa-solid fa-fingerprint"></i> Create New Activity</h3>
                    <button class="btn-close" onclick="closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = '';">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <form 
                    hx-post="/activity" 
                    hx-trigger="submit" 
                    hx-swap="none"
                    hx-on::after-request="if(event.detail.xhr.status === 201) { closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = ''; if(typeof showToast !== 'undefined') showToast('Success', 'Activity created successfully!', 'success'); setTimeout(() => window.location.reload(), 500); }"
                >
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Class</label>
                        <select 
                            name="classId" 
                            id="class-select"
                            class="form-select"
                            required
                            hx-get="/activity/load-fields"
                            hx-trigger="change"
                            hx-target="#activity-fields"
                            hx-swap="outerHTML"
                            hx-on::after-swap="
                                const modal = document.getElementById('activity-modal');
                                if (modal && !modal.classList.contains('open')) {
                                    modal.classList.add('open');
                                }
                                // Set up form validation after fields are loaded
                                setTimeout(function() {
                                    setupActivityFormValidation();
                                }, 100);
                            "
                        >
                            <option value="">-- Select a class --</option>
                            ${classes.map((cls) => `<option value="${cls.id}">${cls.name}</option>`).join("")}
                        </select>
                    </div>

                    <div id="activity-fields">
                        <!-- Disabled placeholder fields -->
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select name="categoryId" class="form-select" disabled required>
                                <option>-- Select a class first --</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Punch In Time</label>
                            <input 
                                type="datetime-local" 
                                name="startTime" 
                                class="form-input" 
                                disabled 
                                required 
                                value="${new Date().toISOString().slice(0, 16)}"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">Punch Out Time <span style="font-weight: normal; color: var(--color-text-muted);">(optional)</span></label>
                            <input 
                                type="datetime-local" 
                                name="endTime" 
                                class="form-input" 
                                disabled
                            >
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = '';">
                        Cancel
                    </button>
                    <button type="submit" id="save-btn" class="btn btn-primary" disabled>
                        <i class="fa-solid fa-check"></i> Save Activity
                    </button>
                </div>
                </form>
            </div>
        </div>
        <script>
          function setupActivityFormValidation() {
            const form = document.querySelector('#activity-modal form');
            const saveBtn = document.getElementById('save-btn');
            if (!form || !saveBtn) return;
            
            function validateForm() {
              const classSelect = document.getElementById('class-select');
              const categorySelect = form.querySelector('select[name="categoryId"]');
              const startTimeInput = form.querySelector('input[name="startTime"]');
              
              const hasClass = classSelect && classSelect.value !== '';
              const hasCategory = categorySelect && categorySelect.value !== '' && !categorySelect.disabled;
              const hasStartTime = startTimeInput && startTimeInput.value !== '' && !startTimeInput.disabled;
              
              const isValid = hasClass && hasCategory && hasStartTime;
              saveBtn.disabled = !isValid;
            }
            
            // Validate on any form field change
            form.addEventListener('change', validateForm);
            form.addEventListener('input', validateForm);
            
            // Initial validation
            validateForm();
          }
          
          // Set up validation when modal is loaded
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupActivityFormValidation);
          } else {
            setTimeout(setupActivityFormValidation, 100);
          }
        </script>
    `;
}

/**
 * Create the edit-activity modal populated with existing activity values.
 *
 * @param {Object[]} categories - List of categories for the selected class.
 * @param {Object} activity - Activity object being edited.
 * @param {string} activity.id - Activity ID.
 * @param {string} activity.classId - Class ID of the activity.
 * @param {string} activity.categoryId - Category ID of the activity.
 * @param {string|Date} activity.startTime - Start timestamp.
 * @param {string|Date|null} activity.endTime - End timestamp.
 * @param {Object[]} classes - All available classes.
 * @returns {string} HTML string for the edit modal.
 */
export function createEditActivityModal(categories, activity, classes) {
  return `
        <div class="modal-overlay open" id="activity-modal">
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fa-solid fa-pencil"></i> Edit Activity</h3>
                    <button class="btn-close" onclick="closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = '';">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <form 
                    hx-put="/activity/${activity.id}" 
                    hx-swap="none"
                    hx-on::after-request="if(event.detail.xhr.status === 201) { closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = ''; if(typeof showToast !== 'undefined') showToast('Success', 'Activity updated successfully!', 'success'); setTimeout(() => window.location.reload(), 500); }"
                >
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Class</label>
                        <select 
                            name="classId" 
                            id="class-select"
                            class="form-select"
                            required
                            hx-get="/activity/load-fields"
                            hx-trigger="change"
                            hx-target="#activity-fields"
                            hx-swap="outerHTML"
                        >
                            ${classes.map((cls) => `<option value="${cls.id}" ${cls.id === activity.classId ? "selected" : ""}>${cls.name}</option>`).join("")}
                        </select>
                    </div>

                    <div id="activity-fields">
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select name="categoryId" class="form-select" required>
                                ${categories
                                  .map(
                                    (c) => `
                                <option value="${c.id}" ${c.id === activity.categoryId ? "selected" : ""}>
                                        ${c.name}
                                </option>
                                `,
                                  )
                                  .join("")}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Punch In Time</label>
                        <input 
                            type="datetime-local" 
                            name="startTime" 
                            class="form-input" 
                            value="${toDatetimeLocal(activity.startTime)}" 
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Punch Out Time <span style="font-weight: normal; color: var(--color-text-muted);">(optional)</span></label>
                        <input 
                            type="datetime-local" 
                            name="endTime" 
                            class="form-input" 
                            value="${activity.endTime ? toDatetimeLocal(activity.endTime) : ""}"
                        >
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('activity-modal'); document.getElementById('modal-container').innerHTML = '';">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-check"></i> Save Changes
                    </button>
                </div>
                </form>
            </div>
        </div>
    `;
}

/**
 * Enable the activity fields once a class has been selected.
 *
 * @param {Object[]} categories - List of category objects for the selected class.
 * @param {string} categories[].id - Category ID.
 * @param {string} categories[].name - Category name.
 * @returns {string} HTML string enabling form fields.
 */
export function enableActivityFields(categories) {
  return `
        <div id="activity-fields">
            <div class="form-group">
                <label class="form-label">Category</label>
                <select name="categoryId" class="form-select" required>
                    <option value="">-- Select a category --</option>
                    ${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Punch In Time</label>
                <input 
                    type="datetime-local" 
                    name="startTime" 
                    class="form-input" 
                    required 
                    value="${new Date().toISOString().slice(0, 16)}"
                >
            </div>

            <div class="form-group">
                <label class="form-label">Punch Out Time <span style="font-weight: normal; color: var(--color-text-muted);">(optional)</span></label>
                <input 
                    type="datetime-local" 
                    name="endTime" 
                    class="form-input"
                >
            </div>
        </div>
        <script>
          // Trigger form validation after fields are enabled
          setTimeout(function() {
            if (typeof setupActivityFormValidation === 'function') {
              setupActivityFormValidation();
            } else {
              // Fallback: direct validation
              const form = document.querySelector('#activity-modal form');
              const saveBtn = document.getElementById('save-btn');
              if (form && saveBtn) {
                function validateForm() {
                  const classSelect = document.getElementById('class-select');
                  const categorySelect = form.querySelector('select[name="categoryId"]');
                  const startTimeInput = form.querySelector('input[name="startTime"]');
                  
                  const hasClass = classSelect && classSelect.value !== '';
                  const hasCategory = categorySelect && categorySelect.value !== '' && !categorySelect.disabled;
                  const hasStartTime = startTimeInput && startTimeInput.value !== '' && !startTimeInput.disabled;
                  
                  const isValid = hasClass && hasCategory && hasStartTime;
                  saveBtn.disabled = !isValid;
                }
                
                form.addEventListener('change', validateForm);
                form.addEventListener('input', validateForm);
                validateForm();
              }
            }
          }, 50);
        </script>
    `;
}

/**
 * Refresh the category dropdown when the class changes.
 *
 * @param {Object[]} categories - List of categories available for the new class.
 * @param {string} categoryId - ID of the category that should be selected.
 * @returns {string} HTML string with updated category options.
 */
export function refreshCategories(categories, categoryId) {
  return `
    <div id="activity-fields">
        <label>Category:</label>
        <select name="categoryId" required>
            ${categories
              .map(
                (c) => `
            <option value="${c.id}" ${c.id === categoryId ? "selected" : ""}>
                    ${c.name}
            </option>
            `,
              )
              .join("")}
        </select>
    </div>
    `;
}

/**
 * Convert a Date or date string into a YYYY-MM-DDTHH:mm formatted local datetime value.
 *
 * @param {Date|string} date - The date to convert.
 * @returns {string} A formatted datetime-local value (YYYY-MM-DDTHH:mm).
 */
function toDatetimeLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
