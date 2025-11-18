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
                    hx-get="/activity/user/dropdown"
                    hx-trigger="load"
                    hx-target="#punch-select"
                    hx-swap="innerHTML"
                    hx-on:change="htmx.trigger('#punch-details', 'loadDetails')" >
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
        </div>
    `;
}

export function createActivityModal(classes) {
    return `
        <div class="punchcard__modal" id="activity-modal">
            <div class="punchcard__modal-content">
                <h2>Create New Activity</h2>
                <form hx-post="/activity" hx-target="#punch-details" hx-swap="innerHTML">
                
                <label>Class:</label>
                <select 
                    name="classId" 
                    id="class-select"
                    required
                    hx-get="/activity/load-fields"
                    hx-trigger="change"
                    hx-target="#activity-fields\"
                    hx-swap="outerHTML"
                >
                    <option value="">-- Select a class --</option>
                    ${classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join("")}
                </select>


                <div id="activity-fields">
                    <!-- Disabled placeholder fields -->
                    <label>Category:</label>
                    <select name="categoryId" disabled required>
                        <option>-- Select a class first --</option>
                    </select>

                    <label>Punch In:</label>
                    <input type="datetime-local" name="startTime" disabled required>

                    <label>Punch Out:</label>
                    <input type="datetime-local" name="endTime" disabled>
                    <button type="submit" id="save-btn" disabled>Save</button>
                </div>

                <button type="button"
                    hx-get="/classes/close-form"
                    hx-target="#activity-modal"
                    hx-swap="outerHTML"
                >Cancel</button>
                </form>
            </div>
        </div>
    `;
}

export function createEditActivityModal(categories, activity, classes) {
    return `
        <div class="punchcard__modal" id="activity-modal">
            <div class="punchcard__modal-content">
                <h2>Edit Activity</h2>
                <form hx-put="/activity/${activity.id}" hx-target="#punch-details" hx-swap="innerHTML">
                
                <label>Class:</label>
                <select 
                    name="classId" 
                    id="class-select"
                    required
                    hx-get="/activity/refresh-categories"
                    hx-trigger="change"
                    hx-target="#activity-fields"
                    hx-swap="outerHTML"
                    hx-vals='{"categoryId": "${activity.categoryId}"}'
                >
                    ${classes.map(cls => `<option value="${cls.id}" ${cls.id === activity.classId ? "selected" : ""}>${cls.name}</option>`).join("")}
                </select>

                <div id="activity-fields">
                    <label>Category:</label>
                    <select name="categoryId" required>
                        ${categories.map(c => `
                        <option value="${c.id}" ${c.id === activity.categoryId ? "selected" : ""}>
                                ${c.name}
                        </option>
                        `).join("")}
                    </select>
                </div>

                <label>Punch In:</label>
                <input type="datetime-local" name="startTime" value="${toDatetimeLocal(activity.startTime)}" required>

                <label>Punch Out:</label>
                <input type="datetime-local" name="endTime" value="${activity.endTime ? toDatetimeLocal(activity.endTime) : ""}">

                
                <button type="submit">Save</button>
                <button type="button" hx-get="/classes/close-form" hx-target="#activity-modal" hx-swap="outerHTML"">Cancel</button>
                </form>
            </div>
        </div>
    `;
}

export function enableActivityFields(categories) {
    return `
        <div id="activity-fields">
            <label>Category:</label>
            <select name="categoryId" required>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
            </select>

            <label>Punch In:</label>
            <input type="datetime-local" name="startTime" required>

            <label>Punch Out:</label>
            <input type="datetime-local" name="endTime">

            <button type="submit" id="save-btn">Save</button>
        </div>
    `;
}

export function refreshCategories(categories, categoryId) {
    return `
    <div id="activity-fields">
        <label>Category:</label>
        <select name="categoryId" required>
            ${categories.map(c => `
            <option value="${c.id}" ${c.id === categoryId ? "selected" : ""}>
                    ${c.name}
            </option>
            `).join("")}
        </select>
    </div>
    `;
}


/**
 * 
 * @param {*} date 
 * @returns 
 */
function toDatetimeLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}