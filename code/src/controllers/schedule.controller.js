/**
 * Schedule Controller
 * code/src/controllers/schedule.controller.js
 *
 * Handles schedule/calendar page rendering for classes
 */

import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { createBaseLayout } from "../utils/html-templates.js";
import { renderSchedulePage } from "../utils/htmx-templates/schedule-templates.js";
import * as classService from "../services/class.service.js";
import * as eventService from "../services/event.service.js";
import * as classRoleService from "../services/classRole.service.js";
import { prisma } from "../lib/prisma.js";
import { renderScheduleWrapper } from "../utils/htmx-templates/schedule-templates.js";

/**
 * Render class schedule page
 * Route: GET /classes/:id/schedule
 * Auth: requireAuth
 */
export const renderClassSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const view = req.query.view || "week";
  const dateParam = req.query.date;

  // Fetch class info
  const klass = await classService.getClassById(id);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Parse date or use today
  let currentDate = new Date();
  if (dateParam) {
    currentDate = new Date(dateParam);
    if (isNaN(currentDate.getTime())) {
      currentDate = new Date();
    }
  }

  // Calculate week start (Monday) for fetching events
  const weekStart = new Date(currentDate);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  // Calculate week end (next Monday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Fetch all groups for this class (for dropdown)
  const groupsForClass = await prisma.group.findMany({
    where: { classId: id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get user's class role for event filtering and allowed event types
  const userId = req.user?.id;
  let userClassRole = null;
  let allowedEventTypes = [];
  let isGroupLeader = false;
  let leaderGroupId = null;

  if (userId) {
    // Get user's class role
    const classRole = await classRoleService.getClassRole(userId, id);
    userClassRole = classRole?.role || null;

    const groupIds = groupsForClass.map((g) => g.id);

    // Check if user is a group leader and which group they lead
    if (groupIds.length > 0) {
      const leaderRecord = await prisma.groupRole.findFirst({
        where: {
          userId,
          role: "LEADER",
          groupId: { in: groupIds },
        },
        select: { groupId: true },
      });
      if (leaderRecord) {
        isGroupLeader = true;
        leaderGroupId = leaderRecord.groupId;
      }
    }

    // Determine allowed event types based on role (using DB enum values)
    // Professor, TA, Tutor, and Group Leader can all create GROUP_MEETING
    if (userClassRole === "PROFESSOR" || userClassRole === "TA") {
      // Professor or TA can create all event types including COURSE_DISCUSSION and GROUP_MEETING
      allowedEventTypes = [
        "COURSE_LECTURE",
        "COURSE_OFFICE_HOUR",
        "COURSE_DISCUSSION",
        "GROUP_MEETING",
        "OTHER",
      ];
    } else if (userClassRole === "TUTOR") {
      // Tutor can create office hours, discussion, meeting, and other (no lecture)
      allowedEventTypes = [
        "COURSE_OFFICE_HOUR",
        "COURSE_DISCUSSION",
        "GROUP_MEETING",
        "OTHER",
      ];
    } else if (isGroupLeader) {
      // Group leaders (who are not Professor/TA/Tutor) can only create group meetings
      allowedEventTypes = ["GROUP_MEETING"];
    }
    // Any other role (STUDENT or no role) - no event types allowed (empty array)
  }

  // Fetch events for the class within the date range (filtered by group for students)
  const events = await eventService.getEventsByClassIdAndDateRange(
    id,
    weekStart,
    weekEnd,
    userId,
    userClassRole,
  );

  // Prepare groups data for the modal
  const groupsData = {
    allGroups: groupsForClass,
    isGroupLeader,
    leaderGroupId,
  };

  // Render schedule page with real events and allowed event types
  const content = renderSchedulePage(
    klass,
    view,
    currentDate,
    events,
    allowedEventTypes,
    groupsData,
  );

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    const wrappedContent = renderScheduleWrapper(
      klass,
      view,
      currentDate,
      events,
      allowedEventTypes,
      groupsData,
    );
    res.send(wrappedContent);
  } else {
    // Wrap content in schedule-wrapper for consistency
    const wrappedContent = `<div id="schedule-wrapper">${content}</div>`;
    const fullPage = createBaseLayout(
      `${klass.name} - Schedule`,
      wrappedContent,
      {
        user: req.user,
      },
    );
    res.send(fullPage);
  }
});
