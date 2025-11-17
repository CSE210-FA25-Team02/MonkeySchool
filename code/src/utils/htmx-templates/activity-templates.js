/**
 * Create Punch Card Container Component
 */
export function createPunchCard() {
    return `
        <div class="punchcard">

            <h3 class="punchcard__title">Activity Punch Card</h3>

            <!-- HTMX loads dropdown options on component load -->
            <select id="punch-select"
                    name="punchSelect"
                    class="punchcard__select"
                    hx-get="/api/activity/user/dropdown"
                    hx-trigger="load"
                    hx-target="#punch-select"
                    hx-swap="innerHTML"
                    hx-on:change="htmx.trigger('#punch-details', 'loadDetails')" >
            </select>

            <!-- Details section updates when selection changes -->
            <div id="punch-details"
                hx-get="/api/activity/details"
                hx-trigger="loadDetails"
                hx-include="#punch-select"
                hx-target="#punch-details"
                hx-swap="innerHTML">
            </div>

            <div class="punchcard__buttons">
                <button class="punchcard__button punchcard__button">Edit</button>
                <button 
                    class="punchcard__button"
                    hx-get="/api/activity/new-modal" 
                    hx-target="#modal-container"
                    hx-swap="innerHTML">
                    New
                </button>
            </div>
        </div>
    `;
}

export function createActivityModal(categories) {
    return `
        <div class="punchcard__modal" id="activity-modal">
            <div class="punchcard__modal-content">
                <h2>Create New Activity</h2>
                <form hx-post="/api/activity" hx-target="#punch-details" hx-swap="innerHTML">
                
                <label>Category:</label>
                <select name="categoryId" required>
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
                
                <label>Punch In:</label>
                <input type="datetime-local" name="startTime" required>

                <label>Punch Out:</label>
                <input type="datetime-local" name="endTime">
                
                <button type="submit">Save</button>
                <button type="button" hx-get="/api/classes/close-form" hx-target="#activity-modal" hx-swap="outerHTML"">Cancel</button>
                </form>
            </div>
        </div>
    `;
}