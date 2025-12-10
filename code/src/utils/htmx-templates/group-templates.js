/**
 * HTMX Templates for Group Management
 *
 * Renders modals and UI components for group CRUD operations.
 *
 * code/src/utils/htmx-templates/group-templates.js
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Render create group modal
 * @param {string} classId - Class ID
 * @param {Array} students - Array of student objects
 * @param {Array} tas - Array of TA objects for supervisor selection
 * @returns {string} HTML string
 */
export function renderCreateGroupModal(classId, students = [], tas = []) {
  const studentCheckboxes = students
    .map(
      (s) => `
      <label class="member-checkbox" style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); border-radius: var(--radius-sm); cursor: pointer; transition: background 0.2s;">
        <input type="checkbox" name="members" value="${s.user.id}" style="width: 16px; height: 16px;">
        <span style="flex: 1;">${escapeHtml(s.user.preferredName || s.user.name)}</span>
        <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHtml(s.user.email)}</span>
      </label>
    `
    )
    .join("");

  const taCheckboxes = tas
    .map(
      (t) => `
      <label class="supervisor-checkbox" style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); border-radius: var(--radius-sm); cursor: pointer; transition: background 0.2s;">
        <input type="checkbox" name="supervisors" value="${t.user.id}" style="width: 16px; height: 16px;">
        <span style="flex: 1;">${escapeHtml(t.user.preferredName || t.user.name)}</span>
        <span style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHtml(t.user.email)}</span>
      </label>
    `
    )
    .join("");

  return `
    <div id="modal-create-group" class="modal-overlay open" style="display: flex;">
      <div class="modal-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">Create New Group</h3>
          <button class="btn-close" onclick="window.closeModal('modal-create-group')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-post="/groups" 
          hx-target="#tab-content"
          hx-swap="innerHTML"
          hx-headers='{"Accept": "text/html"}'
        >
          <input type="hidden" name="classId" value="${classId}">
          <div class="modal-body">
            <!-- Group Info Section -->
            <div style="margin-bottom: var(--space-6);">
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-users" style="margin-right: var(--space-2);"></i>
                Group Information
              </h4>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Group Name <span style="color: var(--color-status-error);">*</span></label>
                <input type="text" name="name" class="form-input" placeholder="e.g. Team Alpha" required>
              </div>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Logo URL</label>
                <input type="url" name="logoUrl" class="form-input" placeholder="https://example.com/logo.png">
              </div>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Mantra</label>
                <input type="text" name="mantra" class="form-input" placeholder="Our team motto...">
              </div>
              <div class="form-group">
                <label class="form-label">GitHub URL</label>
                <input type="url" name="github" class="form-input" placeholder="https://github.com/team-repo">
              </div>
            </div>

            <!-- Member Selection Section -->
            ${
              students.length > 0
                ? `
            <div style="margin-bottom: var(--space-6);">
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-user-plus" style="margin-right: var(--space-2);"></i>
                Select Members
              </h4>
              <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); padding: var(--space-2);">
                ${studentCheckboxes}
              </div>
              <p class="form-helper" style="margin-top: var(--space-2); font-size: var(--text-xs);">
                Select students to add to this group. You can add more members later.
              </p>
            </div>
            `
                : ""
            }

            <!-- Leader Selection Section -->
            <div style="margin-bottom: var(--space-6);">
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-crown" style="margin-right: var(--space-2); color: var(--color-accent-gold);"></i>
                Designate Leader(s)
              </h4>
              <div id="leader-selection" style="border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); padding: var(--space-4); min-height: 60px;">
                <p style="color: var(--color-text-muted); font-size: var(--text-sm);">
                  Select members above first, then you can designate leaders here.
                </p>
              </div>
            </div>

            <!-- Supervisor Selection Section -->
            ${
              tas.length > 0
                ? `
            <div>
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-chalkboard-user" style="margin-right: var(--space-2);"></i>
                Assign Supervisors (TAs)
              </h4>
              <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); padding: var(--space-2);">
                ${taCheckboxes}
              </div>
            </div>
            `
                : ""
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="window.closeModal('modal-create-group')">Cancel</button>
            <button type="submit" class="btn btn--primary">
              <i class="fa-solid fa-plus"></i> Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
    <script>
      (function() {
        // Track selected members for leader selection
        const memberCheckboxes = document.querySelectorAll('input[name="members"]');
        const leaderSelection = document.getElementById('leader-selection');
        
        function updateLeaderSelection() {
          const selectedMembers = [];
          memberCheckboxes.forEach(cb => {
            if (cb.checked) {
              const label = cb.closest('label');
              const name = label.querySelector('span').textContent;
              selectedMembers.push({ id: cb.value, name: name });
            }
          });
          
          if (selectedMembers.length === 0) {
            leaderSelection.innerHTML = '<p style="color: var(--color-text-muted); font-size: var(--text-sm);">Select members above first, then you can designate leaders here.</p>';
          } else {
            leaderSelection.innerHTML = selectedMembers.map(m => 
              '<label style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); border-radius: var(--radius-sm); cursor: pointer;">' +
              '<input type="checkbox" name="leaders" value="' + m.id + '" style="width: 16px; height: 16px;">' +
              '<span>' + m.name + '</span>' +
              '<span style="font-size: var(--text-xs); color: var(--color-accent-gold);"><i class="fa-solid fa-crown"></i></span>' +
              '</label>'
            ).join('');
          }
        }
        
        memberCheckboxes.forEach(cb => {
          cb.addEventListener('change', updateLeaderSelection);
        });
        
        // Hover effects for checkboxes
        document.querySelectorAll('.member-checkbox, .supervisor-checkbox').forEach(label => {
          label.addEventListener('mouseenter', function() {
            this.style.background = 'var(--color-bg-canvas)';
          });
          label.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
          });
        });

        // Close modal on successful submission and refresh Groups tab
        // Close modal on successful submission
        document.body.addEventListener('htmx:afterRequest', function(event) {
          if (event.detail.pathInfo?.requestPath === '/groups' && event.detail.successful) {
            window.closeModal('modal-create-group');
            if (typeof showToast !== 'undefined') {
              showToast('Success', 'Group created successfully!', 'success');
            }
            
            // Refresh the Groups tab content to show the new group
            if (typeof htmx !== 'undefined') {
              htmx.ajax('GET', '/classes/${classId}/groups', {
                target: '#tab-content',
                swap: 'innerHTML'
              });
            }
          }
        });
      })();
    </script>
  `;
}

