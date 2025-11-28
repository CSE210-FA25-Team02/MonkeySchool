/**
 * Navigation Bar Component
 *
 * Handles the left fixed navigation bar with collapsible functionality
 */

import { navigationConfig } from "../config/navigationConfig.js";

export class NavBar {
  constructor(containerId = "navbar") {
    this.containerId = containerId;
    this.container = null;
    this.isOpen = false;
    this.currentPath = window.location.pathname;
    this.activeNavItem = null;
  }

  /**
   * Initialize the navigation bar
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(
        `NavBar: Container with id "${this.containerId}" not found`
      );
      return;
    }

    this.render();
    this.attachEventListeners();
    this.setActiveNavItem();
  }

  /**
   * Render the navigation bar HTML
   */
  render() {
    const logoHTML = `
      <div class="navbar__logo">
        <div class="navbar__logo-circle">Logo</div>
      </div>
    `;

    const navItemsHTML = navigationConfig.mainNav
      .map((item, index) => {
        const isActive = this.isActiveRoute(item.path);
        const activeClass = isActive ? "navbar__item--active" : "";

        return `
        <div class="navbar__item ${activeClass}" 
             data-nav-index="${index}" 
             data-path="${item.path}"
             title="${item.name}"
             aria-label="${item.name}">
          <div class="navbar__icon">
            ${this.getIconHTML(item.icon)}
          </div>
        </div>
      `;
      })
      .join("");

    // No hamburger menu - nav bar is always visible
    this.container.innerHTML = `
      ${logoHTML}
      <nav class="navbar__nav" role="navigation" aria-label="Main navigation">
        ${navItemsHTML}
      </nav>
    `;
  }

  /**
   * Get icon HTML based on icon identifier using Font Awesome
   */
  getIconHTML(iconName) {
    // Font Awesome icons
    const icons = {
      home: '<i class="fas fa-home" aria-hidden="true"></i>',
      book: '<i class="fas fa-book" aria-hidden="true"></i>',
      user: '<i class="fas fa-user" aria-hidden="true"></i>',
    };
    return (
      icons[iconName] || '<i class="fas fa-circle" aria-hidden="true"></i>'
    );
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
   * Set the active navigation item
   */
  setActiveNavItem() {
    const navItems = this.container.querySelectorAll(".navbar__item");
    navItems.forEach((item) => {
      const path = item.dataset.path;
      if (this.isActiveRoute(path)) {
        item.classList.add("navbar__item--active");
        this.activeNavItem = item;
      } else {
        item.classList.remove("navbar__item--active");
      }
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Navigation item clicks
    const navItems = this.container.querySelectorAll(".navbar__item");
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const path = item.dataset.path;
        const navIndex = item.dataset.navIndex;
        this.handleNavClick(path, navIndex, item);
      });
    });

    // Update active state on route change (for HTMX navigation)
    window.addEventListener("htmx:afterSettle", () => {
      this.currentPath = window.location.pathname;
      this.setActiveNavItem();
    });

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      this.currentPath = window.location.pathname;
      this.setActiveNavItem();
    });
  }

  /**
   * Handle navigation item click
   */
  handleNavClick(path, navIndex, element) {
    const navItem = navigationConfig.mainNav[navIndex];

    // If nav item has submenu, trigger submenu open event
    if (navItem && navItem.subMenu && navItem.subMenu.length > 0) {
      const event = new CustomEvent("navItemClick", {
        detail: { navItem, element, path },
      });
      document.dispatchEvent(event);
    } else {
      // Navigate directly if no submenu
      this.navigate(path);
    }
  }

  /**
   * Navigate to a route
   */
  navigate(path) {
    // Use HTMX if available, otherwise use standard navigation
    if (typeof htmx !== "undefined") {
      htmx.ajax("GET", path, { target: "#main-content", swap: "innerHTML" });
      window.history.pushState({}, "", path);
    } else {
      window.location.href = path;
    }
    this.currentPath = path;
    this.setActiveNavItem();
  }
}
