/**
 * Make form to create a new class
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
                            ${quarters.map((q) => `<option value="${q}">${q}</option>`).join("")}
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

export function createClassPage(user) {
  const isProfessor = user?.isProf || true;

  //TODO: This is temporary, please change
  return `
        <body>
            <h1>Your Classes</h1>
            <div id="modal-container"></div>

            ${
              isProfessor
                ? `
                <button
                    hx-get="/classes/form"
                    hx-target="#modal-container"
                    hx-swap="beforeend"
                    class="classes-modal__button classes-modal__button--primary"
                >
                    Create New Class
                </button>
            `
                : ""
            }

            <script>
                // Listen for HTMX swaps
                document.body.addEventListener('htmx:afterSwap', (event) => {
                // Check if the modal was just inserted
                if (event.detail.target.id === 'modal-container' || event.detail.target.id === 'modal') {
                    const copyBtn = document.getElementById('copy-btn');
                    if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        const input = document.getElementById('class-code');
                        if (input) {
                        navigator.clipboard.writeText(input.value)
                            .then(() => console.log('Copied:', input.value))
                            .catch(err => console.error('Clipboard error:', err));
                        }
                    });
                    }
                }
                });
            </script>
        </body>
    `;
}
