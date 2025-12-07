/**
 * Monkey School - Demo App Interaction
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🐒 Monkey School Demo Loaded");

  // === TOAST SYSTEM ===
  window.showToast = (title, message, type = "info") => {
    const container = document.getElementById("toast-container");
    if (!container) {
      // Create container if missing (for pages that forgot to include it)
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

  // === TAB SYSTEM ===
  const tabs = document.querySelectorAll(".tab-item[data-tab]");
  if (tabs.length > 0) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active from all tabs
        tabs.forEach((t) => t.classList.remove("active"));
        // Add active to clicked
        tab.classList.add("active");

        // Hide all panes
        document.querySelectorAll(".tab-pane").forEach((pane) => {
          pane.style.display = "none";
        });

        // Show target pane
        const targetId = tab.getAttribute("data-tab");
        const targetPane = document.getElementById(`tab-${targetId}`);
        if (targetPane) {
          targetPane.style.display = "block";
        }
      });
    });
  }

  // === PROFILE EDIT SYSTEM ===
  window.saveProfile = () => {
    const form = document.getElementById("form-edit-profile");
    if (!form) return;

    const formData = new FormData(form);
    const name = form.querySelector('[name="name"]').value;
    const pronouns = form.querySelector('[name="pronouns"]').value;
    const bio = form.querySelector('[name="bio"]').value;

    const updates = { name, pronouns, bio };

    // Update DOM
    const nameEl = document.querySelector(".profile-name");
    if (nameEl) nameEl.textContent = updates.name;

    const pronounsEl = document.querySelector(".profile-pronouns");
    if (pronounsEl) pronounsEl.textContent = updates.pronouns;

    const bioEl = document.querySelector(".profile-bio");
    if (bioEl) bioEl.textContent = updates.bio;

    // Update User Pills
    document.querySelectorAll(".user-name").forEach((el) => {
      el.textContent = updates.name;
    });

    closeModal("modal-edit-profile");
    showToast(
      "Profile Updated",
      "Your changes have been saved successfully.",
      "success"
    );
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

  // Bind Create Class Trigger
  const createClassBtn = document.getElementById("trigger-create-class");
  if (createClassBtn) {
    createClassBtn.addEventListener("click", () =>
      openModal("modal-create-class")
    );
  }

  // Close modal on outside click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
      }
    });
  });

  // === PUNCH CARD WIDGET (Class Page) ===
  const classPunchBtn = document.getElementById("class-punch-btn");
  if (classPunchBtn) {
    classPunchBtn.addEventListener("click", () => {
      showToast("Punched In", "You are now present in CSE 210", "success");
      classPunchBtn.innerHTML = '<i class="fa-solid fa-check"></i> Present';
      classPunchBtn.style.background = "#10B981"; // Green
      classPunchBtn.style.color = "white";
    });
  }

  // === PUNCH CARD WIDGET (Dashboard) ===
  const punchBtn = document.getElementById("demo-punch-btn");
  if (punchBtn) {
    let isPunchedIn = false;
    punchBtn.addEventListener("click", () => {
      isPunchedIn = !isPunchedIn;

      if (isPunchedIn) {
        // Punch In State
        punchBtn.style.background = "#F59E0B"; // Gold
        punchBtn.innerHTML = '<i class="fa-solid fa-check"></i> Punched In';
        // Show toast
        showToast(
          "Punch Successful",
          "You punched in for CSE 210 at " + new Date().toLocaleTimeString(),
          "success"
        );
      } else {
        // Punch Out State
        punchBtn.style.background = "var(--color-brand-deep)";
        punchBtn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> Punch In';
        showToast("Punched Out", "See you next time!", "info");
      }
    });
  }

  // === NOTIFICATION SYSTEM ===
  const notifTrigger = document.getElementById("trigger-notif");
  const notifPanel = document.getElementById("notif-panel");

  if (notifTrigger && notifPanel) {
    notifTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle("open");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!notifPanel.contains(e.target) && !notifTrigger.contains(e.target)) {
        notifPanel.classList.remove("open");
      }
    });
  }

  // User Pill Click -> Profile
  const userPills = document.querySelectorAll(".user-pill");
  userPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  });

  // Search Spotlight Interaction
  const searchTrigger = document.querySelector(".search-trigger");
  if (searchTrigger) {
    searchTrigger.addEventListener("click", () => {
      showToast(
        "Coming Soon",
        "Spotlight Search (Cmd+K) is under construction",
        "info"
      );
    });
  }
});
