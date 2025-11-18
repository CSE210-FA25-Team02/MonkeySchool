// Service functions for AttendanceRecord-related database operations
// code/src/services/attendanceRecord.service.js

import { prisma } from "../lib/prisma.js";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  GoneError,
} from "../utils/api-error.js";

/**
 * Check if a student is enrolled in a class
 */
async function isStudentEnrolled(studentId, classId) {
  const enrollment = await prisma.classRole.findFirst({
    where: {
      userId: studentId,
      classId: classId,
      role: {
        in: ["STUDENT", "TA", "TUTOR", "PROFESSOR"], // All enrolled roles
      },
    },
  });
  return !!enrollment;
}

/**
 * Submit attendance for a student using a poll code
 * This is an atomic operation that handles all validation and creates the record
 * @param {string} code - 8-digit attendance code
 * @param {string} studentId - User ID of student
 * @returns {Promise<Object>} Created attendance record
 * @throws {NotFoundError} If poll not found or expired
 * @throws {ForbiddenError} If student not enrolled
 * @throws {ConflictError} If already marked attendance
 */
export async function submitAttendance(
  code,
  studentId,
) {
  // Use transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // Find active poll by code
    const now = new Date();
    const poll = await tx.attendancePoll.findFirst({
      where: {
        code,
        active: true,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        session: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!poll) {
      // Check if poll exists but is expired
      const expiredPoll = await tx.attendancePoll.findFirst({
        where: {
          code,
        },
      });
      if (expiredPoll) {
        throw new GoneError("Code expired");
      }
      throw new NotFoundError("Invalid code");
    }

    // Check if student is enrolled in the class
    const enrolled = await isStudentEnrolled(
      studentId,
      poll.session.classId,
    );
    if (!enrolled) {
      throw new ForbiddenError("Not enrolled in course");
    }

    // Check if already marked (using unique constraint)
    const existing = await tx.attendanceRecord.findUnique({
      where: {
        student_session_unique: {
          studentId,
          sessionId: poll.sessionId,
        },
      },
    });

    if (existing) {
      throw new ConflictError("Already marked attendance for this session");
    }

    // Create attendance record
    const record = await tx.attendanceRecord.create({
      data: {
        studentId,
        sessionId: poll.sessionId,
        pollId: poll.id,
      },
      include: {
        session: {
          include: {
            class: true,
          },
        },
        poll: true,
      },
    });

    return record;
  });
}

/**
 * Get all attendance records for a session
 */
export async function getSessionAttendance(sessionId) {
  return prisma.attendanceRecord.findMany({
    where: {
      sessionId,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      poll: {
        select: {
          id: true,
          code: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      markedAt: "asc",
    },
  });
}

/**
 * Get attendance summary for a course (all sessions)
 */
export async function getCourseAttendanceSummary(courseId) {
  // Get all sessions for the course
  const sessions = await prisma.courseSession.findMany({
    where: {
      classId: courseId,
    },
    include: {
      attendanceRecords: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          attendanceRecords: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get all enrolled students for the course
  const enrolledStudents = await prisma.classRole.findMany({
    where: {
      classId: courseId,
      role: {
        in: ["STUDENT", "TA", "TUTOR"],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Build summary
  const studentMap = new Map();
  enrolledStudents.forEach((enrollment) => {
    studentMap.set(enrollment.userId, {
      studentId: enrollment.userId,
      name: enrollment.user.name,
      email: enrollment.user.email,
      sessions: {},
      totalSessions: sessions.length,
      presentCount: 0,
    });
  });

  // Mark attendance for each session
  sessions.forEach((session) => {
    session.attendanceRecords.forEach((record) => {
      const student = studentMap.get(record.studentId);
      if (student) {
        student.sessions[session.id] = {
          present: true,
          markedAt: record.markedAt,
          pollCode: record.poll?.code,
        };
        student.presentCount++;
      }
    });
  });

  return {
    courseId,
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      date: s.date,
      attendanceCount: s._count.attendanceRecords,
    })),
    students: Array.from(studentMap.values()).map((s) => ({
      ...s,
      attendancePercentage:
        s.totalSessions > 0
          ? Math.round((s.presentCount / s.totalSessions) * 100)
          : 0,
    })),
  };
}

/**
 * Get attendance history for a student
 * Returns flat list of records (for backward compatibility)
 */
export async function getStudentAttendance(studentId) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
    },
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              quarter: true,
            },
          },
        },
      },
      poll: {
        select: {
          id: true,
          code: true,
        },
      },
    },
    orderBy: {
      markedAt: "desc",
    },
  });

  return records.map((record) => ({
    courseId: record.session.classId,
    courseName: record.session.class.name,
    sessionId: record.session.id,
    sessionName: record.session.name,
    date: record.session.date,
    status: "present",
    markedAt: record.markedAt,
    pollCode: record.poll?.code,
  }));
}

/**
 * Get attendance history for a student grouped by course
 * Returns course-wise grouped data for detailed view
 */
export async function getStudentAttendanceGroupedByCourse(studentId) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
    },
    include: {
      session: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              quarter: true,
            },
          },
        },
      },
      poll: {
        select: {
          id: true,
          code: true,
        },
      },
    },
    orderBy: {
      markedAt: "desc",
    },
  });

  // Group by course
  const courseMap = new Map();
  
  records.forEach((record) => {
    const courseId = record.session.classId;
    const courseName = record.session.class.name;
    
    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId,
        courseName,
        attendances: [],
      });
    }
    
    courseMap.get(courseId).attendances.push({
      timestamp: record.markedAt,
      date: record.session.date,
      sessionName: record.session.name,
      status: "present",
      markedAt: record.markedAt,
      pollCode: record.poll?.code,
    });
  });

  // Convert to array and sort by course name
  return Array.from(courseMap.values()).sort((a, b) => 
    a.courseName.localeCompare(b.courseName)
  );
}

