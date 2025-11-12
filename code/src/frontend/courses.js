import { asyncHandler } from "../utils/async-handler.js";

/**
 * Frontend handler for courses list page
 * Shows all available courses with buttons to navigate to rosters
 */
export const showCoursesListPage = asyncHandler(async (req, res) => {
  // Import the service to get actual data
  const { getAllClasses } = await import('../services/class.service.js');
  
  // Get user's professor status
  const isProf = req.user?.isProf || false;
  
  let coursesData = [];
  
  try {
    const courses = await getAllClasses();
    coursesData = courses.map(course => ({
      ...course,
      memberCount: course.members?.length || 0,
      professorCount: course.members?.filter(m => m.role === 'PROFESSOR').length || 0,
      taCount: course.members?.filter(m => m.role === 'TA').length || 0,
      studentCount: course.members?.filter(m => m.role === 'STUDENT').length || 0
    }));
  } catch (error) {
    console.error('Error loading courses:', error);
  }
  
  // Check if this is an HTMX request
  const isHtmxRequest = req.headers["hx-request"];
  
  // Create the courses content without container wrapper (since index.html already has one)
  const coursesContent = `
    <div class="courses-page" aria-labelledby="courses-title">
      <header class="courses-page__header">
        <div class="courses-page__title-section">
          <h1 id="courses-title" class="courses-page__title">
            <i class="fas fa-graduation-cap" style="color: var(--color-accent-1); margin-right: var(--spacing-md);"></i>
            All Courses
            <span class="courses-page__count">(${coursesData.length} course${coursesData.length !== 1 ? 's' : ''})</span>
          </h1>
          <p class="courses-page__description">
            Select a course to view and manage its roster
          </p>
        </div>
      </header>
      
      <div id="courses-content" class="courses-content">
        ${coursesData.length > 0 ? generateCoursesGrid(coursesData, isProf) : '<div class="empty-state"><h2>No courses found</h2><p>There are currently no courses available.</p></div>'}
      </div>
    </div>
  `;
  
  // For HTMX requests, wrap in container; for direct navigation, don't (main already has container)
  const coursesPageShell = isHtmxRequest 
    ? `<div class="container">${coursesContent}</div>`
    : coursesContent;
  
  // Add the styles
  const coursesPageWithStyles = `
    ${coursesPageShell}
    
    <style>
      .courses-page {
        padding: var(--spacing-xl);
        max-width: none;
        margin: 0;
        color: var(--color-text-secondary);
        background-color: var(--color-bg-white);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-md);
      }
      
      .courses-page__title {
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-md);
        color: var(--color-primary-bg);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }
      
      .courses-page__count {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-medium);
        color: var(--color-accent-1);
      }
      
      .courses-page__description {
        font-size: var(--font-size-lg);
        color: var(--color-neutral-600);
        margin-bottom: var(--spacing-xl);
      }
      
      .courses-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--spacing-xl);
        margin-top: var(--spacing-xl);
      }
      
      .course-card {
        background: var(--color-bg-white);
        border: 2px solid var(--color-neutral-200);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-xl);
        transition: all var(--transition-fast);
        position: relative;
        overflow: hidden;
      }
      
      .course-card:hover {
        border-color: var(--color-accent-1);
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }
      
      .course-card__header {
        margin-bottom: var(--spacing-lg);
      }
      
      .course-card__name {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-primary-bg);
        margin-bottom: var(--spacing-sm);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }
      
      .course-card__quarter {
        font-size: var(--font-size-sm);
        color: var(--color-neutral-600);
        font-weight: var(--font-weight-medium);
        background: var(--color-neutral);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        display: inline-block;
      }
      
      .course-card__stats {
        margin: var(--spacing-lg) 0;
      }
      
      .course-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--color-neutral-200);
      }
      
      .course-stat:last-child {
        border-bottom: none;
      }
      
      .course-stat__label {
        font-size: var(--font-size-sm);
        color: var(--color-neutral-600);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }
      
      .course-stat__value {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-primary-bg);
      }
      
      .course-card__actions {
        margin-top: var(--spacing-lg);
        display: flex;
        gap: var(--spacing-md);
      }
      
      .btn-roster {
        background: var(--color-primary-bg);
        color: var(--color-text-primary);
        border: none;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        flex: 1;
        justify-content: center;
      }
      
      .btn-roster:hover {
        background: var(--color-secondary-bg);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
      
      .empty-state {
        text-align: center;
        padding: var(--spacing-3xl);
        color: var(--color-neutral-600);
      }
      
      .empty-state h2 {
        color: var(--color-primary-bg);
        margin-bottom: var(--spacing-md);
      }
      
      .access-restricted {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--color-neutral-100);
        border: 1px solid var(--color-neutral-300);
        border-radius: var(--border-radius-md);
        text-align: center;
        flex: 1;
      }
    </style>
  `;
  
  function generateCoursesGrid(courses, isProf) {
    const courseCards = courses.map(course => `
      <article class="course-card">
        <div class="course-card__header">
          <h2 class="course-card__name">
            <i class="fas fa-book" style="color: var(--color-accent-1);"></i>
            ${course.name || 'Untitled Course'}
          </h2>
          <span class="course-card__quarter">${course.quarter || 'No Quarter'}</span>
        </div>
        
        <div class="course-card__stats">
          <div class="course-stat">
            <span class="course-stat__label">
              <i class="fas fa-users" style="color: var(--color-neutral-500);"></i>
              Total Members
            </span>
            <span class="course-stat__value">${course.memberCount}</span>
          </div>
          <div class="course-stat">
            <span class="course-stat__label">
              <i class="fas fa-chalkboard-teacher" style="color: var(--color-neutral-500);"></i>
              Professors
            </span>
            <span class="course-stat__value">${course.professorCount}</span>
          </div>
          <div class="course-stat">
            <span class="course-stat__label">
              <i class="fas fa-user-graduate" style="color: var(--color-neutral-500);"></i>
              TAs
            </span>
            <span class="course-stat__value">${course.taCount}</span>
          </div>
          <div class="course-stat">
            <span class="course-stat__label">
              <i class="fas fa-user" style="color: var(--color-neutral-500);"></i>
              Students
            </span>
            <span class="course-stat__value">${course.studentCount}</span>
          </div>
        </div>
        
        <div class="course-card__actions">
          ${isProf 
            ? `<a href="/roster/${course.id}" 
                 class="btn-roster"
                 hx-get="/roster/${course.id}"
                 hx-target="#main-content"
                 hx-push-url="true">
                <i class="fas fa-list-ul"></i>
                View Roster
              </a>`
            : `<div class="access-restricted">
                <i class="fas fa-lock" style="color: var(--color-neutral-400);"></i>
                <span style="color: var(--color-neutral-500); font-size: var(--font-size-sm);">
                  Professor access required
                </span>
              </div>`
          }
        </div>
      </article>
    `).join('');
    
    return `<div class="courses-grid">${courseCards}</div>`;
  }
  
  // For HTMX requests, send just the content without full page layout
  res.send(coursesPageWithStyles);
});