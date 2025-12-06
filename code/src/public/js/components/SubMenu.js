/**
 * Sub-Menu Component
 *
 * Handles the collapsible sub-menu that expands from the side
 */

export class SubMenu {
  constructor(containerId = "submenu") {
    this.containerId = containerId;
    this.container = null;
    this.isOpen = false;
    this.currentNavItem = null;
    this.currentPath = window.location.pathname;
    this.currentNavElement = null; // Store the nav element that opened this submenu
    this.clickOutsideHandler = null; // Store the click outside handler for cleanup
  }

  /**
   * Initialize the sub-menu
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(
        `SubMenu: Container with id "${this.containerId}" not found`
      );
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the sub-menu HTML
   */
  render() {
    this.container.innerHTML = `
      <div class="submenu__overlay" aria-hidden="true"></div>
      <div class="submenu__panel" role="menu" aria-label="Sub-navigation menu">
        <div class="submenu__header">
          <h2 class="submenu__title">Menu</h2>
          <button class="submenu__close" aria-label="Close submenu" type="button">
            ×
          </button>
        </div>
        <nav class="submenu__nav" role="navigation">
          <ul class="submenu__list"></ul>
        </nav>
      </div>
    `;
  }

  /**
   * Open the sub-menu with navigation items
   */
  open(navItem, navElement) {
    if (!navItem || !navItem.subMenu || navItem.subMenu.length === 0) {
      return;
    }

    // If a different submenu is open, close it first (no delay needed)
    if (
      this.isOpen &&
      this.currentNavItem &&
      this.currentNavItem.path !== navItem.path
    ) {
      // Close current submenu immediately
      this.isOpen = false;
      this.currentNavItem = null;
      this.currentNavElement = null;
      this.container.classList.remove("submenu--open");
      document.body.classList.remove("submenu-open");
      document.body.style.overflow = "";

      // Remove click-outside listener
      this._removeClickOutsideListener();

      // Remove highlight from all nav items
      document.querySelectorAll(".navbar__item").forEach((item) => {
        item.classList.remove("navbar__item--submenu-open");
      });
    }

    // Now open the new submenu
    this._openSubmenu(navItem, navElement);
  }

  /**
   * Internal method to actually open the submenu
   */
  _openSubmenu(navItem, navElement) {
    this.currentNavItem = navItem;
    this.isOpen = true;

    // Update title
    const title = this.container.querySelector(".submenu__title");
    if (title) {
      title.textContent = navItem.name;
    }

    // Render menu items
    const list = this.container.querySelector(".submenu__list");
    if (list) {
      list.innerHTML = navItem.subMenu
        .map((item) => {
          const isActive = this.isActiveRoute(item.path);
          const activeClass = isActive ? "submenu__item--active" : "";

          return `
          <li class="submenu__item ${activeClass}">
            <a href="${item.path}" 
               class="submenu__link" 
               data-path="${item.path}"
               ${
                 typeof htmx !== "undefined"
                   ? `
                 hx-get="${item.path}" 
                 hx-target="#main-content" 
                 hx-push-url="true"
               `
                   : ""
               }>
              ${item.name}
            </a>
          </li>
        `;
        })
        .join("");
    }

    // Show sub-menu
    this.container.classList.add("submenu--open");
    document.body.classList.add("submenu-open"); // Add class to body for CSS

    // Store the nav element that opened this submenu
    this.currentNavElement = navElement;

    // Only prevent body scroll on mobile/tablet (when overlay is visible)
    if (window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    }

    // Add click-outside listener for desktop (overlay handles mobile)
    this._addClickOutsideListener();

    // Focus management
    const firstLink = this.container.querySelector(".submenu__link");
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }

