import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as userService from "../../src/services/user.service.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as groupService from "../../src/services/group.service.js";

const feature = loadFeature("./features/groups.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    // Reset context
    context.user = undefined;
    context.class = undefined;
    context.ta = undefined;
    context.students = [];
    context.groups = [];
    context.group = undefined;
    context.response = undefined;
    context.apiError = undefined;
  });

  // Counter for unique test data
  let testCounter = 0;

  // Helper function to setup basic test data
  async function setupBasicData(userEmail, userName) {
    // Add timestamp + counter to make emails truly unique per test
    testCounter++;
    const timestamp = `${Date.now()}-${testCounter}`;
    const uniqueEmail = userEmail.replace("@", `-${timestamp}@`);

    context.user = await userService.createUser({
      email: uniqueEmail,
      name: userName,
      preferredName: userName,
    });

    context.class = await classService.createClass({
      name: `CSE 210: Software Engineering ${timestamp}`,
      quarter: "WI25",
      location: "In Person",
    });

    context.class = await classService.updateClass(context.class.id, {
      inviteCode: `CSE210-${timestamp}`,
    });
  }

  // Helper to create students with unique emails per test
  async function createStudents(count) {
    const timestamp = Date.now();
    for (let i = 1; i <= count; i++) {
      const student = await userService.createUser({
        email: `student${i}-${timestamp}@ucsd.edu`,
        name: `Student ${i}`,
        preferredName: `Student ${i}`,
      });
      // Store with both actual email and lookup email for tests
      student.lookupEmail = `student${i}@ucsd.edu`;
      context.students.push(student);

      await classRoleService.upsertClassRole({
        userId: student.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    }
  }

  // Helper to create a group
  async function createGroup(name, classId) {
    const group = await groupService.createGroup({
      name,
      classId: classId || context.class.id,
    });
    context.groups.push(group);
    return group;
  }

  // ===========================================
  // Test: Professor successfully creates a group
  // ===========================================
  test("Professor successfully creates a group", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created in setupBasicData
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    when(
      /^I create a group with name "(.*)" for the class$/,
      async (groupName) => {
        context.response = await request
          .post("/groups")
          .send({
            name: groupName,
            classId: context.class.id,
          })
          .expect(201);

        context.group = context.response.body;
      },
    );

    then("the group should be created successfully", () => {
      expect(context.group).toBeDefined();
      expect(context.group.id).toBeDefined();
    });

    and(/^the group should have name "(.*)"$/, (groupName) => {
      expect(context.group.name).toBe(groupName);
    });

    and("the group should belong to the class", () => {
      expect(context.group.classId).toBe(context.class.id);
    });
  });

  // ===========================================
  // Test: Professor creates a group with all optional fields
  // ===========================================
  test("Professor creates a group with all optional fields", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    when("I create a group with:", async (table) => {
      const groupData = {};
      // jest-cucumber tables: array of row objects with column headers as keys
      // First row becomes headers, so we need to extract it separately
      const headers = Object.keys(table[0]);
      const keyColumn = headers[0]; // "name" (the field name column)
      const valueColumn = headers[1]; // The first row's value (e.g., "Team Alpha")

      // The header row itself contains the first key-value pair
      // keyColumn value is "name", valueColumn value is "Team Alpha"
      groupData[keyColumn] = valueColumn;

      // Remaining rows contain additional key-value pairs
      for (const row of table) {
        const key = row[keyColumn];
        const value = row[valueColumn];
        groupData[key] = value;
      }

      context.response = await request
        .post("/groups")
        .send({
          ...groupData,
          classId: context.class.id,
        })
        .expect(201);

      context.group = context.response.body;
    });

    then("the group should be created with all the provided details", () => {
      expect(context.group.name).toBe("Team Alpha");
      expect(context.group.logoUrl).toBe("https://example.com/logo.png");
      expect(context.group.mantra).toBe("We conquer challenges together");
      expect(context.group.github).toBe("https://github.com/team-alpha");
    });
  });

  // ===========================================
  // Test: TA successfully creates a group
  // ===========================================
  test("TA successfully creates a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "TA");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a TA in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    when(
      /^I create a group with name "(.*)" for the class$/,
      async (groupName) => {
        context.response = await request
          .post("/groups")
          .send({
            name: groupName,
            classId: context.class.id,
          })
          .expect(201);

        context.group = context.response.body;
      },
    );

    then("the group should be created successfully", () => {
      expect(context.group).toBeDefined();
      expect(context.group.id).toBeDefined();
    });

    and(/^the group should have name "(.*)"$/, (groupName) => {
      expect(context.group.name).toBe(groupName);
    });
  });

  // ===========================================
  // Test: Student cannot create a group
  // ===========================================
  test("Student cannot create a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    when(
      /^I attempt to create a group with name "(.*)" for the class$/,
      async (groupName) => {
        try {
          context.response = await request.post("/groups").send({
            name: groupName,
            classId: context.class.id,
          });
        } catch (error) {
          context.apiError = error;
        }
      },
    );

    then("I should receive a 403 Forbidden error", () => {
      expect(context.response.status).toBe(403);
    });

    and("the group should not be created", async () => {
      const groups = await groupService.getGroupsByClassId(context.class.id);
      expect(groups.length).toBe(0);
    });
  });

  // ===========================================
  // Test: Professor adds a student to a group as a member
  // ===========================================
  test("Professor adds a student to a group as a member", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(
      /^I add student "(.*)" to the group as "(.*)"$/,
      async (studentEmail, role) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: student.id,
            role,
          })
          .expect(201);
      },
    );

    then("the student should be added to the group", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(1);
    });

    and(/^the student's role in the group should be "(.*)"$/, async (role) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members[0].role).toBe(role);
    });
  });

  // ===========================================
  // Test: Professor adds a student to a group as a leader
  // ===========================================
  test("Professor adds a student to a group as a leader", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(
      /^I add student "(.*)" to the group as "(.*)"$/,
      async (studentEmail, role) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: student.id,
            role,
          })
          .expect(201);
      },
    );

    then("the student should be added to the group", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(1);
    });

    and(/^the student's role in the group should be "(.*)"$/, async (role) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members[0].role).toBe(role);
    });
  });

  // ===========================================
  // Test: TA adds multiple students to a group
  // ===========================================
  test("TA adds multiple students to a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "TA");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a TA in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(
      /^I add (\d+) students to the group with different roles$/,
      async (count) => {
        // Add student1 as LEADER
        await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: context.students[0].id,
            role: "LEADER",
          })
          .expect(201);

        // Add student2 as MEMBER
        await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: context.students[1].id,
            role: "MEMBER",
          })
          .expect(201);

        // Add student3 as MEMBER
        await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: context.students[2].id,
            role: "MEMBER",
          })
          .expect(201);
      },
    );

    then(/^the group should have (\d+) members$/, async (count) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(parseInt(count));
    });

    and("the students should have their assigned roles", async () => {
      const group = await groupService.getGroupById(context.group.id);

      const member1 = group.members.find(
        (m) => m.userId === context.students[0].id,
      );
      expect(member1.role).toBe("LEADER");

      const member2 = group.members.find(
        (m) => m.userId === context.students[1].id,
      );
      expect(member2.role).toBe("MEMBER");

      const member3 = group.members.find(
        (m) => m.userId === context.students[2].id,
      );
      expect(member3.role).toBe("MEMBER");
    });
  });

  // ===========================================
  // Test: Professor promotes a member to leader
  // ===========================================
  test("Professor promotes a member to leader", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^student "(.*)" is a member of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "MEMBER");
    });

    when(
      /^I update student "(.*)" role to "(.*)" in the group$/,
      async (studentEmail, role) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .put(`/groups/${context.group.id}/members/${student.id}/role`)
          .send({ role })
          .expect(200);
      },
    );

    then(/^the student's role should be updated to "(.*)"$/, async (role) => {
      const student = context.students[0]; // Use first student (the one we added)
      const group = await groupService.getGroupById(context.group.id);
      const member = group.members.find((m) => m.userId === student.id);
      expect(member.role).toBe(role);
    });
  });

  // ===========================================
  // Test: Professor demotes a leader to member
  // ===========================================
  test("Professor demotes a leader to member", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^student "(.*)" is a leader of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "LEADER");
    });

    when(
      /^I update student "(.*)" role to "(.*)" in the group$/,
      async (studentEmail, role) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .put(`/groups/${context.group.id}/members/${student.id}/role`)
          .send({ role })
          .expect(200);
      },
    );

    then(/^the student's role should be updated to "(.*)"$/, async (role) => {
      const student = context.students[0]; // Use first student (the one we added)
      const group = await groupService.getGroupById(context.group.id);
      const member = group.members.find((m) => m.userId === student.id);
      expect(member.role).toBe(role);
    });
  });

  // ===========================================
  // Test: Group leader can add members to their own group
  // ===========================================
  test("Group leader can add members to their own group", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student 1");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and("I am a leader of the group", async () => {
      await groupService.addGroupMember(
        context.group.id,
        context.user.id,
        "LEADER",
      );
    });

    when(
      /^I add student "(.*)" to the group as "(.*)"$/,
      async (studentEmail, role) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .post(`/groups/${context.group.id}/members`)
          .send({
            userId: student.id,
            role,
          })
          .expect(201);
      },
    );

    then("the student should be added to the group", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(2); // leader + new member
    });
  });

  // ===========================================
  // Test: Regular member cannot add other members
  // ===========================================
  test("Regular member cannot add other members", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student 1");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and("I am a member (not leader) of the group", async () => {
      await groupService.addGroupMember(
        context.group.id,
        context.user.id,
        "MEMBER",
      );
    });

    when(
      /^I attempt to add student "(.*)" to the group$/,
      async (studentEmail) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        try {
          context.response = await request
            .post(`/groups/${context.group.id}/members`)
            .send({
              userId: student.id,
              role: "MEMBER",
            });
        } catch (error) {
          context.apiError = error;
        }
      },
    );

    then("I should receive a 403 Forbidden error", () => {
      expect(context.response.status).toBe(403);
    });

    and("the student should not be added to the group", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(1); // Only the original member
    });
  });

  // ===========================================
  // Test: Professor removes a member from a group
  // ===========================================
  test("Professor removes a member from a group", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^student "(.*)" is a member of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "MEMBER");
    });

    when(/^I remove student "(.*)" from the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      context.response = await request
        .delete(`/groups/${context.group.id}/members/${student.id}`)
        .expect(204);
    });

    then("the student should be removed from the group", async () => {
      const student = context.students.find(
        (s) =>
          s.lookupEmail === "student1@ucsd.edu" ||
          s.email === "student1@ucsd.edu",
      );
      const group = await groupService.getGroupById(context.group.id);
      const member = group.members.find((m) => m.userId === student.id);
      expect(member).toBeUndefined();
    });

    and(/^the group should have (\d+) members$/, async (count) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.members.length).toBe(parseInt(count));
    });
  });

  // ===========================================
  // Test: Professor assigns a TA as supervisor
  // ===========================================
  test("Professor assigns a TA as supervisor", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there is a TA "(.*)" in the class$/, async (taEmail) => {
      context.ta = await userService.createUser({
        email: taEmail,
        name: "TA",
        preferredName: "TA",
      });

      await classRoleService.upsertClassRole({
        userId: context.ta.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(/^I add TA "(.*)" as a supervisor to the group$/, async (taEmail) => {
      context.response = await request
        .post(`/groups/${context.group.id}/supervisors`)
        .send({
          userId: context.ta.id,
        })
        .expect(201);
    });

    then("the TA should be assigned as supervisor", async () => {
      const group = await groupService.getGroupById(context.group.id);
      const supervisor = group.supervisors.find(
        (s) => s.userId === context.ta.id,
      );
      expect(supervisor).toBeDefined();
    });

    and(/^the group should have (\d+) supervisor$/, async (count) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.supervisors.length).toBe(parseInt(count));
    });
  });

  // ===========================================
  // Test: TA cannot add supervisors (professor-only operation)
  // ===========================================
  test("TA cannot add supervisors (professor-only operation)", ({
    given,
    and,
    when,
    then,
  }) => {
    let ta2;

    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "TA");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a TA in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is another TA "(.*)" in the class$/, async (taEmail) => {
      ta2 = await userService.createUser({
        email: taEmail,
        name: "TA 2",
        preferredName: "TA 2",
      });

      await classRoleService.upsertClassRole({
        userId: ta2.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(
      /^I attempt to add TA "(.*)" as a supervisor to the group$/,
      async (taEmail) => {
        try {
          context.response = await request
            .post(`/groups/${context.group.id}/supervisors`)
            .send({
              userId: ta2.id,
            });
        } catch (error) {
          context.apiError = error;
        }
      },
    );

    then("I should receive a 403 Forbidden error", () => {
      expect(context.response.status).toBe(403);
    });

    and("the TA should not be added as supervisor", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.supervisors.length).toBe(0);
    });
  });

  // ===========================================
  // Test: Professor removes a TA supervisor
  // ===========================================
  test("Professor removes a TA supervisor", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there is a TA "(.*)" in the class$/, async (taEmail) => {
      context.ta = await userService.createUser({
        email: taEmail,
        name: "TA",
        preferredName: "TA",
      });

      await classRoleService.upsertClassRole({
        userId: context.ta.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^TA "(.*)" is a supervisor of the group$/, async (taEmail) => {
      await groupService.addGroupSupervisor(context.group.id, context.ta.id);
    });

    when(
      /^I remove TA "(.*)" as supervisor from the group$/,
      async (taEmail) => {
        context.response = await request
          .delete(`/groups/${context.group.id}/supervisors/${context.ta.id}`)
          .expect(204);
      },
    );

    then("the TA should be removed as supervisor", async () => {
      const group = await groupService.getGroupById(context.group.id);
      const supervisor = group.supervisors.find(
        (s) => s.userId === context.ta.id,
      );
      expect(supervisor).toBeUndefined();
    });

    and(/^the group should have (\d+) supervisors$/, async (count) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.supervisors.length).toBe(parseInt(count));
    });
  });

  // ===========================================
  // Test: Professor updates group details
  // ===========================================
  test("Professor updates group details", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when("I update the group with:", async (table) => {
      const updateData = {};
      // jest-cucumber tables: array of row objects with column headers as keys
      // First row becomes headers, so we need to extract it separately
      const headers = Object.keys(table[0]);
      const keyColumn = headers[0]; // "name" (the field name column)
      const valueColumn = headers[1]; // The first row's value (e.g., "Team Alpha Updated")

      // The header row itself contains the first key-value pair
      // keyColumn value is "name", valueColumn value is "Team Alpha Updated"
      updateData[keyColumn] = valueColumn;

      // Remaining rows contain additional key-value pairs
      for (const row of table) {
        const key = row[keyColumn];
        const value = row[valueColumn];
        updateData[key] = value;
      }

      context.response = await request
        .put(`/groups/${context.group.id}`)
        .send(updateData)
        .set("Accept", "application/json")
        .expect(200);

      // Store the updated group from response
      context.group = context.response.body;
    });

    then(/^the group name should be "(.*)"$/, async (name) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.name).toBe(name);
    });

    and(/^the group mantra should be "(.*)"$/, async (mantra) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.mantra).toBe(mantra);
    });
  });

  // ===========================================
  // Test: TA can update group details
  // ===========================================
  test("TA can update group details", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "TA");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a TA in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(/^I update the group name to "(.*)"$/, async (newName) => {
      context.response = await request
        .put(`/groups/${context.group.id}`)
        .send({ name: newName })
        .expect(200);
    });

    then(/^the group name should be "(.*)"$/, async (name) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.name).toBe(name);
    });
  });

  // ===========================================
  // Test: Group leader can update their group details
  // ===========================================
  test("Group leader can update their group details", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student 1");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and("I am a leader of the group", async () => {
      await groupService.addGroupMember(
        context.group.id,
        context.user.id,
        "LEADER",
      );
    });

    when(/^I update the group mantra to "(.*)"$/, async (mantra) => {
      context.response = await request
        .put(`/groups/${context.group.id}`)
        .send({ mantra })
        .expect(200);
    });

    then(/^the group mantra should be "(.*)"$/, async (mantra) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.mantra).toBe(mantra);
    });
  });

  // ===========================================
  // Test: Regular member cannot update group details
  // ===========================================
  test("Regular member cannot update group details", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student 1");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and("I am a member (not leader) of the group", async () => {
      await groupService.addGroupMember(
        context.group.id,
        context.user.id,
        "MEMBER",
      );
    });

    when(/^I attempt to update the group name to "(.*)"$/, async (newName) => {
      try {
        context.response = await request
          .put(`/groups/${context.group.id}`)
          .send({ name: newName });
      } catch (error) {
        context.apiError = error;
      }
    });

    then("I should receive a 403 Forbidden error", () => {
      expect(context.response.status).toBe(403);
    });

    and(/^the group name should remain "(.*)"$/, async (originalName) => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group.name).toBe(originalName);
    });
  });

  // ===========================================
  // Test: Professor deletes a group
  // ===========================================
  test("Professor deletes a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when("I delete the group", async () => {
      context.response = await request
        .delete(`/groups/${context.group.id}`)
        .expect(204);
    });

    then("the group should be deleted", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group).toBeNull();
    });

    and("the group should not exist in the database", async () => {
      const group = await prisma.group.findUnique({
        where: { id: context.group.id },
      });
      expect(group).toBeNull();
    });
  });

  // ===========================================
  // Test: TA can delete a group
  // ===========================================
  test("TA can delete a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "TA");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a TA in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when("I delete the group", async () => {
      context.response = await request
        .delete(`/groups/${context.group.id}`)
        .expect(204);
    });

    then("the group should be deleted", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group).toBeNull();
    });
  });

  // ===========================================
  // Test: Student cannot delete a group
  // ===========================================
  test("Student cannot delete a group", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Student 1");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a student in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and("I am a leader of the group", async () => {
      await groupService.addGroupMember(
        context.group.id,
        context.user.id,
        "LEADER",
      );
    });

    when("I attempt to delete the group", async () => {
      try {
        context.response = await request.delete(`/groups/${context.group.id}`);
      } catch (error) {
        context.apiError = error;
      }
    });

    then("I should receive a 403 Forbidden error", () => {
      expect(context.response.status).toBe(403);
    });

    and("the group should still exist", async () => {
      const group = await groupService.getGroupById(context.group.id);
      expect(group).toBeDefined();
    });
  });

  // ===========================================
  // Test: Get all groups in a class
  // ===========================================
  test("Get all groups in a class", ({ given, and, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) groups in the class$/, async (count) => {
      for (let i = 1; i <= parseInt(count); i++) {
        await createGroup(`Team ${i}`);
      }
    });

    when("I get all groups for the class", async () => {
      const groups = await groupService.getGroupsByClassId(context.class.id);
      context.groups = groups;
    });

    then(/^I should receive (\d+) groups$/, (count) => {
      expect(context.groups.length).toBe(parseInt(count));
    });

    and("all groups should belong to the class", () => {
      context.groups.forEach((group) => {
        expect(group.classId).toBe(context.class.id);
      });
    });
  });

  // ===========================================
  // Test: Get group details with members and supervisors
  // ===========================================
  test("Get group details with members and supervisors", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a TA "(.*)" in the class$/, async (taEmail) => {
      context.ta = await userService.createUser({
        email: taEmail,
        name: "TA",
        preferredName: "TA",
      });

      await classRoleService.upsertClassRole({
        userId: context.ta.id,
        classId: context.class.id,
        role: "TA",
      });
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^student "(.*)" is a leader of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "LEADER");
    });

    and(/^student "(.*)" is a member of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "MEMBER");
    });

    and(/^TA "(.*)" is a supervisor of the group$/, async (taEmail) => {
      await groupService.addGroupSupervisor(context.group.id, context.ta.id);
    });

    when("I get details for the group", async () => {
      context.group = await groupService.getGroupById(context.group.id);
    });

    then(/^the group should have (\d+) members$/, (count) => {
      expect(context.group.members.length).toBe(parseInt(count));
    });

    and(/^the group should have (\d+) supervisor$/, (count) => {
      expect(context.group.supervisors.length).toBe(parseInt(count));
    });

    and(/^student "(.*)" should be a leader$/, (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      const member = context.group.members.find((m) => m.userId === student.id);
      expect(member.role).toBe("LEADER");
    });

    and(/^student "(.*)" should be a member$/, (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      const member = context.group.members.find((m) => m.userId === student.id);
      expect(member.role).toBe("MEMBER");
    });
  });

  // ===========================================
  // Test: Cannot add the same student to a group twice
  // ===========================================
  test("Cannot add the same student to a group twice", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(/^there are (\d+) students in the class$/, async (count) => {
      await createStudents(parseInt(count));
    });

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    and(/^student "(.*)" is a member of the group$/, async (studentEmail) => {
      const student = context.students.find(
        (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
      );
      await groupService.addGroupMember(context.group.id, student.id, "MEMBER");
    });

    when(
      /^I attempt to add student "(.*)" to the group again$/,
      async (studentEmail) => {
        const student = context.students.find(
          (s) => s.lookupEmail === studentEmail || s.email === studentEmail,
        );
        context.response = await request
          .post(`/groups/${context.group.id}/members`)
          .set("Accept", "application/json")
          .send({
            userId: student.id,
            role: "MEMBER",
          });
      },
    );

    then("I should receive a 400 Bad Request error", () => {
      expect(context.response.status).toBe(400);
    });

    and(/^the error message should mention "(.*)"$/, (messageFragment) => {
      const message =
        context.response.body?.message ||
        context.response.body?.error ||
        context.response.text ||
        "";
      expect(message.toLowerCase()).toContain(messageFragment.toLowerCase());
    });
  });

  // ===========================================
  // Test: Cannot add a user who is not in the class to a group
  // ===========================================
  test("Cannot add a user who is not in the class to a group", ({
    given,
    and,
    when,
    then,
  }) => {
    let outsider;

    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupBasicData(email, "Professor");
    });

    and(
      /^there is a class "(.*)" with invite code "(.*)"$/,
      async (className, inviteCode) => {
        // Already created
      },
    );

    and("I am a professor in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.class.id,
        role: "PROFESSOR",
      });
    });

    and(
      /^there is a user "(.*)" who is not in the class$/,
      async (userEmail) => {
        outsider = await userService.createUser({
          email: userEmail,
          name: "Outsider",
          preferredName: "Outsider",
        });
      },
    );

    and(/^there is a group "(.*)" in the class$/, async (groupName) => {
      context.group = await createGroup(groupName);
    });

    when(/^I attempt to add user "(.*)" to the group$/, async (userEmail) => {
      context.response = await request
        .post(`/groups/${context.group.id}/members`)
        .set("Accept", "application/json")
        .send({
          userId: outsider.id,
          role: "MEMBER",
        });
    });

    then("I should receive a 400 Bad Request error", () => {
      expect(context.response.status).toBe(400);
    });

    and(/^the error message should mention "(.*)"$/, (messageFragment) => {
      const message =
        context.response.body?.message ||
        context.response.body?.error ||
        context.response.text ||
        "";
      expect(message.toLowerCase()).toContain(messageFragment.toLowerCase());
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