/**
 * Render edit group modal
 * @param {Object} group - Group object with members and supervisors
 * @param {Object} permissions - User's permissions for this group
 * @param {Array} students - Available students in the class
 * @param {Array} tas - Available TAs in the class
 * @returns {string} HTML string
 */
export function renderEditGroupModal(group, permissions) {
  const { canEditMembers } = permissions;

  return `
    <div id="modal-edit-group" class="modal-overlay open" style="display: flex;">
      <div class="modal-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Group: ${escapeHtml(group.name)}</h3>
          <button class="btn-close" onclick="window.closeModal('modal-edit-group')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-put="/groups/${group.id}" 
          hx-target="#tab-content"
          hx-swap="innerHTML"
          hx-headers='{"Accept": "text/html"}'
        >
          <div class="modal-body">
            <!-- Group Info Section -->
            <div style="margin-bottom: var(--space-6);">
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-pen" style="margin-right: var(--space-2);"></i>
                Group Information
              </h4>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Group Name <span style="color: var(--color-status-error);">*</span></label>
                <input type="text" name="name" class="form-input" value="${escapeHtml(group.name)}" required>
              </div>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Logo URL</label>
                <input type="url" name="logoUrl" class="form-input" value="${escapeHtml(group.logoUrl || "")}" placeholder="https://example.com/logo.png">
              </div>
              <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label">Mantra</label>
                <input type="text" name="mantra" class="form-input" value="${escapeHtml(group.mantra || "")}" placeholder="Our team motto...">
              </div>
              <div class="form-group">
                <label class="form-label">GitHub URL</label>
                <input type="url" name="github" class="form-input" value="${escapeHtml(group.github || "")}" placeholder="https://github.com/team-repo">
              </div>
            </div>

            <!-- Current Members (Read-only for leaders) -->
            ${
              !canEditMembers
                ? `
            <div style="margin-bottom: var(--space-6);">
              <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
                <i class="fa-solid fa-users" style="margin-right: var(--space-2);"></i>
                Current Members
              </h4>
              <div style="border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); padding: var(--space-3);">
                ${group.members
                  .map(
                    (m) => `
                  <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2);">
                    <span style="flex: 1;">${escapeHtml(m.user.preferredName || m.user.name)}</span>
                    ${m.role === "LEADER" ? '<span style="font-size: var(--text-xs); color: var(--color-accent-gold);"><i class="fa-solid fa-crown"></i> Leader</span>' : ""}
                  </div>
                `
                  )
                  .join("")}
              </div>
              <p class="form-helper" style="margin-top: var(--space-2); font-size: var(--text-xs); color: var(--color-text-muted);">
                <i class="fa-solid fa-info-circle"></i> Only instructors can modify group members.
              </p>
            </div>
            `
                : ""
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="window.closeModal('modal-edit-group')">Cancel</button>
            <button type="submit" class="btn btn--primary">
              <i class="fa-solid fa-save"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
    <script>
      (function() {
        document.body.addEventListener('htmx:afterRequest', function(event) {
          if (event.detail.pathInfo?.requestPath?.startsWith('/groups/') && 
              event.detail.pathInfo?.requestPath?.indexOf('/members') === -1 &&
              event.detail.successful) {
            window.closeModal('modal-edit-group');
            if (typeof showToast !== 'undefined') {
              showToast('Success', 'Group updated successfully!', 'success');
            }
            
            // Refresh the Groups tab content to show the updated group
            if (typeof htmx !== 'undefined') {
              const classId = '${group.classId}';
              htmx.ajax('GET', '/classes/' + classId + '/groups', {
                target: '#tab-content',
                swap: 'innerHTML'
              });
            }
          }
        });
      })();
    </script>
  `;
}

