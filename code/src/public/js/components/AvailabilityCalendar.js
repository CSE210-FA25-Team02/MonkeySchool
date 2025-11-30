/**
 * Availability Calendar Component
 * Interactive calendar for setting personal availability with HTMX integration
 * Supports clicking, dragging, and keyboard navigation
 */

class AvailabilityCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Calendar container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      editModeToggleId: 'edit-mode-toggle',
      saveEndpoint: '/groups/availability',
      autoSave: true,
      debounceDelay: 1000,
      ...options
    };

    this.editMode = false;
    this.isDragging = false;
    this.dragStartSlot = null;
    this.currentAvailability = new Set();
    this.pendingChanges = new Set();
    this.saveTimeout = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialState();
    this.updateEditModeUI();
  }

  setupEventListeners() {
    // Edit mode toggle
    const editModeToggle = document.getElementById(this.options.editModeToggleId);
    if (editModeToggle) {
      editModeToggle.addEventListener('change', this.handleEditModeToggle.bind(this));
    }

    // Time slot interactions
    this.container.addEventListener('click', this.handleSlotClick.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseover', this.handleMouseOver.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Prevent context menu on drag
    this.container.addEventListener('contextmenu', (e) => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });

    // Global mouse up to handle drag end outside container
    document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
  }

  handleEditModeToggle(event) {
    this.editMode = event.target.checked;
    this.updateEditModeUI();
  }

  updateEditModeUI() {
    const calendarGrid = this.container.querySelector('.weekly-calendar, .calendar-grid');
    if (calendarGrid) {
      if (this.editMode) {
        calendarGrid.classList.add('edit-mode');
        this.container.style.cursor = 'crosshair';
      } else {
        calendarGrid.classList.remove('edit-mode');
        this.container.style.cursor = 'default';
      }
    }
  }

  updateControlsVisibility() {
    // Quick actions removed - no controls to show/hide
  }

  handleSlotClick(event) {
    if (!this.editMode) return;

    const timeSlot = event.target.closest('.time-slot');
    if (!timeSlot) return;

    event.preventDefault();
    this.toggleSlot(timeSlot);
  }

  handleMouseDown(event) {
    if (!this.editMode) return;

    const timeSlot = event.target.closest('.time-slot');
    if (!timeSlot) return;

    event.preventDefault();
    this.isDragging = true;
    this.dragStartSlot = timeSlot;
    
    // Toggle the starting slot
    this.toggleSlot(timeSlot);
    
    // Add dragging class to container
    this.container.classList.add('dragging');
    document.body.style.userSelect = 'none';
  }

  handleMouseOver(event) {
    if (!this.editMode || !this.isDragging) return;

    const timeSlot = event.target.closest('.time-slot');
    if (!timeSlot || timeSlot === this.dragStartSlot) return;

    // Apply the same state as the starting slot to all slots in the drag path
    const startState = this.dragStartSlot.classList.contains('time-slot--available');
    this.setSlotState(timeSlot, startState);
  }

  handleMouseUp() {
    if (!this.editMode || !this.isDragging) return;
    
    this.finishDrag();
  }

  handleGlobalMouseUp() {
    if (this.isDragging) {
      this.finishDrag();
    }
  }

  handleMouseLeave() {
    if (!this.editMode || !this.isDragging) return;
    // Don't finish drag on mouse leave, only on mouse up
  }

  finishDrag() {
    this.isDragging = false;
    this.dragStartSlot = null;
    this.container.classList.remove('dragging');
    document.body.style.userSelect = '';
    
    // Save changes after drag operation
    this.debouncedSave();
  }

  handleKeyDown(event) {
    if (!this.editMode) return;

    const timeSlot = event.target.closest('.time-slot');
    if (!timeSlot) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleSlot(timeSlot);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowNavigation(event, timeSlot);
        break;
    }
  }

  handleArrowNavigation(event, currentSlot) {
    event.preventDefault();
    
    const timeSlots = Array.from(this.container.querySelectorAll('.time-slot'));
    const currentIndex = timeSlots.indexOf(currentSlot);
    let targetIndex = currentIndex;

    const slotsPerRow = 7; // 7 days per week

    switch (event.key) {
      case 'ArrowLeft':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        targetIndex = Math.min(timeSlots.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        targetIndex = Math.max(0, currentIndex - slotsPerRow);
        break;
      case 'ArrowDown':
        targetIndex = Math.min(timeSlots.length - 1, currentIndex + slotsPerRow);
        break;
    }

    if (targetIndex !== currentIndex && timeSlots[targetIndex]) {
      timeSlots[targetIndex].focus();
    }
  }

  toggleSlot(timeSlot) {
    const isCurrentlyAvailable = timeSlot.classList.contains('time-slot--available');
    this.setSlotState(timeSlot, !isCurrentlyAvailable);
  }

  setSlotState(timeSlot, isAvailable) {
    const day = timeSlot.dataset.day;
    const time = timeSlot.dataset.time;
    const slotKey = `${day}-${time}`;

    if (isAvailable) {
      timeSlot.classList.remove('time-slot--unavailable');
      timeSlot.classList.add('time-slot--available');
      this.currentAvailability.add(slotKey);
      timeSlot.setAttribute('aria-label', `Available: ${this.getSlotLabel(day, time)}`);
    } else {
      timeSlot.classList.remove('time-slot--available');
      timeSlot.classList.add('time-slot--unavailable');
      this.currentAvailability.delete(slotKey);
      timeSlot.setAttribute('aria-label', `Unavailable: ${this.getSlotLabel(day, time)}`);
    }

    this.pendingChanges.add(slotKey);
    this.debouncedSave();
  }

  getSlotLabel(dayIndex, time) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[parseInt(dayIndex)] || 'Unknown';
    return `${dayName} at ${this.formatTime(time)}`;
  }

  formatTime(time) {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minute} ${ampm}`;
  }

  debouncedSave() {
    if (!this.options.autoSave) return;

    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveAvailability();
    }, this.options.debounceDelay);
  }

  async saveAvailability() {
    if (this.pendingChanges.size === 0) return;

    const availability = Array.from(this.currentAvailability).map(key => {
      const [day, time] = key.split('-');
      return { day: parseInt(day), time, available: true };
    });

    try {
      this.showStatus('Saving availability...', 'saving');

      const response = await fetch(this.options.saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability }),
      });

      if (response.ok) {
        const result = await response.text();
        
        // Update the status display with HTMX response
        const statusContainer = document.getElementById('availability-status');
        if (statusContainer) {
          statusContainer.innerHTML = result;
        } else {
          this.showStatus('Availability saved successfully!', 'success');
        }

        // Clear pending changes
        this.pendingChanges.clear();
        
        // Flash updated slots
        this.flashUpdatedSlots();

      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      this.showStatus('Failed to save availability. Please try again.', 'error');
    }
  }

  flashUpdatedSlots() {
    this.pendingChanges.forEach(slotKey => {
      const [day, time] = slotKey.split('-');
      const slot = this.container.querySelector(`[data-day="${day}"][data-time="${time}"]`);
      if (slot) {
        slot.classList.add('time-slot--updated');
        setTimeout(() => {
          slot.classList.remove('time-slot--updated');
        }, 500);
      }
    });
  }

  showStatus(message, type) {
    let statusContainer = document.getElementById('availability-status');
    if (!statusContainer) {
      statusContainer = document.createElement('div');
      statusContainer.id = 'availability-status';
      this.container.parentNode.insertBefore(statusContainer, this.container);
    }

    const icons = {
      saving: 'fas fa-spinner fa-spin',
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    statusContainer.innerHTML = `
      <div class="availability-status availability-status--${type}">
        <i class="status-icon ${icons[type]}"></i>
        <span>${message}</span>
      </div>
    `;

    // Auto-hide non-error messages
    if (type !== 'error' && type !== 'saving') {
      setTimeout(() => {
        if (statusContainer.parentNode) {
          statusContainer.innerHTML = '';
        }
      }, 3000);
    }
  }

  loadInitialState() {
    // Load existing availability from data attributes or API
    const timeSlots = this.container.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
      const isAvailable = slot.classList.contains('time-slot--available');
      const day = slot.dataset.day;
      const time = slot.dataset.time;
      const slotKey = `${day}-${time}`;

      if (isAvailable) {
        this.currentAvailability.add(slotKey);
      }

      // Set up accessibility attributes
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      slot.setAttribute('aria-label', this.getSlotLabel(day, time));
      slot.setAttribute('aria-pressed', isAvailable);
    });
  }

  // Public methods for external control
  setEditMode(enabled) {
    const toggle = document.getElementById(this.options.editModeToggleId);
    if (toggle) {
      toggle.checked = enabled;
      this.handleEditModeToggle({ target: toggle });
    }
  }

  // Quick action methods removed for cleaner interface
}

// Auto-initialize calendars when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const personalCalendar = document.getElementById('personal-calendar');
  if (personalCalendar) {
    window.personalAvailabilityCalendar = new AvailabilityCalendar('personal-calendar', {
      saveEndpoint: '/groups/availability',
      autoSave: true,
      debounceDelay: 1000
    });
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AvailabilityCalendar;
}