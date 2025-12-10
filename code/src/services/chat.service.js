/**
 * Chat Service
 * code/src/services/chat.service.js
 *
 * Handles database operations for conversations and messages
 */

import { prisma } from "../lib/prisma.js";

/**
 * Get or create a conversation between two users (optionally within a class)
 * @param {Object} params Conversation parameters
 * @param {string} params.userId1 First user ID
 * @param {string} params.userId2 Second user ID
 * @param {string} [params.classId] Optional class ID for context
 * @returns {Promise<Object>} Conversation object
 */
export async function getOrCreateConversation({
  userId1,
  userId2,
  classId = null,
}) {
  // Ensure consistent ordering (smaller ID first) for uniqueness
  const [user1, user2] = [userId1, userId2].sort();

  const includeOptions = {
    user1: {
      select: {
        id: true,
        name: true,
        preferredName: true,
        photoUrl: true,
        email: true,
      },
    },
    user2: {
      select: {
        id: true,
        name: true,
        preferredName: true,
        photoUrl: true,
        email: true,
      },
    },
    class: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  // When classId is null, Prisma can't use it in unique constraint for upsert
  // So we need to query first, then create if not found
  if (classId === null) {
    // Try to find existing conversation without classId
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId1: user1,
        userId2: user2,
        classId: null,
      },
      include: includeOptions,
    });

    // If not found, create it
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId1: user1,
          userId2: user2,
          classId: null,
        },
        include: includeOptions,
      });
    }

    return conversation;
  }

  // When classId is provided, we can use upsert with the unique constraint
  return prisma.conversation.upsert({
    where: {
      unique_conversation: {
        userId1: user1,
        userId2: user2,
        classId: classId,
      },
    },
    update: {},
    create: {
      userId1: user1,
      userId2: user2,
      classId: classId,
    },
    include: includeOptions,
  });
}

/**
 * Get all conversations for a user
 * @param {string} userId User ID
 * @returns {Promise<Array>} Array of conversations with participant info and latest message
 */
export async function getUserConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          photoUrl: true,
          email: true,
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          photoUrl: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              photoUrl: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform to include the other participant and latest message
  return conversations.map((conv) => {
    const otherUser = conv.userId1 === userId ? conv.user2 : conv.user1;
    const latestMessage = conv.messages[0] || null;

    return {
      id: conv.id,
      otherUser,
      class: conv.class,
      latestMessage,
      unreadCount: 0, // TODO: implement unread count
      updatedAt: conv.updatedAt,
    };
  });
}

/**
 * Get a conversation by ID (with authorization check)
 * @param {string} conversationId Conversation ID
 * @param {string} userId User ID (must be a participant)
 * @returns {Promise<Object|null>} Conversation object or null
 */
export async function getConversationById(conversationId, userId) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          photoUrl: true,
          email: true,
        },
      },
      user2: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          photoUrl: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return conversation;
}

/**
 * Get messages for a conversation
 * @param {string} conversationId Conversation ID
 * @param {string} userId User ID (for authorization)
 * @param {Object} [options] Query options
 * @param {number} [options.limit] Maximum number of messages to return
 * @param {number} [options.skip] Number of messages to skip
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(
  conversationId,
  userId,
  options = {},
) {
  const { limit = 50, skip = 0 } = options;

  // First verify user has access to this conversation
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return [];
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    skip,
  });

  return messages;
}

/**
 * Create a new message in a conversation
 * @param {Object} params Message parameters
 * @param {string} params.conversationId Conversation ID
 * @param {string} params.senderId Sender user ID
 * @param {string} params.content Message content
 * @returns {Promise<Object>} Created message
 */
export async function createMessage({ conversationId, senderId, content }) {
  // Verify sender is a participant in the conversation
  const conversation = await getConversationById(conversationId, senderId);
  if (!conversation) {
    throw new Error("Conversation not found or access denied");
  }

  // Create the message and update conversation timestamp
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            photoUrl: true,
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return message;
}

/**
 * Get available chat recipients for a student (professors, TAs, tutors in their classes)
 * @param {string} userId Student user ID
 * @returns {Promise<Array>} Array of users with their roles and classes
 */
export async function getAvailableRecipients(userId) {
  // Get all classes the user is in
  const userClassRoles = await prisma.classRole.findMany({
    where: { userId },
    include: {
      class: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  preferredName: true,
                  photoUrl: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Extract recipients (PROFESSOR, TA, TUTOR) from all classes
  const recipientMap = new Map();

  userClassRoles.forEach((userRole) => {
    const classMembers = userRole.class.members;

    classMembers.forEach((member) => {
      // Skip self and students
      if (member.userId === userId || member.role === "STUDENT") {
        return;
      }

      // Only include PROFESSOR, TA, TUTOR
      if (["PROFESSOR", "TA", "TUTOR"].includes(member.role)) {
        const recipientId = member.userId;

        if (!recipientMap.has(recipientId)) {
          recipientMap.set(recipientId, {
            user: member.user,
            roles: [],
            classes: [],
          });
        }

        const recipient = recipientMap.get(recipientId);

        // Add role if not already present
        if (!recipient.roles.includes(member.role)) {
          recipient.roles.push(member.role);
        }

        // Add class if not already present
        const classInfo = {
          id: userRole.class.id,
          name: userRole.class.name,
          role: member.role,
        };

        if (!recipient.classes.some((c) => c.id === classInfo.id)) {
          recipient.classes.push(classInfo);
        }
      }
    });
  });

  return Array.from(recipientMap.values());
}
