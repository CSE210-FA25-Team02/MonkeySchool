/**
 * Monkey School - App Interaction
 * Handles global UI interactions (Sidebar, Modals, Toasts)
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🐒 Monkey School UI Loaded");

  // === TOAST SYSTEM ===
  window.showToast = (title, message, type = "info") => {
    const container = document.getElementById("toast-container");
    if (!container) {
      // Create container if missing
      const newContainer = document.createElement("div");
      newContainer.id = "toast-container";
      newContainer.className = "toast-container";
      document.body.appendChild(newContainer);
      return showToast(title, message, type);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-info";
    if (type === "success") iconClass = "fa-check";
    if (type === "error") iconClass = "fa-exclamation";

    toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-times"></i>
            </div>
        `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add("hiding");
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, 4000);
  };

  // === MODAL SYSTEM ===
  window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
    }
  };

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
    }
  };

  // Close modal on outside click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
      }
    });
  });

  // === HTMX Event Listeners ===
  // Show toast on HTMX error
  document.body.addEventListener("htmx:responseError", (evt) => {
    const errorMsg =
      evt.detail.xhr.responseText || "An unexpected error occurred";
    showToast("Error", errorMsg, "error");
  });

  // Handle HTMX redirects if needed manually (usually HX-Redirect handles it)
});
