import { z } from 'zod';
  export const classIdSchema = z.object({
    params: z.object({
      classId: z.string().cuid('Invalid class ID format')
    })
  });

  export const userIdSchema = z.object({
    params: z.object({
      userId: z.string().cuid('Invalid user ID format')
    })
  });

  export const updateRoleSchema = z.object({
    body: z.object({
      role: z.enum(['PROFESSOR', 'TA', 'STUDENT', 'TUTOR'], {
        errorMap: () => ({ message: 'Role must be PROFESSOR, TA, STUDENT, or TUTOR' })
      })
    }),
    params: z.object({
      classId: z.string().cuid('Invalid class ID format'),
      userId: z.string().cuid('Invalid user ID format')
    })
  });

  export const removeUserSchema = z.object({
    params: z.object({
      classId: z.string().cuid('Invalid class ID format'),
      userId: z.string().cuid('Invalid user ID format')
    })
  });