/**
 * Render delete group confirmation modal
 * @param {Object} group - Group object
 * @returns {string} HTML string
 */
export function renderDeleteGroupConfirmation(group) {
  return `
    <div id="modal-delete-group" class="modal-overlay open" style="display: flex;">
      <div class="modal-card" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--color-status-error);">
            <i class="fa-solid fa-triangle-exclamation"></i> Delete Group
          </h3>
          <button class="btn-close" onclick="window.closeModal('modal-delete-group')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: var(--space-4);">
            Are you sure you want to delete the group <strong>${escapeHtml(group.name)}</strong>?
          </p>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
            <p style="color: #991B1B; font-size: var(--text-sm); margin: 0;">
              <i class="fa-solid fa-exclamation-circle"></i>
              <strong>Warning:</strong> This action cannot be undone. All group data including member assignments and supervisor assignments will be permanently deleted.
            </p>
          </div>
          <p style="font-size: var(--text-sm); color: var(--color-text-muted);">
            ${group.members?.length || 0} member(s) will be removed from this group.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn--secondary" onclick="window.closeModal('modal-delete-group')">Cancel</button>
          <button 
            type="button" 
            class="btn" 
            style="background: var(--color-status-error); color: white;"
            hx-delete="/groups/${group.id}"
            hx-target="#tab-content"
            hx-swap="innerHTML"
            hx-headers='{"Accept": "text/html"}'
          >
            <i class="fa-solid fa-trash"></i> Delete Group
          </button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        document.body.addEventListener('htmx:afterRequest', function(event) {
          if (event.detail.pathInfo?.requestPath === '/groups/${group.id}' && 
              event.detail.requestConfig?.verb === 'delete' &&
              event.detail.successful) {
            window.closeModal('modal-delete-group');
            if (typeof showToast !== 'undefined') {
              showToast('Success', 'Group deleted successfully!', 'success');
            }
            
            // Refresh the Groups tab content to remove the deleted group
            if (typeof htmx !== 'undefined') {
              const classId = '${group.classId}';
              htmx.ajax('GET', '/classes/' + classId + '/groups', {
                target: '#tab-content',
                swap: 'innerHTML'
              });
            }
          }
        });
      })();
    </script>
  `;
}

