import { prisma } from "../lib/prisma.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  PermissionError,
  BusinessLogicError,
  LastProfessorError,
  SelfRemovalError,
  DuplicateMemberError
} from '../utils/api-error.js';

const VALID_ROLES = ["PROFESSOR", "TA", "STUDENT", "TUTOR"];

export const createClassRoleService = (prismaClient) => ({
  /**
   * Validate if the requester has professor permission in the class
   * @param {*} classId 
   * @param {*} requesterId 
   * @returns {Promise<void>}
   */
  async validateProfessorPermission(classId, requesterId) {
    // if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    //   console.log(`[DEV] Bypassing auth check for user: ${requesterId}`);
    //   return; // Skip all permission checks
    // }
    // First check if the user exists at all
    let user = await prismaClient.user.findUnique({
      where: { id: requesterId }
    });

    if (!user) {
      throw new NotFoundError(`User ${requesterId} not found`);
    }
    // Check if user has global professor privileges (isProf = true)
    if (user.isProf === true) {
      console.log(`[AUTH] User ${requesterId} has global professor access (isProf=true)`);
      return;
    }
    // Then check their role in this specific class
    const requesterRole = await prismaClient.classRole.findUnique({
      where: { user_class_unique: { userId: requesterId, classId } }
    });

    if (!requesterRole) {
      throw new ForbiddenError(
        'You are not a member of this class'
      );
    }

    if (requesterRole.role !== 'PROFESSOR') {
      throw new PermissionError(
        'Only professors can modify class roles',
        'PROFESSOR',
        requesterRole.role
      );
    }
  },
  /**
   * Ensure that the user is not the last professor in the class when user want to delete the professor role
   * @param {*} classId 
   * @param {*} userId 
   * @returns {Promise<void>}
   */
  async ensureNotLastProfessor(classId, userId) {
    const professorCount = await prismaClient.classRole.count({
      where: { classId, role: 'PROFESSOR' }
    });

    const currentRole = await prismaClient.classRole.findUnique({
      where: { user_class_unique: { userId, classId } }
    });

    if (currentRole?.role === 'PROFESSOR' && professorCount <= 1) {
      throw new LastProfessorError(classId);
    }
  },

  /**
   * Get the roster of the class
   * @param {*} classId 
   * @returns {Promise<Array<ClassRole>>}
   */
  async getRoster(classId) {
    // Validate classId exists first
    const classExists = await prismaClient.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      throw new NotFoundError(`Class ${classId} not found`);
    }

    return prismaClient.classRole.findMany({
      where: {
        classId,
      },
      // TODO, not all entries are needed 
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            pronunciation: true,
            pronouns: true,
            phone: true,
            github: true,
            timezone: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { user: { name: 'asc' } }
      ],
    });
  },

  /**
   * Update the role of the user in the class
   * @param {*} classId 
   * @param {*} userId 
   * @param {*} role 
   * @param {*} requesterId 
   * @returns {Promise<ClassRole>}
   */
  async updateUserRoleByClass(classId, userId, role, requesterId) {
    const validRoles = ['PROFESSOR', 'TA', 'STUDENT', 'TUTOR'];
    const normalizedRole = role.toUpperCase();

    if (!validRoles.includes(normalizedRole)) {
      throw new ValidationError(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    }

    // Check permissions
    await this.validateProfessorPermission(classId, requesterId);

    // Validate both user and class exist
    const [user, classExists] = await Promise.all([
      prismaClient.user.findUnique({ where: { id: userId } }),
      prismaClient.class.findUnique({ where: { id: classId } })
    ]);

    if (!user) throw new NotFoundError(`User ${userId} not found`);
    if (!classExists) throw new NotFoundError(`Class ${classId} not found`);

    // Prevent demoting the last professor
    if (normalizedRole !== 'PROFESSOR') {
      await this.ensureNotLastProfessor(classId, userId);
    }

    const updatedRole = await prismaClient.classRole.upsert({
      where: { user_class_unique: { userId, classId } },
      update: {
        role: normalizedRole,
      },
      create: {
        userId,
        classId,
        role: normalizedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true
          }
        }
      },
    });

    return updatedRole;
  },

  /**
   * Remove the user from the class
   * @param {*} classId 
   * @param {*} userId 
   * @param {*} requesterId 
   * @returns {Promise<void>}
   * @throws {NotFoundError} if the user is not found in the class
   * @throws {BusinessLogicError} if the user is the last professor in the class
   * */
  async removeUserFromClass(classId, userId, requesterId) {
    // 1. Check if requester has professor permission in this class
    await this.validateProfessorPermission(classId, requesterId);

    // 2. Check if the user exists in the class
    const existing = await prismaClient.classRole.findUnique({
      where: { user_class_unique: { userId, classId } },
      include: { user: { select: { name: true } } }
    });

    if (!existing) {
      throw new NotFoundError(`User ${userId} not found in class ${classId}`);
    }

    // 3. Prevent removing the last professor
    if (existing.role === 'PROFESSOR') {
      const professorCount = await prismaClient.classRole.count({
        where: { classId, role: 'PROFESSOR' }
      });

      if (professorCount <= 1) {
        throw new BusinessLogicError('Cannot remove the last professor from the class');
      }
    }

    // 4. Prevent professors from removing themselves (optional business rule)
    if (requesterId === userId && existing.role === 'PROFESSOR') {
      throw new BusinessLogicError('Professors cannot remove themselves from the class');
    }

    // 5. Execute the removal in a transaction
    await prismaClient.$transaction([
      prismaClient.groupRole.deleteMany({
        where: { userId, group: { classId } }
      }),
      prismaClient.groupSupervisor.deleteMany({
        where: { userId, group: { classId } }
      }),
      prismaClient.classRole.delete({
        where: { user_class_unique: { userId, classId } }
      }),
    ]);

    return {
      success: true,
      message: `User ${existing.user.name} removed from class ${classId}`,
      removedUser: {
        id: userId,
        name: existing.user.name,
        role: existing.role
      }
    };
  },
});


// /**
//  * Assign or update a user's role in a class.
//  */
// export async function upsertClassRole({ userId, classId, role }) {
//   const normalized = role.trim().toUpperCase();

//   if (!VALID_ROLES.includes(normalized)) {
//     throw new Error(`Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}`);
//   }

//   return prisma.classRole.upsert({
//     where: { user_class_unique: { userId, classId } },
//     update: { role: normalized },
//     create: { userId, classId, role: normalized }
//   });
// }

// /**
//  * Remove a user from a class.
//  */
// export async function removeFromClass({ userId, classId }) {
//   return prisma.classRole.delete({
//     where: { user_class_unique: { userId, classId } }
//   });
// }

// /**
//  * Get roster for a class (sorted by role).
//  */
// export async function getRoster(classId) {
//   return prisma.classRole.findMany({
//     where: { classId },
//     include: { user: true },
//     orderBy: { role: "asc" }
//   });
// }
