// code/tests/group/group.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as userService from "../../src/services/user.service.js";
import * as authService from "../../src/services/auth.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as groupService from "../../src/services/group.service.js";
import * as groupRoleService from "../../src/services/groupRole.service.js";

const feature = loadFeature("./features/group.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.ta = undefined;
    context.student = undefined;
    context.klass = undefined;
    context.group = undefined;
    context.response = undefined;
  });

  test("TA creates a new group", ({ given, and, when, then }) => {
    given("a TA user exists", async () => {
      context.ta = await userService.createUser({
        email: "ta@ucsd.edu",
        name: "TA User",
        isProf: false,
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^the TA is assigned to the class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        await classRoleService.upsertClassRole({
          userId: context.ta.id,
          classId: context.klass.id,
          role: role,
        });
      }
    );

    when(
      /^the TA creates a group named "(.*)" in class "(.*)"$/,
      async (groupName, className) => {
        const authToken = authService.generateToken({ id: context.ta.id });
        context.response = await request
          .post("/api/groups")
          .set("Cookie", `auth_token=${authToken}`)
          .send({
            name: groupName,
            classId: context.klass.id,
          });
      }
    );

    then(/^a group named "(.*)" should exist$/, async (groupName) => {
      const group = await prisma.group.findFirst({
        where: { name: groupName },
      });
      expect(group).not.toBeNull();
      context.group = group;
    });

    and(/^the group should belong to class "(.*)"$/, async (className) => {
      expect(context.group.classId).toBe(context.klass.id);
    });
  });

  test("TA assigns members to a group", ({ given, and, when, then }) => {
    given("a TA user exists", async () => {
      context.ta = await userService.createUser({
        email: "ta@ucsd.edu",
        name: "TA User",
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^the TA is assigned to the class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        await classRoleService.upsertClassRole({
          userId: context.ta.id,
          classId: context.klass.id,
          role: role,
        });
      }
    );

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
          createdById: context.ta.id,
        });
      }
    );

    and(/^a student "(.*)" exists$/, async (studentName) => {
      const student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
      await classRoleService.upsertClassRole({
        userId: student.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
      context[studentName] = student;
    });

    when(
      /^the TA assigns "(.*)" and "(.*)" to group "(.*)"$/,
      async (student1, student2, groupName) => {
        const authToken = authService.generateToken({ id: context.ta.id });
        context.response = await request
          .post(`/api/groups/${context.group.id}/members`)
          .set("Cookie", `auth_token=${authToken}`)
          .send({
            memberIds: [context[student1].id, context[student2].id],
          });
      }
    );

    then(
      /^group "(.*)" should have (\d+) members$/,
      async (groupName, count) => {
        const members = await groupRoleService.getGroupMembers(
          context.group.id
        );
        expect(members.length).toBe(parseInt(count));
      }
    );
  });

  test("Student views their group", ({ given, and, when, then }) => {
    given(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^the student "(.*)" is assigned to class "(.*)"$/,
      async (studentName, className) => {
        await classRoleService.upsertClassRole({
          userId: context.student.id,
          classId: context.klass.id,
          role: "STUDENT",
        });
      }
    );

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
        });
      }
    );

    and(
      /^the student "(.*)" is a member of group "(.*)"$/,
      async (studentName, groupName) => {
        await groupRoleService.upsertGroupRole({
          userId: context.student.id,
          groupId: context.group.id,
          role: "MEMBER",
        });
      }
    );

    when(/^the student "(.*)" views their groups$/, async (studentName) => {
      const authToken = authService.generateToken({ id: context.student.id });
      context.response = await request
        .get("/api/groups/user/groups")
        .set("Cookie", `auth_token=${authToken}`);
    });

    then(/^they should see group "(.*)"$/, async (groupName) => {
      expect(context.response.status).toBe(200);
      const groups = context.response.body;
      expect(groups.some((g) => g.name === groupName)).toBe(true);
    });
  });

  test("Team Leader edits group details", ({ given, and, when, then }) => {
    given(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
        });
      }
    );

    and(
      /^the student "(.*)" is the leader of group "(.*)"$/,
      async (studentName, groupName) => {
        await groupRoleService.upsertGroupRole({
          userId: context.student.id,
          groupId: context.group.id,
          role: "LEADER",
        });
        await prisma.group.update({
          where: { id: context.group.id },
          data: { leaderId: context.student.id },
        });
      }
    );

    when(
      /^the student "(.*)" updates group "(.*)" name to "(.*)"$/,
      async (studentName, oldName, newName) => {
        const authToken = authService.generateToken({ id: context.student.id });
        context.response = await request
          .put(`/api/groups/${context.group.id}`)
          .set("Cookie", `auth_token=${authToken}`)
          .send({ name: newName });
      }
    );

    then(/^group "(.*)" should exist$/, async (groupName) => {
      const group = await prisma.group.findFirst({
        where: { name: groupName },
      });
      expect(group).not.toBeNull();
    });

    and(
      /^group "(.*)" should have the same members as "(.*)"$/,
      async (newName, oldName) => {
        const newGroup = await prisma.group.findFirst({
          where: { name: newName },
        });
        const oldMembers = await groupRoleService.getGroupMembers(
          context.group.id
        );
        const newMembers = await groupRoleService.getGroupMembers(newGroup.id);
        expect(newMembers.length).toBe(oldMembers.length);
      }
    );
  });

  test("Team Leader cannot change group members", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
        });
      }
    );

    and(
      /^the student "(.*)" is the leader of group "(.*)"$/,
      async (studentName, groupName) => {
        await groupRoleService.upsertGroupRole({
          userId: context.student.id,
          groupId: context.group.id,
          role: "LEADER",
        });
        await prisma.group.update({
          where: { id: context.group.id },
          data: { leaderId: context.student.id },
        });
      }
    );

    and(/^a student "(.*)" exists$/, async (studentName) => {
      const student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
      await classRoleService.upsertClassRole({
        userId: student.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
      context[studentName] = student;
    });

    when(
      /^the student "(.*)" tries to add "(.*)" to group "(.*)"$/,
      async (leaderName, studentName, groupName) => {
        const authToken = authService.generateToken({ id: context.student.id });
        context.response = await request
          .post(`/api/groups/${context.group.id}/members`)
          .set("Cookie", `auth_token=${authToken}`)
          .send({
            memberIds: [context[studentName].id],
          });
      }
    );

    then("the request should be forbidden", () => {
      expect(context.response.status).toBe(403);
    });

    and(
      /^"(.*)" should not be a member of group "(.*)"$/,
      async (studentName, groupName) => {
        const members = await groupRoleService.getGroupMembers(
          context.group.id
        );
        expect(members.some((m) => m.userId === context[studentName].id)).toBe(
          false
        );
      }
    );
  });

  test("TA deletes a group", ({ given, and, when, then }) => {
    given("a TA user exists", async () => {
      context.ta = await userService.createUser({
        email: "ta@ucsd.edu",
        name: "TA User",
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^the TA is assigned to the class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        await classRoleService.upsertClassRole({
          userId: context.ta.id,
          classId: context.klass.id,
          role: role,
        });
      }
    );

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
          createdById: context.ta.id,
        });
      }
    );

    when(/^the TA deletes group "(.*)"$/, async (groupName) => {
      const authToken = authService.generateToken({ id: context.ta.id });
      context.response = await request
        .delete(`/api/groups/${context.group.id}`)
        .set("Cookie", `auth_token=${authToken}`);
    });

    then(/^no group named "(.*)" should exist$/, async (groupName) => {
      const group = await prisma.group.findFirst({
        where: { name: groupName },
      });
      expect(group).toBeNull();
    });
  });

  test("Student cannot delete a group", ({ given, and, when, then }) => {
    given(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await userService.createUser({
        email: `${studentName.toLowerCase()}@ucsd.edu`,
        name: studentName,
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({
        name: className,
        quarter: "FA25",
      });
    });

    and(
      /^a group "(.*)" exists in class "(.*)"$/,
      async (groupName, className) => {
        context.group = await groupService.createGroup({
          name: groupName,
          classId: context.klass.id,
        });
      }
    );

    and(
      /^the student "(.*)" is a member of group "(.*)"$/,
      async (studentName, groupName) => {
        await groupRoleService.upsertGroupRole({
          userId: context.student.id,
          groupId: context.group.id,
          role: "MEMBER",
        });
      }
    );

    when(
      /^the student "(.*)" tries to delete group "(.*)"$/,
      async (studentName, groupName) => {
        const authToken = authService.generateToken({ id: context.student.id });
        context.response = await request
          .delete(`/api/groups/${context.group.id}`)
          .set("Cookie", `auth_token=${authToken}`);
      }
    );

    then("the request should be forbidden", () => {
      expect(context.response.status).toBe(403);
    });

    and(/^group "(.*)" should still exist$/, async (groupName) => {
      const group = await prisma.group.findFirst({
        where: { name: groupName },
      });
      expect(group).not.toBeNull();
    });
  });
});