/**
 * Render group management modal (full member/supervisor management)
 * @param {Object} group - Group object with all relations
 * @param {Array} classMembers - All students in the class
 * @param {Array} classTAs - All TAs in the class
 * @param {Object} permissions - User's permissions
 * @returns {string} HTML string
 */
export function renderGroupManagementModal(
  group,
  classMembers,
  classTAs,
  permissions
) {
  const { isProf } = permissions;

  // Get current member and supervisor IDs
  const currentMemberIds = new Set(group.members.map((m) => m.userId));
  const currentSupervisorIds = new Set(group.supervisors.map((s) => s.userId));

  // Available students (not yet in this group)
  const availableStudents = classMembers.filter(
    (s) => !currentMemberIds.has(s.user.id)
  );

  // Available TAs (not yet supervisors)
  const availableTAs = classTAs.filter(
    (t) => !currentSupervisorIds.has(t.user.id)
  );

  return `
    <div id="modal-manage-group" class="modal-overlay open" style="display: flex;">
      <div class="modal-card" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fa-solid fa-users-gear"></i> Manage: ${escapeHtml(group.name)}
          </h3>
          <button class="btn-close" onclick="window.closeModal('modal-manage-group')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Current Members Section -->
          <div style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
              <i class="fa-solid fa-users" style="margin-right: var(--space-2);"></i>
              Current Members (${group.members.length})
            </h4>
            <div style="border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); overflow: hidden;">
              ${
                group.members.length > 0
                  ? group.members
                      .map(
                        (m) => `
                <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-bg-canvas);" class="member-row">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-bg-canvas); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: var(--text-sm);">
                    ${escapeHtml((m.user.preferredName || m.user.name).charAt(0).toUpperCase())}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: var(--weight-medium);">${escapeHtml(m.user.preferredName || m.user.name)}</div>
                    <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHtml(m.user.email)}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                    ${
                      m.role === "LEADER"
                        ? `
                      <span style="background: #FEF3C7; color: #D97706; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: bold;">
                        <i class="fa-solid fa-crown"></i> Leader
                      </span>
                      <button 
                        class="btn btn--secondary" 
                        style="padding: 4px 8px; font-size: var(--text-xs);"
                        hx-put="/groups/${group.id}/members/${m.userId}/role"
                        hx-vals='{"role": "MEMBER"}'
                        hx-target="#modal-container"
                        hx-swap="innerHTML"
                        title="Demote to Member"
                      >
                        <i class="fa-solid fa-arrow-down"></i>
                      </button>
                    `
                        : `
                      <span style="background: var(--color-bg-canvas); color: var(--color-text-muted); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs);">
                        Member
                      </span>
                      <button 
                        class="btn btn--secondary" 
                        style="padding: 4px 8px; font-size: var(--text-xs);"
                        hx-put="/groups/${group.id}/members/${m.userId}/role"
                        hx-vals='{"role": "LEADER"}'
                        hx-target="#modal-container"
                        hx-swap="innerHTML"
                        title="Promote to Leader"
                      >
                        <i class="fa-solid fa-crown" style="color: var(--color-accent-gold);"></i>
                      </button>
                    `
                    }
                    <button 
                      class="btn btn--secondary" 
                      style="padding: 4px 8px; font-size: var(--text-xs); color: var(--color-status-error);"
                      hx-delete="/groups/${group.id}/members/${m.userId}"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      hx-confirm="Remove ${escapeHtml(m.user.preferredName || m.user.name)} from this group?"
                      title="Remove from group"
                    >
                      <i class="fa-solid fa-user-minus"></i>
                    </button>
                  </div>
                </div>
              `
                      )
                      .join("")
                  : `
                <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">
                  <i class="fa-solid fa-users-slash" style="font-size: 24px; margin-bottom: var(--space-2);"></i>
                  <p>No members in this group yet.</p>
                </div>
              `
              }
            </div>
          </div>

          <!-- Add Members Section -->
          <div style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
              <i class="fa-solid fa-user-plus" style="margin-right: var(--space-2);"></i>
              Add Members
            </h4>
            ${
              availableStudents.length > 0
                ? `
            <form 
              id="add-member-form"
              hx-post="/groups/${group.id}/members"
              hx-target="#modal-container"
              hx-swap="innerHTML"
            >
              <div style="display: flex; gap: var(--space-2);">
                <select name="userId" class="form-select" style="flex: 1;" required>
                  <option value="">Select a student...</option>
                  ${availableStudents.map((s) => `<option value="${s.user.id}">${escapeHtml(s.user.preferredName || s.user.name)} (${escapeHtml(s.user.email)})</option>`).join("")}
                </select>
                <select name="role" class="form-select" style="width: 120px;">
                  <option value="MEMBER">Member</option>
                  <option value="LEADER">Leader</option>
                </select>
                <button type="submit" class="btn btn--primary">
                  <i class="fa-solid fa-plus"></i> Add
                </button>
              </div>
            </form>
            `
                : `
            <div style="padding: var(--space-4); background: var(--color-bg-canvas); border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted);">
              <i class="fa-solid fa-user-slash" style="font-size: 20px; margin-bottom: var(--space-2);"></i>
              <p style="margin-bottom: var(--space-1);">No students available to add.</p>
              <p style="font-size: var(--text-xs);">
                ${classMembers.length === 0 ? "Add students to the class first, then you can assign them to groups." : "All students in this class are already members of this group."}
              </p>
            </div>
            `
            }
          </div>

          <!-- Supervisors Section -->
          <div style="margin-bottom: var(--space-6);">
            <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
              <i class="fa-solid fa-chalkboard-user" style="margin-right: var(--space-2);"></i>
              Supervisors (TAs) (${group.supervisors.length})
            </h4>
            <div style="border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); overflow: hidden;">
              ${
                group.supervisors.length > 0
                  ? group.supervisors
                      .map(
                        (s) => `
                <div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-bg-canvas);">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: var(--text-sm);">
                    ${escapeHtml((s.user.preferredName || s.user.name).charAt(0).toUpperCase())}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: var(--weight-medium);">${escapeHtml(s.user.preferredName || s.user.name)}</div>
                    <div style="font-size: var(--text-xs); color: var(--color-text-muted);">${escapeHtml(s.user.email)}</div>
                  </div>
                  ${
                    isProf
                      ? `
                    <button 
                      class="btn btn--secondary" 
                      style="padding: 4px 8px; font-size: var(--text-xs); color: var(--color-status-error);"
                      hx-delete="/groups/${group.id}/supervisors/${s.userId}"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      hx-confirm="Remove ${escapeHtml(s.user.preferredName || s.user.name)} as supervisor?"
                      title="Remove supervisor"
                    >
                      <i class="fa-solid fa-user-minus"></i>
                    </button>
                  `
                      : ""
                  }
                </div>
              `
                      )
                      .join("")
                  : `
                <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">
                  <i class="fa-solid fa-user-tie" style="font-size: 24px; margin-bottom: var(--space-2);"></i>
                  <p>No supervisors assigned yet.</p>
                </div>
              `
              }
            </div>
          </div>

          <!-- Add Supervisor Section (Professors only) -->
          ${
            isProf
              ? `
          <div>
            <h4 style="font-size: var(--text-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-4); color: var(--color-text-main);">
              <i class="fa-solid fa-user-tie" style="margin-right: var(--space-2);"></i>
              Add Supervisor
            </h4>
            ${
              availableTAs.length > 0
                ? `
            <form 
              id="add-supervisor-form"
              hx-post="/groups/${group.id}/supervisors"
              hx-target="#modal-container"
              hx-swap="innerHTML"
            >
              <div style="display: flex; gap: var(--space-2);">
                <select name="userId" class="form-select" style="flex: 1;" required>
                  <option value="">Select a TA...</option>
                  ${availableTAs.map((t) => `<option value="${t.user.id}">${escapeHtml(t.user.preferredName || t.user.name)} (${escapeHtml(t.user.email)})</option>`).join("")}
                </select>
                <button type="submit" class="btn btn--primary">
                  <i class="fa-solid fa-plus"></i> Add
                </button>
              </div>
            </form>
            `
                : `
            <div style="padding: var(--space-4); background: var(--color-bg-canvas); border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted);">
              <i class="fa-solid fa-chalkboard" style="font-size: 20px; margin-bottom: var(--space-2);"></i>
              <p style="margin-bottom: var(--space-1);">No TAs available to add as supervisors.</p>
              <p style="font-size: var(--text-xs);">
                ${classTAs.length === 0 ? "Add TAs to the class first to assign them as group supervisors." : "All TAs in this class are already supervisors of this group."}
              </p>
            </div>
            `
            }
          </div>
          `
              : ""
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn--secondary" onclick="window.closeModal('modal-manage-group')">Close</button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        // Show toast and refresh Groups tab on successful operations
        // Show toast on successful operations
        document.body.addEventListener('htmx:afterRequest', function(event) {
          const path = event.detail.pathInfo?.requestPath || '';
          if (path.includes('/groups/') && event.detail.successful) {
            if (path.includes('/members') || path.includes('/supervisors')) {
              if (typeof showToast !== 'undefined') {
                const verb = event.detail.requestConfig?.verb;
                if (verb === 'post') {
                  showToast('Success', 'Added successfully!', 'success');
                } else if (verb === 'delete') {
                  showToast('Success', 'Removed successfully!', 'success');
                } else if (verb === 'put') {
                  showToast('Success', 'Role updated successfully!', 'success');
                }
              }
              
              // Refresh the Groups tab content in the background
              const classId = path.split('/groups/')[0].split('/').pop();
              if (classId && typeof htmx !== 'undefined') {
                // Trigger a background refresh of the Groups tab
                htmx.ajax('GET', '/classes/' + classId + '/groups', {
                  target: '#tab-content',
                  swap: 'innerHTML'
                });
              }
            }
          }
        });
      })();
    </script>
  `;
}

