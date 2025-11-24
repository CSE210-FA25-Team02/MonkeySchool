/**
 * Navigation Configuration
 *
 * Centralized configuration for all navigation items and sub-menus
 */

export const navigationConfig = {
  mainNav: [
    {
      name: "Home",
      path: "/",
      icon: "home", // icon identifier for icon library
      subMenu: [
        { name: "Home", path: "/" },
        { name: "Attendance", path: "/attendance" },
        { name: "People", path: "/people" },
        { name: "Schedule", path: "/schedule" },
      ],
    },
    {
      name: "Courses",
      path: "/courses",
      icon: "book",
      subMenu: [
        { name: "My Classes", path: "/classes/my-classes" },
        { name: "Courses", path: "/courses/list" },
        { name: "Schedule", path: "/courses/schedule" },
      ],
    },
    {
      name: "Account",
      path: "/account",
      icon: "user",
      subMenu: [{ name: "View Profile", path: "/users/profile" },
        { name: "My Journal", path: "/journal" },
      ],
      
    },
  ],
};
