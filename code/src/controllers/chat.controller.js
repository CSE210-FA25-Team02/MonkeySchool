/**
 * Chat Controller
 * code/src/controllers/chat.controller.js
 */

import * as chatService from "../services/chat.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, BadRequestError } from "../utils/api-error.js";
import { createBaseLayout } from "../utils/html-templates.js";
import {
  renderChatPage,
  renderConversationView,
  renderConversationList,
  renderMessage,
} from "../utils/htmx-templates/chat-templates.js";

/**
 * Render the main chat page with conversation list
 * Auth: requireAuth
 */
export const handleRenderChatPage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isHtmx = !!req.headers["hx-request"];

  // Get user's conversations
  const conversations = await chatService.getUserConversations(userId);

  // Get available recipients (for students to start new chats)
  let recipients = [];
  try {
    recipients = await chatService.getAvailableRecipients(userId);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    // Continue with empty recipients
  }

  const content = renderChatPage(conversations, recipients, userId);

  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("Chat", content, { user: req.user });
    res.send(fullPage);
  }
});

/**
 * Start or view a conversation with a specific user
 * Auth: requireAuth
 */
export const viewConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { recipientId } = req.params;
  const { classId } = req.query;
  const isHtmx = !!req.headers["hx-request"];

  if (!recipientId) {
    throw new BadRequestError("Recipient ID is required");
  }

  // Get or create conversation
  const conversation = await chatService.getOrCreateConversation({
    userId1: userId,
    userId2: recipientId,
    classId: classId || null,
  });

  // Get messages
  const messages = await chatService.getConversationMessages(
    conversation.id,
    userId,
  );

  // Determine the other participant
  const otherUser =
    conversation.userId1 === userId ? conversation.user2 : conversation.user1;

  const content = renderConversationView(
    conversation,
    messages,
    userId,
    otherUser,
  );

  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("Chat", content, { user: req.user });
    res.send(fullPage);
  }
});

/**
 * Get conversation by ID
 * Auth: requireAuth
 */
export const getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const isHtmx = !!req.headers["hx-request"];

  const conversation = await chatService.getConversationById(
    conversationId,
    userId,
  );

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  // Get messages
  const messages = await chatService.getConversationMessages(
    conversationId,
    userId,
  );

  // Determine the other participant
  const otherUser =
    conversation.userId1 === userId ? conversation.user2 : conversation.user1;

  const content = renderConversationView(
    conversation,
    messages,
    userId,
    otherUser,
  );

  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("Chat", content, { user: req.user });
    res.send(fullPage);
  }
});

/**
 * Send a message in a conversation
 * Auth: requireAuth
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const { content } = req.body;
  const isHtmx = !!req.headers["hx-request"];

  if (!content || content.trim() === "") {
    throw new BadRequestError("Message content is required");
  }

  // Create message
  const message = await chatService.createMessage({
    conversationId,
    senderId: userId,
    content: content.trim(),
  });

  if (isHtmx) {
    // Return the new message HTML
    const messageHtml = renderMessage(message, userId);
    res.status(201).send(messageHtml);
  } else {
    res.status(201).json(message);
  }
});

/**
 * Start a new conversation with a recipient
 * Auth: requireAuth
 */
export const startConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { recipientId } = req.body;
  const { classId } = req.body;
  const isHtmx = !!req.headers["hx-request"];

  if (!recipientId) {
    throw new BadRequestError("Recipient ID is required");
  }

  // Get or create conversation
  const conversation = await chatService.getOrCreateConversation({
    userId1: userId,
    userId2: recipientId,
    classId: classId || null,
  });

  // Get messages (will be empty for new conversation)
  const messages = await chatService.getConversationMessages(
    conversation.id,
    userId,
  );

  // Determine the other participant
  const otherUser =
    conversation.userId1 === userId ? conversation.user2 : conversation.user1;

  const content = renderConversationView(
    conversation,
    messages,
    userId,
    otherUser,
  );

  if (isHtmx) {
    // Return conversation view directly
    res.send(content);
  } else {
    res.redirect(`/chat/conversations/${conversation.id}`);
  }
});

/**
 * Get conversation list (for HTMX updates)
 * Auth: requireAuth
 */
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isHtmx = !!req.headers["hx-request"];

  const conversations = await chatService.getUserConversations(userId);

  if (isHtmx) {
    const content = renderConversationList(conversations, userId);
    res.send(content);
  } else {
    res.json(conversations);
  }
});
