/**
 * Header Component
 *
 * Handles the top header with profile dropdown
 */

export class Header {
  constructor(containerId = "header") {
    this.containerId = containerId;
    this.container = null;
    this.isDropdownOpen = false;
  }

  /**
   * Initialize the header
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(
        `Header: Container with id "${this.containerId}" not found`
      );
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the header HTML
   */
  render() {
    // Always render just the profile dropdown (no title)
    const existingProfile = this.container.querySelector(".header__profile");
    if (!existingProfile) {
      const headerContent =
        this.container.querySelector(".header__content") || this.container;
      const headerRight = headerContent.querySelector(".header__right");

      if (!headerRight) {
        // Create header structure if it doesn't exist
        headerContent.innerHTML = `
          <div class="header__left"></div>
          <div class="header__right">
            <div class="header__profile">
              <button class="header__profile-button" 
                      aria-label="User profile menu" 
                      aria-expanded="false"
                      type="button">
                <div class="header__profile-icon">
                  <i class="fas fa-user" aria-hidden="true"></i>
                </div>
              </button>
              <div class="header__dropdown" role="menu" aria-label="Profile menu">
                <a href="/users/profile" 
                   class="header__dropdown-item"
                   ${
                     typeof htmx !== "undefined"
                       ? `
                     hx-get="/users/profile" 
                     hx-target="#main-content" 
                     hx-push-url="true"
                   `
                       : ""
                   }>
                  View Profile
                </a>
                <a href="/account/edit" 
                   class="header__dropdown-item"
                   ${
                     typeof htmx !== "undefined"
                       ? `
                     hx-get="/account/edit" 
                     hx-target="#main-content" 
                     hx-push-url="true"
                   `
                       : ""
                   }>
                  Edit Profile
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        // Add profile dropdown to existing header
        headerRight.innerHTML = `
          <div class="header__profile">
            <button class="header__profile-button" 
                    aria-label="User profile menu" 
                    aria-expanded="false"
                    type="button">
              <div class="header__profile-icon">👤</div>
            </button>
            <div class="header__dropdown" role="menu" aria-label="Profile menu">
              <a href="/users/profile" 
                 class="header__dropdown-item"
                 ${
                   typeof htmx !== "undefined"
                     ? `
                   hx-get="/users/profile" 
                   hx-target="#main-content" 
                   hx-push-url="true"
                 `
                     : ""
                 }>
                View Profile
              </a>
              <a href="/account/edit" 
                 class="header__dropdown-item"
                 ${
                   typeof htmx !== "undefined"
                     ? `
                   hx-get="/account/edit" 
                   hx-target="#main-content" 
                   hx-push-url="true"
                 `
                     : ""
                 }>
                Edit Profile
              </a>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const profileButton = this.container.querySelector(
      ".header__profile-button"
    );
    const dropdown = this.container.querySelector(".header__dropdown");

    if (!profileButton || !dropdown) {
      return;
    }

    // Toggle dropdown on button click
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isDropdownOpen && !this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Close dropdown on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isDropdownOpen) {
        this.closeDropdown();
      }
    });

    // Close dropdown when clicking on a dropdown item
    const dropdownItems = dropdown.querySelectorAll(".header__dropdown-item");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", () => {
        setTimeout(() => {
          this.closeDropdown();
        }, 100);
      });
    });
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    const profileButton = this.container.querySelector(
      ".header__profile-button"
    );
    const dropdown = this.container.querySelector(".header__dropdown");

    if (this.isDropdownOpen) {
      dropdown.classList.add("header__dropdown--open");
      profileButton.setAttribute("aria-expanded", "true");
      profileButton.classList.add("header__profile-button--active");
    } else {
      dropdown.classList.remove("header__dropdown--open");
      profileButton.setAttribute("aria-expanded", "false");
      profileButton.classList.remove("header__profile-button--active");
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    if (!this.isDropdownOpen) {
      return;
    }

    this.isDropdownOpen = false;
    const profileButton = this.container.querySelector(
      ".header__profile-button"
    );
    const dropdown = this.container.querySelector(".header__dropdown");

    if (dropdown) {
      dropdown.classList.remove("header__dropdown--open");
    }
    if (profileButton) {
      profileButton.setAttribute("aria-expanded", "false");
      profileButton.classList.remove("header__profile-button--active");
    }
  }
}
