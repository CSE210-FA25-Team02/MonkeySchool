/**
 * Make form to create a new class
 * @param {Array<string>} quarters List of quarter options
 * @returns {string} HTML form for class creation form
 */
export function createClassForm(quarters) {
  return `
        <section id="modal" class="classes-modal__overlay">
            <div class="classes-modal">
                <h2>Create New Class</h2>
                <form hx-post="/classes/create" hx-target="#modal" hx-swap="outerHTML">
                    <label class="classes-modal__label">
                        Class Name:
                        <input name="name" class="classes-modal__input" required>
                    </label>
            
                    <label class="classes-modal__label">
                        Quarter:
                        <select name="quarter" class="classes-modal__select" required>
                            ${quarters.map((q) => `<option value="${q}">${q}</option>`).join('')}
                        </select>
                    </label>
            
                    <div class="classes-modal__actions">
                        <button class="classes-modal__button classes-modal__button--primary">Create</button>
                        <button type="button" class="classes-modal__button classes-modal__button--secondary" hx-get="/classes/close-form" hx-target="#modal" hx-swap="outerHTML">Cancel</button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

/**
 * Display invite code in HTML modal for created class
 * @param {string} inviteURL Invite URL to display
 * @returns {string} HTML modal showing invite link
 */
export function displayInvite(inviteURL) {
  return `
      <section id="modal" class="classes-modal__overlay">
        <div class="modal">
          <h2>Class Created!</h2>
          <p>Your class invite:</p>
          <section style="display:flex; align-items:center; gap:10px;">
            <input type="text" id="class-code" readonly value="${inviteURL}" class="classes-modal__input" />
            <button id="copy-btn" class="classes-modal__button classes-modal__button--primary">Copy</button>
          </section>
          <section class="classes-modal__actions">
            <button type="button" class="classes-modal__button classes-modal__button--secondary" hx-get="/classes/close-form" hx-target="#modal" hx-swap="outerHTML">Close</button>
          </section>
        </div>
      </section>`;
}
