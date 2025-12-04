# ADR003: Brand Specifications and UI Standards (Modern Eco-Tech)

## 1. Introduction & Context

The **Monkey School** platform is evolving from a functional utility to a polished, engaging product. This document serves as the canonical reference for the **"Modern Eco-Tech"** design language.

This is not just a style guide; it is a set of rules designed to make the interface feel **organic, trustworthy, and organized**.

**Target Audience:**
- **Frontend Developers:** Use this to choose the right CSS tokens and component patterns.
- **Designers:** Use this to understand the constraints and philosophy of our visual system.

---

## 2. Brand Philosophy: "The Organized Jungle"

Our visual identity balances the chaos of nature with the structure of technology.

*   **Organic but Structured:** We use natural colors (Deep Greens, Earthy Golds) but contain them in highly structured, mathematical layouts (Bento Grids).
*   **Deep but Clear:** We use shadows and glassmorphism to create depth (like looking through a canopy), but the typography remains high-contrast and readable.
*   **Playful but Professional:** We use rounded corners and vibrant accents to be friendly, but our data presentation (charts, tables) is precise and serious.

### 2.1 Accessibility & Contrast (Modern Eco-Tech)
We adhere to modern accessibility standards without relying on harsh, high-contrast neon colors.
*   **No Jarring Mutations:** We avoid "vibrating" color combinations (e.g., bright red on bright green).
*   **Subtle Contrast:** Instead of pure black on pure white, we use Deep Green (`#0E534A`) on Off-White (`#F5F7F5`). This reduces eye strain while maintaining WCAG AA compliance.
*   **Visual Hierarchy:** We use font weight and size, rather than just color, to denote importance.

### Core Metaphors
*   **The Canopy (Glass):** Overlay elements (Sidebars, Modals) are semi-transparent, blurring what's behind them. This gives context without clutter.
*   **The Tree Trunk (Deep Green):** The structural elements (Text, Borders, Primary Buttons) are solid, dark, and reliable.
*   **The Fruit (Gold):** The "Treats" for the user. Use Gold sparingly for things you *want* the user to click (Primary Actions, Active States).

---

## 3. Design Principles

### 3.1 Glassmorphism
We use glass effects to separate layers of hierarchy.
*   **Rule:** Only use glass (`backdrop-filter`) for **floating** or **overlay** elements (Sticky Headers, Sidebars, Toasts, Modals).
*   **Code:** `background: var(--color-bg-glass); backdrop-filter: blur(12px);`

### 3.2 Bento Grids
We reject the "Wall of Text." Everything belongs in a box.
*   **Rule:** Content is organized into cards of varying sizes that fit together in a grid.
*   **Rhythm:** Mix 1x1 small stats with 2x1 or 2x2 complex widgets.
*   **Code:** Use `.bento-grid` and `.bento-card`.

### 3.3 Tactile Depth
The user should feel like they can touch the interface.
*   **Rule:** Interactive elements must react.
*   **Interaction:** Hovering a card should lift it up (`translateY(-2px)`). Clicking a button should press it down.

---

## 4. Technical Specifications (The Tokens)

**CRITICAL:** Never use hex codes (e.g., `#0E534A`) directly in your CSS. Always use the CSS variables.

### 4.1 Color Palette

| Variable | Name | Hex Reference | Usage Usage |
| :--- | :--- | :--- | :--- |
| **Brand Colors** | | | |
| `--color-brand-deep` | Tree Trunk | `#0E534A` | **Primary Text**, Borders, Primary Buttons. |
| `--color-brand-medium` | Leaves | `#1B6A59` | Hover states, Secondary Icons. |
| `--color-brand-light` | Mist | `#E8F0ED` | Active background states, subtle fills. |
| **Accent Colors** | | | |
| `--color-accent-gold` | Fruit | `#F2A93B` | **Call to Action**, Active Nav Pill, Highlights. |
| `--color-accent-orange` | Sunset | `#E07A2F` | Warnings, "Destructive" actions. |
| **Surface Colors** | | | |
| `--color-bg-canvas` | Canvas | `#F5F7F5` | The page background (behind the cards). |
| `--color-bg-surface` | Cloud | `#FFFFFF` | **Card Backgrounds**. |
| `--color-bg-glass` | Glass | `rgba(255...0.7)` | Sidebars, Modals, Sticky Headers. |

### 4.2 Typography

*   **Font Family:** `Inter` (UI) / `JetBrains Mono` (Code/Data).
*   **Sizes:** Use `--text-sm` (14px) for density, `--text-base` (16px) for reading, `--text-xl`+ for headers.
*   **Weights:**
    *   **Bold (700):** Headers, Data Values.
    *   **Medium (500):** Labels, Buttons.
    *   **Regular (400):** Body text.

### 4.3 Spacing & Radius

*   **Radius:** We like curves.
    *   `--radius-lg` (16px): Standard Cards.
    *   `--radius-xl` (24px): Modals, Large Containers.
    *   `--radius-full` (9999px): Pills, Buttons, Badges.
*   **Spacing:** Based on 4px grid (`--space-1` = 4px).
    *   Standard Padding: `--space-6` (24px) for cards.
    *   Grid Gap: `--space-4` (16px) or `--space-6` (24px).

---

## 5. Component Usage Guidelines

### Buttons
*   **Primary (Do):** Use `bg-brand-deep` text-white for the "Save", "Submit", or "Create" action.
*   **Secondary (Do):** Use transparent bg with `text-muted` for "Cancel" or "Back".
*   **Gold (Use Sparingly):** Use `text-accent-gold` for actions that are "delightful" or the main focus of a funnel (e.g., "Start Class", "Punch In").

### Cards
*   **Structure:** A card should usually have a Header (Title + Action) and a Body.
*   **Content:** Don't put raw text on the Canvas background. Always wrap it in a `.bento-card`.

### Navigation
*   **Sidebar:** The sidebar is for global context. It stays fixed.
*   **Breadcrumbs:** Use the top bar to show *where* the user is within the section.

---

## 6. Component Implementation Prompts

When creating new components, reference this structure:

> **Design System Prompt:**
>
> "Implement HTML/CSS using the Monkey School 'Modern Eco-Tech' design system, referencing the style patterns found in the `demo/` folder.
>
> 1.  **Reference:** Mimic the structure and class names found in `demo/index.html` and `demo/css/tokens.css`.
> 2.  **Colors:** Use CSS variables (e.g., `var(--color-brand-deep)`), DO NOT use hex codes.
> 2.  **Layout:** Use a Bento Grid approach. Wrap distinct content sections in `<div class='bento-card'>`.
> 3.  **Styling:** Use rounded corners (`var(--radius-lg)`), soft shadows (`var(--shadow-card)`), and Inter font.
> 4.  **Interactions:** Ensure cards have hover lift effects.
> 5.  **Structure:** HTML5 semantic tags.
> 7.  **Accessibility:** Use Deep Green (`var(--color-brand-deep)`) for text to ensure good contrast without harshness. Avoid pure black."

---

## 7. File Organization & Reference Implementation

**IMPORTANT:** The authoritative implementation of this design system is currently located in the `demo/` folder, NOT in the main `code/` codebase (which is pending migration).

When implementing styles, copy or reference files from:

*   `demo/css/tokens.css`: **Immutable source of truth.**
*   `demo/css/shell.css`: The App Shell (Sidebar + Main Canvas).
*   `demo/css/components/*.css`: Reusable atoms (Buttons, Inputs, Cards).
*   `demo/css/pages/*.css`: Page-specific layouts.

Eventually, these will be migrated to `src/public/css/`, but `demo/` is the master reference for now.
