// code/scripts/mock/seed-attendance-data.js
// Seed script to populate database with realistic dummy attendance data

import { prisma } from "../../src/lib/prisma.js";
import { generateUniqueCode } from "../../src/utils/code-generator.js";
import { randomInt } from "crypto";

/**
 * Check if an attendance poll code is unique
 */
async function isCodeUnique(code) {
  const existing = await prisma.attendancePoll.findUnique({
    where: { code },
  });
  return !existing;
}

/**
 * Generate a random date within the last 30 days
 */
function getRandomDate() {
  const now = new Date();
  const daysAgo = randomInt(0, 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate a random time within a day (9 AM to 5 PM)
 */
function getRandomTime(baseDate) {
  const hour = randomInt(9, 17); // 9 AM to 4 PM
  const minute = randomInt(0, 60);
  const time = new Date(baseDate);
  time.setHours(hour, minute, 0, 0);
  return time;
}

/**
 * Get a random professor from existing users
 */
async function getRandomProfessor() {
  const professors = await prisma.user.findMany({
    where: { isProf: true },
    take: 1,
  });
  
  if (professors.length === 0) {
    // If no professors exist, get any user (we'll use them as createdBy)
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      throw new Error("No users found in database. Please run the main seed script first.");
    }
    return users[0];
  }
  
  return professors[0];
}

/**
 * Main seeding function
 */
async function main() {
  console.log("🌱 Seeding attendance data...\n");

  // Step 1: Fetch existing classes
  console.log("📚 Fetching existing classes...");
  const existingClasses = await prisma.class.findMany();
  
  if (existingClasses.length === 0) {
    throw new Error("No classes found in database. Please create classes first.");
  }
  
  console.log(`   Found ${existingClasses.length} existing class(es):`);
  existingClasses.forEach((cls) => {
    console.log(`   - ${cls.name} (${cls.id})`);
  });

  // Step 2: Create 5 new students
  console.log("\n👥 Creating 5 new students...");
  const studentNames = [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Brown",
    "Diana Prince",
    "Ethan Hunt",
  ];
  
  const students = await Promise.all(
    studentNames.map((name, index) =>
      prisma.user.create({
        data: {
          email: `student${index + 1}@ucsd.edu`,
          name: name,
          preferredName: name.split(" ")[0], // First name as preferred name
          isProf: false,
          pronouns: ["he/him", "she/her", "they/them"][index % 3],
        },
      })
    )
  );
  
  console.log(`   Created ${students.length} students:`);
  students.forEach((student) => {
    console.log(`   - ${student.name} (${student.email})`);
  });

  // Step 3: Assign students to 2-3 classes each (with overlap)
  console.log("\n📝 Assigning students to classes...");
  
  // Ensure all students share at least one common class
  const commonClass = existingClasses[0];
  const studentClassAssignments = [];
  
  // Assign all students to the first class (common class)
  for (const student of students) {
    const assignment = await prisma.classRole.create({
      data: {
        userId: student.id,
        classId: commonClass.id,
        role: "STUDENT",
      },
    });
    studentClassAssignments.push({
      studentId: student.id,
      classId: commonClass.id,
      className: commonClass.name,
    });
  }
  
  // Assign additional classes to each student (2-3 total per student)
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const numAdditionalClasses = randomInt(1, 3); // 1-2 additional classes (total 2-3)
    const availableClasses = existingClasses.filter(
      (cls) => cls.id !== commonClass.id
    );
    
    // Shuffle and take random classes
    const shuffled = [...availableClasses].sort(() => Math.random() - 0.5);
    const selectedClasses = shuffled.slice(0, Math.min(numAdditionalClasses, shuffled.length));
    
    for (const cls of selectedClasses) {
      // Check if already assigned
      const existing = await prisma.classRole.findUnique({
        where: {
          user_class_unique: {
            userId: student.id,
            classId: cls.id,
          },
        },
      });
      
      if (!existing) {
        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: cls.id,
            role: "STUDENT",
          },
        });
        studentClassAssignments.push({
          studentId: student.id,
          classId: cls.id,
          className: cls.name,
        });
      }
    }
  }
  
  console.log("   Student-Class Assignments:");
  students.forEach((student) => {
    const assignments = studentClassAssignments.filter(
      (a) => a.studentId === student.id
    );
    console.log(`   - ${student.name}: ${assignments.map((a) => a.className).join(", ")}`);
  });

  // Step 4: Create 5 sessions per course (only once per course, not per student)
  console.log("\n📅 Creating sessions for courses...");
  
  // Get unique class IDs that students are enrolled in
  const enrolledClassIds = [...new Set(studentClassAssignments.map((a) => a.classId))];
  const sessionsByClass = {};
  
  for (const classId of enrolledClassIds) {
    const cls = existingClasses.find((c) => c.id === classId);
    const sessions = [];
    
    for (let i = 1; i <= 5; i++) {
      const sessionDate = getRandomDate();
      const startTime = getRandomTime(sessionDate);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1.5); // 1.5 hour sessions
      
      const session = await prisma.courseSession.create({
        data: {
          classId: classId,
          name: `Session ${i}`,
          date: sessionDate,
          startTime: startTime,
          endTime: endTime,
        },
      });
      
      sessions.push(session);
    }
    
    sessionsByClass[classId] = sessions;
    console.log(`   Created 5 sessions for ${cls.name}:`);
    sessions.forEach((session) => {
      console.log(`     - ${session.name} (${session.date.toLocaleDateString()})`);
    });
  }

  // Step 5: Create attendance polls for some sessions
  console.log("\n📊 Creating attendance polls...");
  const professor = await getRandomProfessor();
  const polls = [];
  
  // Create polls for approximately 60% of sessions
  for (const [classId, sessions] of Object.entries(sessionsByClass)) {
    const numPolls = Math.ceil(sessions.length * 0.6); // ~60% of sessions
    const selectedSessions = sessions
      .sort(() => Math.random() - 0.5)
      .slice(0, numPolls);
    
    for (const session of selectedSessions) {
      const code = await generateUniqueCode(isCodeUnique);
      const durationMinutes = randomInt(5, 16); // 5-15 minutes
      const expiresAt = new Date(session.date);
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      
      const poll = await prisma.attendancePoll.create({
        data: {
          sessionId: session.id,
          createdBy: professor.id,
          code: code,
          expiresAt: expiresAt,
          durationMinutes: durationMinutes,
          active: true,
        },
      });
      
      polls.push(poll);
    }
  }
  
  console.log(`   Created ${polls.length} attendance polls`);
  polls.forEach((poll) => {
    console.log(`     - Code: ${poll.code} (Session: ${poll.sessionId})`);
  });

  // Step 6: Create attendance records for some student-session combinations
  console.log("\n✅ Creating attendance records...");
  const records = [];
  
  // For each session that has a poll, create records for some students
  for (const poll of polls) {
    const session = await prisma.courseSession.findUnique({
      where: { id: poll.sessionId },
      include: { class: true },
    });
    
    // Get students enrolled in this session's class
    const enrolledStudents = studentClassAssignments
      .filter((a) => a.classId === session.classId)
      .map((a) => a.studentId);
    
    // Create records for approximately 70% of enrolled students
    const numRecords = Math.ceil(enrolledStudents.length * 0.7);
    const selectedStudents = enrolledStudents
      .sort(() => Math.random() - 0.5)
      .slice(0, numRecords);
    
    for (const studentId of selectedStudents) {
      // Check if record already exists (unique constraint)
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          student_session_unique: {
            studentId: studentId,
            sessionId: session.id,
          },
        },
      });
      
      if (!existing) {
        const markedAt = new Date(session.date);
        markedAt.setMinutes(markedAt.getMinutes() + randomInt(1, poll.durationMinutes));
        
        const record = await prisma.attendanceRecord.create({
          data: {
            studentId: studentId,
            sessionId: session.id,
            pollId: poll.id,
            markedAt: markedAt,
          },
        });
        
        records.push(record);
      }
    }
  }
  
  console.log(`   Created ${records.length} attendance records`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`\n✅ Created ${students.length} new students:`);
  students.forEach((student) => {
    const assignments = studentClassAssignments.filter(
      (a) => a.studentId === student.id
    );
    console.log(`   - ${student.name} (${student.email})`);
    console.log(`     Enrolled in: ${assignments.map((a) => a.className).join(", ")}`);
  });
  
  console.log(`\n✅ Created sessions (grouped by course):`);
  for (const [classId, sessions] of Object.entries(sessionsByClass)) {
    const cls = existingClasses.find((c) => c.id === classId);
    console.log(`   ${cls.name}:`);
    sessions.forEach((session) => {
      console.log(`     - ${session.name} (${session.date.toLocaleDateString()})`);
    });
  }
  
  console.log(`\n✅ Created ${polls.length} attendance poll entries`);
  console.log(`   (Codes: ${polls.map((p) => p.code).join(", ")})`);
  
  console.log(`\n✅ Created ${records.length} attendance records`);
  console.log(`   (Students marked present for various sessions)`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✨ Seed complete!");
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

