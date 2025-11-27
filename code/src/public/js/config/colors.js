/**
 * Color Palette Configuration
 *
 * Brand colors for Monkey School application
 */

export const colors = {
  // Primary background - Deep green (main background for fixed nav bar)
  primaryBg: "#0E534A",

  // Secondary background - Used for hover states, headers, and sub-nav backgrounds
  secondaryBg: "#1B6A59",

  // Accent 1 - Highlight color for active nav items or buttons
  accent1: "#F2A93B",

  // Accent 2 - Used for warning or emphasis (close buttons, active icons)
  accent2: "#E07A2F",

  // Neutral - Light background for footer and non-primary areas
  neutral: "#B7C7A3",

  // Additional colors for text and UI elements
  text: {
    primary: "#ffffff",
    secondary: "#333333",
    light: "#B7C7A3",
  },

  // Background colors
  background: {
    white: "#ffffff",
    light: "#f5f5f5",
  },
};

/**
 * CSS Custom Properties Generator
 * Returns a string of CSS variables that can be injected into the page
 */
export function generateColorCSS() {
  return `
    :root {
      --color-primary-bg: ${colors.primaryBg};
      --color-secondary-bg: ${colors.secondaryBg};
      --color-accent-1: ${colors.accent1};
      --color-accent-2: ${colors.accent2};
      --color-neutral: ${colors.neutral};
      --color-text-primary: ${colors.text.primary};
      --color-text-secondary: ${colors.text.secondary};
      --color-text-light: ${colors.text.light};
      --color-bg-white: ${colors.background.white};
      --color-bg-light: ${colors.background.light};
    }
  `;
}
