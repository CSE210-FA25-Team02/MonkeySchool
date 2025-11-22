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

// Load content for the current route on initial page load
// This handles direct navigation to routes like /attendance
if (typeof htmx !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    const mainContent = document.getElementById("main-content");

    // Skip loading content for root and login pages
    if (path === "/" || path === "/login" || !mainContent) {
      return;
    }

    // Check if main content has meaningful, route-specific content
    // (not just error messages or empty containers)
    const innerText = (
      mainContent.innerText ||
      mainContent.textContent ||
      ""
    ).trim();
    const hasRouteContent =
      innerText.length > 50 && // Has substantial content
      !mainContent.querySelector(".not-implemented") && // Not error page
      (mainContent.querySelector(".attendance-page") || // Has attendance content
        mainContent.querySelector("section") || // Has any section
        innerText.length > 100); // Or just has lots of text

    // If main content doesn't have route-specific content, load it via HTMX
    if (!hasRouteContent) {
      // Small delay to ensure HTMX and all components are fully initialized
      setTimeout(() => {
        htmx.ajax("GET", path, {
          target: "#main-content",
          swap: "innerHTML",
          headers: { "HX-Request": "true" },
        });
      }, 200);
    }
  });
}

export { initApp };
