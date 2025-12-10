import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Main chat page
router.get("/", asyncHandler(chatController.handleRenderChatPage));

// Get conversations list
router.get("/conversations", asyncHandler(chatController.getConversations));

// Start a new conversation
router.post("/start", asyncHandler(chatController.startConversation));

// View conversation with a specific user (by recipient ID)
router.get(
  "/users/:recipientId",
  asyncHandler(chatController.viewConversation),
);

// Get or view conversation by conversation ID
router.get(
  "/conversations/:conversationId",
  asyncHandler(chatController.getConversation),
);

// Send a message in a conversation
router.post(
  "/conversations/:conversationId/messages",
  asyncHandler(chatController.sendMessage),
);

export default router;