    // Highlight parent nav item
    if (navElement) {
      document.querySelectorAll(".navbar__item").forEach((item) => {
        item.classList.remove("navbar__item--submenu-open");
      });
      navElement.classList.add("navbar__item--submenu-open");
    }
  }

  /**
   * Close the sub-menu
   */
  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.currentNavItem = null;
    this.currentNavElement = null;
    this.container.classList.remove("submenu--open");
    document.body.classList.remove("submenu-open"); // Remove class from body
    document.body.style.overflow = ""; // Always restore scroll

    // Remove click-outside listener
    this._removeClickOutsideListener();

    // Remove highlight from nav items
    document.querySelectorAll(".navbar__item").forEach((item) => {
      item.classList.remove("navbar__item--submenu-open");
    });
  }

  /**
   * Add click-outside listener for desktop (works for both desktop and mobile)
   */
  _addClickOutsideListener() {
    // Remove any existing listener first
    this._removeClickOutsideListener();

    // Create the click-outside handler
    this.clickOutsideHandler = (event) => {
      // Don't close if clicking inside the submenu
      if (this.container && this.container.contains(event.target)) {
        return;
      }

      // Don't close if clicking on the nav item that opened this submenu
      if (
        this.currentNavElement &&
        this.currentNavElement.contains(event.target)
      ) {
        return;
      }

      // Don't close if clicking on the navbar itself
      const navbar = document.getElementById("navbar");
      if (navbar && navbar.contains(event.target)) {
        return;
      }

      // Close the submenu if clicking outside
      this.close();
    };

    // Add listener with a small delay to avoid immediate closure from the click that opened it
    setTimeout(() => {
      document.addEventListener("mousedown", this.clickOutsideHandler);
      document.addEventListener("touchstart", this.clickOutsideHandler);
    }, 100);
  }

  /**
   * Remove click-outside listener
   */
  _removeClickOutsideListener() {
    if (this.clickOutsideHandler) {
      document.removeEventListener("mousedown", this.clickOutsideHandler);
      document.removeEventListener("touchstart", this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Check if a route is currently active
   */
  isActiveRoute(path) {
    if (path === "/" && this.currentPath === "/") {
      return true;
    }
    if (path !== "/" && this.currentPath.startsWith(path)) {
      return true;
    }
    return false;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeButton = this.container.querySelector(".submenu__close");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.close());
    }

    // Overlay click (close on outside click) - works on mobile/tablet
    const overlay = this.container.querySelector(".submenu__overlay");
    if (overlay) {
      overlay.addEventListener("click", () => this.close());
    }

    // Note: Desktop click-outside is handled by _addClickOutsideListener() when submenu opens

    // Listen for nav item clicks - ensure only one submenu is open at a time
    document.addEventListener("navItemClick", (e) => {
      const { navItem, element } = e.detail;
      if (navItem.subMenu && navItem.subMenu.length > 0) {
        // Check if clicking the same menu item that's already open (toggle behavior)
        if (
          this.isOpen &&
          this.currentNavItem &&
          this.currentNavItem.path === navItem.path
        ) {
          // Toggle: if same menu is open, close it
          this.close();
        } else {
          // Open the new submenu (open() method will close current one if different)
          this.open(navItem, element);
        }
      } else {
        // No submenu - close any open submenu
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Update active state on route change
    window.addEventListener("htmx:afterSettle", () => {
      this.currentPath = window.location.pathname;
      this.updateActiveItems();
    });

    window.addEventListener("popstate", () => {
      this.currentPath = window.location.pathname;
      this.updateActiveItems();
    });

    // Close submenu when clicking on a link (after navigation)
    const list = this.container.querySelector(".submenu__list");
    if (list) {
      list.addEventListener("click", (e) => {
        if (e.target.classList.contains("submenu__link")) {
          // Close after a short delay to allow navigation
          setTimeout(() => {
            this.close();
          }, 100);
        }
      });
    }
  }

  /**
   * Update active menu items
   */
  updateActiveItems() {
    const items = this.container.querySelectorAll(".submenu__item");
    items.forEach((item) => {
      const link = item.querySelector(".submenu__link");
      if (link) {
        const path = link.dataset.path;
        if (this.isActiveRoute(path)) {
          item.classList.add("submenu__item--active");
        } else {
          item.classList.remove("submenu__item--active");
        }
      }
    });
  }
}
