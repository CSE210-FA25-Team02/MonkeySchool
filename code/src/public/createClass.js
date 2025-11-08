//May need to change to use HTMX instead

async function createClassRequest(data) {
    const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create class');
    }

    return res.json();
}

function getUpcomingQuarters(count = 8) {
    const quarters = ['Winter', 'Spring', 'Summer', 'Fall'];
    const currDate = new Date();
    const currYear = currDate.getFullYear();
    const currMonth = currDate.getMonth();

    //What is the current quarter (0 to 2 = Winter, 3 to 5 = Spring, 6 to 7 = Summer, 8 to 12 = Fall)
    let startIndex = currMonth < 3 ? 0 : currMonth < 6 ? 1 : currMonth < 8 ? 2 : 3;

    const quarterList = [];
    let yearIndex = currYear;
    let qIndex = startIndex;

    for (let i = 0; i < count; i++) {
        quarterList.push(`${quarters[qIndex]} ${yearIndex}`);
        qIndex++;

        if (qIndex === quarters.length){ 
            qIndex = 0;
            yearIndex++;
        }

    }

    return quarterList;

}

function createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal">
            <h2>Create New Class</h2>
            <form id="create-class-form">
                <label>
                    Class Name:
                    <input type="text" name="name" required />
                </label>
                <label>
                    Quarter:
                    <select name="quarter" id="quarter-select" required /></select>
                </label>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Create</button>
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;

    //Quarters appear dynamically
    const quarterSelect = overlay.querySelector('#quarter-select');
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a quarter';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    quarterSelect.appendChild(defaultOption);

    getUpcomingQuarters().forEach(q => {
        const quarter = document.createElement('option');
        quarter.value = q;
        quarter.textContent = q;
        quarterSelect.appendChild(quarter);
    });


    document.body.appendChild(overlay);

    // Close modal when clicking "Cancel" or outside
    overlay.addEventListener('click', e => {
        if (e.target === overlay || e.target.id === 'cancel-btn') {
        overlay.remove();
        }
    });

    return overlay;
}

async function initCreateClassButton(containerSelector = "#class-create") {
    try {
        //TODO: Want to change this to check isProf for user
        const user = {
            isProf: true
        };
        if (!user.isProf) return;

        const container = document.querySelector(containerSelector);
        if (!container) return;

        //Create button
        const btn = document.createElement('button');
        btn.textContent = 'Create New Class';
        btn.classList.add('btn', 'btn-primary');

        container.appendChild(btn);

        console.log("Message to me");

        //On button click
        btn.addEventListener('click', async ()=> {
            const modal = createModal();
            const form = modal.querySelector('#create-class-form');

            form.addEventListener('submit', async e => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                try {
                    const klass = await createClassRequest(data);
                    alert(`✅ Class created: ${klass.name} (${klass.inviteCode})`);
                } catch (err) {
                    alert(`❌ ${err.message}`);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Create New Class';
                }
            });
        });
        
    } catch (err) {
        console.error('Error initializing create class button:', err);
    }
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCreateClassButton();
});