/**
 * Footer Component
 * 
 * Handles the footer with copyright information
 */

export class Footer {
  constructor(containerId = 'footer') {
    this.containerId = containerId;
    this.container = null;
  }

  /**
   * Initialize the footer
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Footer: Container with id "${this.containerId}" not found`);
      return;
    }

    this.render();
  }

  /**
   * Render the footer HTML
   */
  render() {
    // Always render footer with exact text: © Monkey School
    this.container.innerHTML = `
      <div class="footer__content">
        <p class="footer__copyright">
          © Monkey School
        </p>
      </div>
    `;
    this.container.classList.add('footer--branded');
  }
}

