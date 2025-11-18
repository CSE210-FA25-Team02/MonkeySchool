// HTMX Templates for Groups
// code/src/utils/htmx-templates/groups-templates.js

import { escapeHtml, createBaseLayout } from "../html-templates.js";

/**
 * Render groups list page for students
 */
export function renderGroupsList(groups, user) {
  if (!groups || groups.length === 0) {
    return `
      <section class="group-list" role="region" aria-labelledby="groups-title">
        <div class="group-list__header">
          <h2 id="groups-title" class="group-list__title">My Groups</h2>
        </div>
        <div class="group-list__empty">
          <div class="group-list__empty-icon" aria-hidden="true"></div>
          <h3 class="group-list__empty-title">No Groups Found</h3>
          <p class="group-list__empty-message">
            You are not assigned to any groups yet.<br>
            Contact your TA or instructor to be assigned to a group.
          </p>
        </div>
      </section>
    `;
  }

  const groupCards = groups.map(group => {
    const roleClass = group.userRole?.toLowerCase() || "member";
    const isLeader = group.userRole === "LEADER" || group.leaderId === user?.id;

    return `
      <article class="group-card" role="article">
        <div class="group-card__sidebar">
          <div class="group-card__icon" aria-hidden="true"></div>
        </div>
        
        <div class="group-card__content">
          <div class="group-card__header">
            <div>
              <h3 class="group-card__title">${escapeHtml(group.name)}</h3>
              ${group.description ? `<p class="group-card__description">${escapeHtml(group.description)}</p>` : ""}
              ${group.class ? `<p class="group-card__class">Class: ${escapeHtml(group.class.name)}</p>` : ""}
            </div>
            ${isLeader ? `
              <span class="group-card__role group-card__role--leader" 
                    role="status"
                    aria-label="Your role: Team Leader">
                Team Leader
              </span>
            ` : `
              <span class="group-card__role group-card__role--member" 
                    role="status"
                    aria-label="Your role: Member">
                Member
              </span>
            `}
          </div>
          
          <div class="group-card__body">
            <div class="group-card__info">
              <div class="group-card__info-item">
                <span class="group-card__info-label">Members:</span>
                <span class="group-card__info-value">${group.members?.length || 0}</span>
              </div>
              ${group.leader ? `
                <div class="group-card__info-item">
                  <span class="group-card__info-label">Leader:</span>
                  <span class="group-card__info-value">${escapeHtml(group.leader.name)}</span>
                </div>
              ` : ""}
            </div>
          </div>
          
          <div class="group-card__footer">
            <a href="/groups/${group.id}" 
               class="group-card__link"
               hx-get="/api/groups/${group.id}"
               hx-target="#main-content"
               hx-push-url="true"
               hx-indicator="#loading"
               aria-label="View details for ${escapeHtml(group.name)}">
              View Details
            </a>
            ${isLeader ? `
              <a href="/groups/${group.id}/edit" 
                 class="group-card__link group-card__link--secondary"
                 hx-get="/api/groups/${group.id}/edit"
                 hx-target="#main-content"
                 hx-push-url="true"
                 hx-indicator="#loading"
                 aria-label="Edit ${escapeHtml(group.name)}">
                Edit
              </a>
            ` : ""}
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="group-list" role="region" aria-labelledby="groups-title">
      <div class="group-list__header">
        <h2 id="groups-title" class="group-list__title">My Groups</h2>
        <p class="group-list__count">${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</p>
      </div>
      
      <div class="group-cards">
        ${groupCards}
      </div>
    </section>
  `;
}

/**
 * Render group detail page
 */
export function renderGroupDetail(group, user) {
  if (!group) {
    return `
      <section class="group-detail" role="region">
        <div class="group-detail__error">
          <h2>Group Not Found</h2>
          <p>The group you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </section>
    `;
  }

  const isLeader = group.leaderId === user?.id;
  const isSupervisor = group.supervisors?.some(s => s.userId === user?.id);
  const isMember = group.members?.some(m => m.userId === user?.id);
  const canEdit = isLeader || isSupervisor;

  const members = group.members || [];
  const leader = members.find(m => m.role === "LEADER");
  const regularMembers = members.filter(m => m.role === "MEMBER");

  return `
    <section class="group-detail" role="region" aria-labelledby="group-detail-title">
      <div class="group-detail__header">
        <div class="group-detail__title-section">
          <h2 id="group-detail-title" class="group-detail__title">${escapeHtml(group.name)}</h2>
          ${group.description ? `<p class="group-detail__description">${escapeHtml(group.description)}</p>` : ""}
          ${group.class ? `<p class="group-detail__class">Class: ${escapeHtml(group.class.name)}</p>` : ""}
        </div>
        ${canEdit ? `
          <div class="group-detail__actions">
            <a href="/groups/${group.id}/edit" 
               class="btn btn--primary"
               hx-get="/api/groups/${group.id}/edit"
               hx-target="#main-content"
               hx-push-url="true"
               hx-indicator="#loading">
              Edit Group
            </a>
          </div>
        ` : ""}
      </div>

      <div class="group-detail__content">
        <div class="group-detail__section">
          <h3 class="group-detail__section-title">Members</h3>
          <div class="group-detail__members">
            ${leader ? `
              <div class="group-member group-member--leader">
                <div class="group-member__info">
                  <span class="group-member__name">${escapeHtml(leader.user.name)}</span>
                  <span class="group-member__role">Team Leader</span>
                </div>
                ${leader.user.email ? `<span class="group-member__email">${escapeHtml(leader.user.email)}</span>` : ""}
              </div>
            ` : ""}
            ${regularMembers.map(member => `
              <div class="group-member">
                <div class="group-member__info">
                  <span class="group-member__name">${escapeHtml(member.user.name)}</span>
                  <span class="group-member__role">Member</span>
                </div>
                ${member.user.email ? `<span class="group-member__email">${escapeHtml(member.user.email)}</span>` : ""}
              </div>
            `).join('')}
            ${members.length === 0 ? `
              <p class="group-detail__empty">No members assigned to this group.</p>
            ` : ""}
          </div>
        </div>

        ${group.notes && (isLeader || isSupervisor) ? `
          <div class="group-detail__section">
            <h3 class="group-detail__section-title">Internal Notes</h3>
            <div class="group-detail__notes">
              <p>${escapeHtml(group.notes)}</p>
            </div>
          </div>
        ` : ""}

        ${group.github ? `
          <div class="group-detail__section">
            <h3 class="group-detail__section-title">GitHub</h3>
            <p>
              <a href="${escapeHtml(group.github)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(group.github)}
              </a>
            </p>
          </div>
        ` : ""}
      </div>
    </section>
  `;
}

/**
 * Render group editor form
 */
export function renderGroupForm(group, classId, user, isEdit = false) {
  const isSupervisor = group?.supervisors?.some(s => s.userId === user?.id);
  const isLeader = group?.leaderId === user?.id;
  // Check if user is TA or PROFESSOR in the class
  const isClassTA = group?.class?.members?.some(
    m => m.userId === user?.id && (m.role === "TA" || m.role === "PROFESSOR")
  );
  const canEditMembers = isSupervisor || isClassTA; // Only TAs can edit members

  // Get available students from the class for member selection
  const classMembers = group?.class?.members || [];
  const students = classMembers.filter(m => m.role === "STUDENT").map(m => m.user);

  return `
    <section class="group-editor" role="region" aria-labelledby="group-editor-title">
      <h2 id="group-editor-title" class="group-editor__title">
        ${isEdit ? "Edit Group" : "Create New Group"}
      </h2>

      <form class="group-form" 
            hx-${isEdit ? "put" : "post"}="/api/groups${isEdit ? `/${group.id}` : ""}"
            hx-target="#main-content"
            hx-swap="innerHTML"
            novalidate>
        
        <div class="form-group">
          <label for="group-name" class="form-group__label">
            Group Name <span class="required" aria-label="required">*</span>
          </label>
          <input type="text" 
                 id="group-name" 
                 name="name" 
                 class="form-group__input"
                 value="${group?.name || ""}"
                 required
                 aria-required="true"
                 maxlength="255">
        </div>

        <div class="form-group">
          <label for="group-description" class="form-group__label">
            Description
          </label>
          <textarea id="group-description" 
                    name="description" 
                    class="form-group__textarea"
                    rows="3"
                    maxlength="1000">${group?.description || ""}</textarea>
        </div>

        ${canEditMembers ? `
          <div class="form-group">
            <label for="group-leader" class="form-group__label">
              Team Leader
            </label>
            <select id="group-leader" 
                    name="leaderId" 
                    class="form-group__select">
              <option value="">No leader assigned</option>
              ${students.map(student => `
                <option value="${student.id}" ${group?.leaderId === student.id ? "selected" : ""}>
                  ${escapeHtml(student.name)}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ""}

        ${isEdit && (isLeader || isSupervisor) ? `
          <div class="form-group">
            <label for="group-notes" class="form-group__label">
              Internal Notes
            </label>
            <textarea id="group-notes" 
                      name="notes" 
                      class="form-group__textarea"
                      rows="4"
                      maxlength="2000">${group?.notes || ""}</textarea>
            <div class="form-group__help">
              These notes are only visible to TAs and Team Leaders.
            </div>
          </div>
        ` : ""}

        ${canEditMembers ? `
          <div class="form-group">
            <label for="group-members" class="form-group__label">
              Members
            </label>
            <div id="group-members" class="form-group__checkbox-group">
              ${students.map(student => {
                const isSelected = group?.members?.some(m => m.userId === student.id);
                return `
                  <label class="form-group__checkbox-label">
                    <input type="checkbox" 
                           name="memberIds" 
                           value="${student.id}"
                           ${isSelected ? "checked" : ""}>
                    <span>${escapeHtml(student.name)}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        ` : ""}

        ${!isEdit ? `
          <input type="hidden" name="classId" value="${classId || ""}">
        ` : ""}

        <div class="form-actions">
          <button type="submit" class="btn btn--primary">
            ${isEdit ? "Update Group" : "Create Group"}
          </button>
          <button type="button" 
                  class="btn btn--secondary"
                  ${isEdit ? `
                    hx-get="/api/groups/${group.id}"
                    hx-target="#main-content"
                  ` : `
                    hx-get="/api/groups/user/groups"
                    hx-target="#main-content"
                  `}
                  hx-push-url="true">
            Cancel
          </button>
        </div>
      </form>
    </section>
  `;
}

/**
 * Render TA dashboard for managing groups
 */
export function renderTAGroupsDashboard(groups, classId) {
  return `
    <section class="ta-groups-dashboard" role="region" aria-labelledby="ta-groups-title">
      <div class="ta-groups-dashboard__header">
        <h2 id="ta-groups-title" class="ta-groups-dashboard__title">Manage Groups</h2>
        <a href="/groups/new?classId=${classId}" 
           class="btn btn--primary"
           hx-get="/api/groups/new?classId=${classId}"
           hx-target="#main-content"
           hx-push-url="true">
          Create New Group
        </a>
      </div>

      ${groups && groups.length > 0 ? `
        <div class="ta-groups-list">
          ${groups.map(group => `
            <div class="ta-group-card">
              <div class="ta-group-card__header">
                <h3 class="ta-group-card__title">${escapeHtml(group.name)}</h3>
                <div class="ta-group-card__actions">
                  <a href="/groups/${group.id}" 
                     class="btn btn--secondary btn--small"
                     hx-get="/api/groups/${group.id}"
                     hx-target="#main-content"
                     hx-push-url="true">
                    View
                  </a>
                  <a href="/groups/${group.id}/edit" 
                     class="btn btn--secondary btn--small"
                     hx-get="/api/groups/${group.id}/edit"
                     hx-target="#main-content"
                     hx-push-url="true">
                    Edit
                  </a>
                  <button type="button" 
                          class="btn btn--danger btn--small"
                          hx-delete="/api/groups/${group.id}"
                          hx-confirm="Are you sure you want to delete this group?"
                          hx-target="closest .ta-group-card"
                          hx-swap="outerHTML">
                    Delete
                  </button>
                </div>
              </div>
              <div class="ta-group-card__body">
                <p class="ta-group-card__members">${group.members?.length || 0} members</p>
                ${group.leader ? `<p class="ta-group-card__leader">Leader: ${escapeHtml(group.leader.name)}</p>` : ""}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="ta-groups-dashboard__empty">
          <p>No groups have been created yet.</p>
        </div>
      `}
    </section>
  `;
}

