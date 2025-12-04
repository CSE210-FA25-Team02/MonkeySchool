# Migration Notes: Modern Eco-Tech UI

**Date:** November 2025  
**Branch:** `feature/full-stack-integration`

---

## Overview

This document records the migration from the old frontend to the new **Modern Eco-Tech** design system, including CSS restructuring, template architecture, and how to implement features.

---

## 1. CSS Migration

### New Structure

```
code/src/public/css/
├── tokens.css           # Design tokens (colors, spacing, typography)
├── shell.css            # App shell (sidebar, header, layout)
├── components/          # Reusable component styles
│   ├── bento.css
│   ├── modal.css
│   ├── toast.css
│   └── ...
├── pages/               # Page-specific styles
│   ├── auth.css
│   ├── class-list.css
│   ├── attendance.css
│   └── profile.css
└── archive/             # ⚠️ Deprecated (DO NOT USE)
    └── main.css
```

### Deprecated Files

Old CSS moved to `archive/`. Do NOT import from this folder.

---

## 2. Unified Components

We now use **unified CSS and template functions** across the application:

### Base Layout

All pages use `createBaseLayout()` from `utils/html-templates.js`:

```javascript
import { createBaseLayout } from "../utils/html-templates.js";

// Wraps content with sidebar, header, and all CSS imports
const fullPage = createBaseLayout("Page Title", contentHtml);
res.send(fullPage);
```

### Shared Components

| Component | File | Usage |
|-----------|------|-------|
| Modal | `components/modal.css` | `openModal('modal-id')`, `closeModal('modal-id')` |
| Toast | `components/toast.css` | `showToast('Title', 'Message', 'success')` |
| Bento Grid | `components/bento.css` | `.bento-grid`, `.bento-card` |
| Form Elements | `tokens.css` | `.form-input`, `.form-select`, `.btn` |

### CSS Variables

Always use CSS variables from `tokens.css`:

```css
color: var(--color-brand-deep);
background: var(--color-bg-card);
padding: var(--space-4);
border-radius: var(--radius-md);
```

---

## 3. Architecture

We use **Server-Driven UI** with HTMX:

```
Browser → routes/*.routes.js → controllers/*.controller.js
                                      ↓
                              services/*.service.js (database)
                                      ↓
                              htmx-templates/*.js (HTML generation)
                                      ↓
                              Browser (HTMX swaps HTML)
```

### Key Files

| Layer | Files |
|-------|-------|
| Routes | `src/routes/*.routes.js` |
| Controllers | `src/controllers/*.controller.js` |
| Services | `src/services/*.service.js` |
| Templates | `src/utils/htmx-templates/*.js` |
| Base Layout | `src/utils/html-templates.js` |

---

## 4. How to Implement a Feature

Reference the **Create Class** flow as an example:

### Files involved:

1. **Route:** `routes/class.routes.js`
2. **Controller:** `controllers/class.controller.js`
3. **Service:** `services/class.service.js`
4. **Template:** `utils/htmx-templates/classes-templates.js`

### Key Pattern

```javascript
// In controller
const isHTMX = req.headers["hx-request"];
if (isHTMX) {
  res.send(htmlTemplate(data));  // Return HTML fragment
} else {
  const fullPage = createBaseLayout("Title", htmlTemplate(data));
  res.send(fullPage);  // Return full page
}
```

### Before You Implement

1. Read [ADR003: Brand Specifications](./ADR/ADR003-Brand_Specifications_and_UI_Standards.md) for design guidelines
2. Use existing CSS from `tokens.css` and `components/`
3. Check existing templates in `htmx-templates/` for patterns
4. Use `escapeHtml()` for user-provided content

---

## 5. Authentication

Removed `optionalAuth`. All protected routes now use `requireAuth`:

```javascript
// Before (removed)
router.get("/my-classes", optionalAuth, ...);  // Would use mock data

// After
router.get("/my-classes", requireAuth, ...);   // Redirects to /login if not authenticated
```

---

## 6. Route Changes

| Route | Purpose |
|-------|---------|
| `/invite/:code` | Join class via invite link |
| `/classes/my-classes` | List user's classes |
| `/classes/:id` | Class detail page |
| `/users/profile` | User profile page |

---

## 7. Files Modified

- **Controllers:** `dashboard`, `class`, `user`, `attendance`
- **Routes:** `class.routes.js`, `user.routes.js`, `index.js`
- **Middleware:** `auth.js` (removed `optionalAuth`)
- **Config:** `app.js` (CSP for inline scripts)
- **CSS:** Migrated to modular structure

---

## Related Documents

- [ADR003: Brand Specifications](./ADR/ADR003-Brand_Specifications_and_UI_Standards.md) - Design system, colors, components