/**
 * Render a single group card for the directory
 * @param {Object} group - Group object
 * @param {Object} permissions - User's permissions
 * @param {string} classId - Class ID
 * @returns {string} HTML string
 */
export function renderGroupCard(group, permissions) {
  const { canEdit, canEditMembers, canDelete } = permissions;

  return `
    <div class="group-section" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); box-shadow: var(--shadow-sm);">
      <div class="group-header" style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-bg-canvas);">
        ${
          group.logoUrl
            ? `<img src="${escapeHtml(group.logoUrl)}" alt="${escapeHtml(group.name)}" style="width: 40px; height: 40px; border-radius: var(--radius-md); object-fit: cover;">`
            : `<div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(group.name.charAt(0).toUpperCase())}</div>`
        }
        <div style="flex: 1;">
          <div class="group-name" style="font-weight: var(--weight-bold); font-size: var(--text-lg);">${escapeHtml(group.name)}</div>
          ${group.mantra ? `<div style="font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic;">"${escapeHtml(group.mantra)}"</div>` : ""}
        </div>
        <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${group.members.length} members</span>
        
        <!-- Action Buttons -->
        ${
          canEdit || canEditMembers || canDelete
            ? `
        <div class="group-actions" style="display: flex; gap: var(--space-2);">
          ${
            group.github
              ? `
            <a href="${escapeHtml(group.github)}" target="_blank" class="btn btn--secondary" style="padding: 6px 10px;" title="View GitHub">
              <i class="fa-brands fa-github"></i>
            </a>
          `
              : ""
          }
          ${
            canEdit
              ? `
            <button 
              class="btn btn--secondary" 
              style="padding: 6px 10px;"
              hx-get="/groups/${group.id}/edit-modal"
              hx-target="#modal-container"
              hx-swap="innerHTML"
              title="Edit group"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
          `
              : ""
          }
          ${
            canEditMembers
              ? `
            <button 
              class="btn btn--secondary" 
              style="padding: 6px 10px;"
              hx-get="/groups/${group.id}/manage"
              hx-target="#modal-container"
              hx-swap="innerHTML"
              title="Manage members"
            >
              <i class="fa-solid fa-users-gear"></i>
            </button>
          `
              : ""
          }
          ${
            canDelete
              ? `
            <button 
              class="btn btn--secondary" 
              style="padding: 6px 10px; color: var(--color-status-error);"
              hx-get="/groups/${group.id}/delete-modal"
              hx-target="#modal-container"
              hx-swap="innerHTML"
              title="Delete group"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
        `
            : ""
        }
      </div>
      
      <!-- Supervisors -->
      ${
        group.supervisors.length > 0
          ? `
      <div style="margin-bottom: var(--space-3);">
        <span style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Supervisors:</span>
        <span style="font-size: var(--text-sm); margin-left: var(--space-2);">
          ${group.supervisors.map((s) => escapeHtml(s.user.preferredName || s.user.name)).join(", ")}
        </span>
      </div>
      `
          : ""
      }
      
      <!-- Members Grid -->
      <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--space-3);">
        ${group.members
          .map((member) => {
            const initials = (member.user.preferredName || member.user.name)
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return `
            <div class="member-card" style="background: var(--color-bg-canvas); border-radius: var(--radius-sm); padding: var(--space-3); display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: ${member.role === "LEADER" ? "#FEF3C7" : "var(--color-bg-surface)"}; color: ${member.role === "LEADER" ? "#D97706" : "var(--color-text-muted)"}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: var(--text-sm);">
                ${escapeHtml(initials)}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: var(--weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(member.user.preferredName || member.user.name)}
                  ${member.role === "LEADER" ? '<i class="fa-solid fa-crown" style="color: #D97706; margin-left: 4px;" title="Group Leader"></i>' : ""}
                </div>
                <div style="font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(member.user.email)}
                </div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Render success message after group operation
 * @param {string} message - Success message
 * @param {string} classId - Class ID for refresh
 * @returns {string} HTML string
 */
export function renderGroupSuccess(message, classId) {
  return `
    <div style="text-align: center; padding: var(--space-6);">
      <div style="font-size: 48px; margin-bottom: var(--space-4); color: var(--color-status-success);">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h4 style="margin-bottom: var(--space-2);">${escapeHtml(message)}</h4>
      <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">The page will refresh automatically.</p>
    </div>
    <script>
      setTimeout(function() {
        htmx.ajax('GET', '/classes/${classId}/directory', {target: '#tab-content', swap: 'innerHTML'});
      }, 1000);
    </script>
  `;
}

/**
 * Render error message
 * @param {string} message - Error message
 * @returns {string} HTML string
 */
export function renderGroupError(message) {
  return `
    <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: var(--space-4); margin: var(--space-4);">
      <p style="color: #991B1B; margin: 0;">
        <i class="fa-solid fa-exclamation-circle"></i>
        <strong>Error:</strong> ${escapeHtml(message)}
      </p>
    </div>
  `;
}
