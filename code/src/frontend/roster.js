import { asyncHandler } from "../utils/async-handler.js";

/**
 * Sanitize input to prevent XSS attacks
 * For IDs, only allow alphanumeric characters, hyphens, and underscores
 */
function sanitizeId(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Frontend handler for class roster page
 * Uses the existing API endpoint /api/classRoles/:classId/roster
 */
export const showRosterPage = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  // Import the service to get actual data
  const { createClassRoleService } = await import('../services/classRole.service.js');
  const { prisma } = await import('../lib/prisma.js');
  
  // Get actual roster data server-side
  const classRoleService = createClassRoleService(prisma);
  let rosterData = { data: [], meta: { totalUsers: 0 } };
  
  try {
    const roster = await classRoleService.getRoster(classId);
    rosterData = {
      success: true,
      data: roster,
      meta: {
        classId,
        totalUsers: roster.length,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error loading roster:', error);
  }

  
  function generateCardView(members) {
    // Group by role
    const membersByRole = members.reduce((acc, member) => {
      acc[member.role] = acc[member.role] || [];
      acc[member.role].push(member);
      return acc;
    }, {});
    
    const roleOrder = ['PROFESSOR', 'TA', 'TUTOR', 'STUDENT'];
    
    const sections = roleOrder.map(role => {
      const roleMembers = membersByRole[role] || [];
      if (roleMembers.length === 0) return '';
      
      const rows = roleMembers.map(member => {
        const selectId = 'role-select-' + escapeHtml(member.user.id);
        return `<tr class="roster-member" data-user-id="${escapeHtml(member.user.id)}">
          <td class="roster-name">${escapeHtml(member.user.name)}</td>
          <td class="roster-email">${escapeHtml(member.user.email)}</td>
          <td class="roster-role">
            <select id="${selectId}" class="role-selector" data-user-id="${escapeHtml(member.user.id)}" data-current-role="${escapeHtml(member.role)}">
              <option value="PROFESSOR" ${member.role === 'PROFESSOR' ? 'selected' : ''}>Professor</option>
              <option value="TA" ${member.role === 'TA' ? 'selected' : ''}>Teaching Assistant</option>
              <option value="STUDENT" ${member.role === 'STUDENT' ? 'selected' : ''}>Student</option>
              <option value="TUTOR" ${member.role === 'TUTOR' ? 'selected' : ''}>Tutor</option>
            </select>
          </td>
        </tr>`;
      }).join('');
      
      return `<section class="roster-role-section">
        <h2 class="roster-role-section__title">${role}s (${roleMembers.length})</h2>
        <table class="roster-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody class="roster-role-section__list">
            ${rows}
          </tbody>
        </table>
      </section>`;
    }).filter(Boolean).join('');
    
    return `<div class="roster-cards">${sections}</div>`;
  }
  
  // Create the frontend page shell with actual data

  const rosterPageShell = `
    <link rel="stylesheet" href="/css/roster.css">
    <div class="container">
      <div class="roster-page" aria-labelledby="roster-title">
        <header class="roster-page__header">
          <div class="roster-page__title-section">
            <div class="roster-page__navigation">
              <a href="/courses/list" 
                 class="btn-back"
                 hx-get="/courses/list"
                 hx-target="#main-content"
                 hx-push-url="true">
                <i class="fas fa-arrow-left"></i>
                Back to Courses
              </a>
            </div>
            <h1 id="roster-title" class="roster-page__title">
              <i class="fas fa-users" style="color: var(--color-accent-1); margin-right: var(--spacing-md);"></i>
              Class Roster
              <span class="roster-page__count">(${rosterData.meta.totalUsers} member${rosterData.meta.totalUsers !== 1 ? 's' : ''})</span>
            </h1>
          </div>
          
        </header>
        
        <div id="roster-content" class="roster-content">
          ${rosterData.data.length > 0 ? generateCardView(rosterData.data) : '<p>No members found in this class.</p>'}
        </div>
      </div>
    </div>
  `;
  
  const scripts = `
    <script>
      let currentClassId = '${sanitizeId(classId)}';
      
      // Wait for HTMX content to be fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addRoleUpdateListeners);
      } else {
        addRoleUpdateListeners();
      }
      
      
      function addRoleUpdateListeners() {
        document.querySelectorAll('.role-selector').forEach(select => {
          select.addEventListener('change', function() {
            updateUserRole(this.dataset.userId, this.value, this.dataset.currentRole);
          });
        });
      }
      
      async function updateUserRole(userId, newRole, oldRole) {
        if (newRole === oldRole) return;
        
        try {
          const response = await fetch('/api/classRoles/' + currentClassId + '/roster/' + userId + '/assign', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showSuccess('Role updated successfully');

            // Update the current role data attribute for this selector  
            const selector = document.querySelector('.role-selector[data-user-id="' + userId + '"]');
            if (selector) {
              selector.setAttribute('data-current-role', newRole);
              // Also update the selected option immediately
              selector.value = newRole;
            }

            // Move user immediately (no debounce for successful API calls)
            moveUserToRoleSection(userId, newRole, oldRole);
          } else {
            showError('Failed to update role');
            // Reset selector to original value
            const selector = document.querySelector('.role-selector[data-user-id="' + userId + '"]');
            if (selector) selector.value = oldRole;
          }
        } catch (error) {
          console.error('Error updating role:', error);
          showError('Failed to update role');
          // Reset selector to original value
          const selector = document.querySelector('.role-selector[data-user-id="' + userId + '"]');
          if (selector) selector.value = oldRole;
        }
      }

      function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
      function moveUserToRoleSection(userId, newRole, oldRole) {
        const userRow = document.querySelector('.roster-member[data-user-id="' + userId + '"]');
        if (!userRow) return;
        
        // Find the correct section for the new role
        const roleSections = document.querySelectorAll('.roster-role-section');
        let targetSection = null;
        let sourceSection = null;
        
        roleSections.forEach(section => {
          const title = section.querySelector('.roster-role-section__title').textContent;
          if (title.toLowerCase().includes(newRole.toLowerCase())) {
            targetSection = section;
          }
          if (title.toLowerCase().includes(oldRole.toLowerCase())) {
            sourceSection = section;
          }
        });
        
        if (targetSection && sourceSection) {
          // Remove from old section
          userRow.remove();
          
          // Add to new section
          const targetTable = targetSection.querySelector('.roster-role-section__list');
          targetTable.appendChild(userRow);
          
          // Update counts
          updateSectionCounts();
          
          // Re-add event listener to the moved row
          const roleSelector = userRow.querySelector('.role-selector');
          if (roleSelector) {
            roleSelector.addEventListener('change', function() {
              updateUserRole(this.dataset.userId, this.value, this.dataset.currentRole);
            });
          }
        }
      }
      
      function updateSectionCounts() {
        document.querySelectorAll('.roster-role-section').forEach(section => {
          const title = section.querySelector('.roster-role-section__title');
          const tbody = section.querySelector('.roster-role-section__list');
          const count = tbody.children.length;
          const roleText = title.textContent.split('(')[0].trim();
          title.textContent = roleText + ' (' + count + ')';
        });
      }
      
      async function removeUser(userId) {
        if (!confirm('Are you sure you want to remove this user from the class?')) return;
        
        try {
          const response = await fetch('/api/classRoles/' + currentClassId + '/roster/' + userId + '/remove', {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            showSuccess('User removed successfully');
            window.location.reload(); // Reload to show updated list
          } else {
            showError('Failed to remove user');
          }
        } catch (error) {
          console.error('Error removing user:', error);
          showError('Failed to remove user');
        }
      }
      
      function updatePageTitle(count) {
        const titleElement = document.querySelector('.roster-page__count');
        if (titleElement) {
          titleElement.textContent = '(' + count + ' member' + (count !== 1 ? 's' : '') + ')';
        }
      }
      
      function showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'notification notification--success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
      
      function showError(message) {
        document.getElementById('roster-content').innerHTML = 
          '<div class="error-state">' +
            '<h2>Error</h2>' +
            '<p>' + message + '</p>' +
            '<button onclick="loadRosterData()" class="btn btn--primary">Try Again</button>' +
          '</div>';
      }
    </script>
  `;
  
  // For HTMX requests, send just the content without full page layout
  res.send(rosterPageShell + scripts);
});