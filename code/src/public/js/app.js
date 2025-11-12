/**
 * Main Application Initialization
 *
 * Initializes all navigation components on page load
 */

import { NavBar } from "./components/NavBar.js";
import { SubMenu } from "./components/SubMenu.js";
import { Header } from "./components/Header.js";
import { Footer } from "./components/Footer.js";
import { generateColorCSS } from "./config/colors.js";

/**
 * Initialize the application
 */
function initApp() {
  // Inject color CSS variables
  const style = document.createElement("style");
  style.textContent = generateColorCSS();
  document.head.appendChild(style);

  // Initialize components
  const navbar = new NavBar("navbar");
  navbar.init();

  const submenu = new SubMenu("submenu");
  submenu.init();

  const header = new Header("header");
  header.init();

  const footer = new Footer("footer");
  footer.init();

  // Make components available globally for debugging
  if (typeof window !== "undefined") {
    window.app = {
      navbar,
      submenu,
      header,
      footer,
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Re-initialize on HTMX page swaps (if needed)
if (typeof htmx !== "undefined") {
  document.body.addEventListener("htmx:afterSettle", () => {
    // Update active states, but don't re-initialize components
    // as they maintain their own state
  });
}

export { initApp };
