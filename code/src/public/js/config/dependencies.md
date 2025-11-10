# Dependencies & Backend Notes

## Frontend Libraries

- HTMX (v1.9.8) - Already included via CDN
- Vanilla JavaScript (ES6+ modules) - No build step required
- CSS3 with CSS Variables - For theming and customization

## Icon Libraries (Optional)

You can use one of the following for navigation icons:
- FontAwesome (CDN)
- Material Icons (CDN)
- Heroicons (SVG sprites)
- Or use Unicode/Emoji icons for simplicity

## Backend / API

- User assumed logged in (session management handled by Express)
- Profile data fetched via `/api/profile` (to be implemented)
- Courses data via `/api/courses` (to be implemented)
- Auth context manages session (Express sessions)

## Notes

- Click-outside logic handled with vanilla JavaScript event listeners
- Responsive behavior via CSS grid/flexbox + media queries
- HTMX handles dynamic content loading without full page reloads
- Navigation state managed by URL pathname
- Sub-menu state managed by JavaScript (opens/closes on click)
- Profile dropdown closes on outside click
- Mobile navigation uses hamburger menu with overlay

## Implementation Details

- All components are vanilla JavaScript ES6 modules
- Components are initialized on DOMContentLoaded
- Event delegation used for dynamic content
- CSS transitions for smooth animations
- Accessibility: ARIA labels, keyboard navigation support
- Responsive breakpoints:
  - Desktop: ≥1024px
  - Tablet: 768px - 1023px
  - Mobile: <768px

