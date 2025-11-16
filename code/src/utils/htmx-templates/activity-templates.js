/**
 * Create Punch Card Container Component
 */
export function createPunchCard(userId) {
    return `
        <div class="punchcard">

            <h3 class="punchcard__title">Activity Punch Card</h3>

            <!-- HTMX loads dropdown options on component load -->
            <select id="punch-select"
                    class="punchcard__select"
                    hx-get="/activity/user/${userId}/dropdown"
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
                <button disabled class="punchcard__button punchcard__button--disabled">Edit</button>
                <button disabled class="punchcard__button punchcard__button--disabled">New</button>
            </div>
        </div>
    `;
}