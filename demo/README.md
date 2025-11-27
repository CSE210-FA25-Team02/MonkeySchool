# Monkey School - Frontend Demo (Modern Eco-Tech)

This folder contains the high-fidelity prototype for the **Monkey School UI 2.0**.
It implements the new "Modern Eco-Tech" brand style with Glassmorphism, Bento Grids, and a clean, accessible layout.

## 🚀 How to Run

Since this is a static prototype, you can run it with any simple HTTP server.

### Using Python (Recommended)

Run this one-liner in your terminal from this directory:

```bash
# If you are in the root 'MonkeySchool' folder:
cd demo && python3 -m http.server 8000

# If you are already in the 'demo' folder:
python3 -m http.server 8000
```

Then open **[http://localhost:8000](http://localhost:8000)** in your browser.

## 📂 Structure

- **`index.html`**: Dashboard with Bento Grid layout.
- **`class.html`**: Class Detail (Tabs: Directory, Groups) & Roster.
- **`groups.html`**: My Groups Dashboard (Active groups & Invites).
- **`attendance.html`**: Live Attendance Simulation (Professor & Student views).
- **`profile.html`**: User Profile & Activity Stream.
- **`login.html`**: Split-layout Login page.

## 🎨 Design Tokens

All colors, spacing, and typography are defined in `css/tokens.css`.
- **Primary**: `#0E534A` (Deep Green)
- **Accent**: `#F2A93B` (Monkey Gold)
- **Background**: `#F5F7F5` (Mist)

Enjoy the jungle! 🐒



