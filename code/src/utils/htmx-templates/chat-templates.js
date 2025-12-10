/**
 * HTMX Templates for Chat Interface
 * code/src/utils/htmx-templates/chat-templates.js
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Format date/time for display
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date/time string
 */
function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

/**
 * Get user display name
 * @param {Object} user - The user object
 * @returns {string} The display name
 */
function getUserDisplayName(user) {
  return user?.preferredName || user?.name || "Unknown User";
}

/**
 * Get user initials
 * @param {Object} user - The user object
 * @returns {string} The initials
 */
function getUserInitials(user) {
  const name = getUserDisplayName(user);
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Render the main chat page
 * @param {Array} conversations - List of conversations
 * @param {Array} recipients - List of possible recipients for new chats
 * @param {string} currentUserId - ID of the current user
 * @returns {string} The HTML string for the chat page
 */
export function renderChatPage(
  conversations = [],
  recipients = [],
  currentUserId,
) {
  return `
    <div id="chat-page-root">
      <div class="chat-container">
        <!-- Conversation List Sidebar -->
        <div class="chat-sidebar">
          <div class="chat-sidebar-header">
            <h2>Messages</h2>
            <button
              onclick="openModal('modal-new-chat')"
              class="btn btn-primary"
              title="Start new conversation"
            >
              <i class="fa-solid fa-plus"></i> New
            </button>
          </div>
          <div id="conversation-list">
            ${renderConversationList(conversations, currentUserId)}
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chat-main">
          <div class="chat-placeholder">
            <div>
              <i class="fa-solid fa-comments"></i>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        </div>
      </div>

      <!-- New Chat Modal -->
      ${renderNewChatModal(recipients)}
    </div>
  `;
}

/**
 * Render conversation list
 * @param {Array} conversations - List of conversations
 * @returns {string} The HTML string for the conversation list
 */
export function renderConversationList(conversations) {
  if (conversations.length === 0) {
    return `
      <div class="conversation-list-empty">
        <p>No conversations yet. Start a new chat to begin!</p>
      </div>
    `;
  }

  return conversations
    .map((conv) => {
      const otherUser = conv.otherUser;
      const displayName = getUserDisplayName(otherUser);
      const initials = getUserInitials(otherUser);
      const latestMessage = conv.latestMessage;
      const preview = latestMessage
        ? latestMessage.content.length > 50
          ? latestMessage.content.substring(0, 50) + "..."
          : latestMessage.content
        : "No messages yet";
      const timeAgo = latestMessage
        ? formatDateTime(latestMessage.createdAt)
        : formatDateTime(conv.updatedAt);
      const isUnread = conv.unreadCount > 0;

      return `
        <div
          class="conversation-item ${isUnread ? "unread" : ""}"
          hx-get="/chat/conversations/${conv.id}"
          hx-target=".chat-main"
          hx-swap="innerHTML"
        >
          <div>
            <div class="avatar">
              ${initials}
            </div>
            <div class="conversation-content">
              <div class="conversation-header">
                <div class="conversation-name">
                  ${escapeHtml(displayName)}
                </div>
                <div class="conversation-time">
                  ${escapeHtml(timeAgo)}
                </div>
              </div>
              <div class="conversation-preview">
                ${escapeHtml(preview)}
              </div>
              ${
                conv.class
                  ? `<div class="conversation-class">
                    ${escapeHtml(conv.class.name)}
                  </div>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Render conversation view with messages
 * @param {Object} conversation - The conversation object
 * @param {Array} messages - List of messages in the conversation
 * @param {string} currentUserId - ID of the current user
 * @param {Object} otherUser - The other user in the conversation
 * @returns {string} The HTML string for the conversation view
 */
export function renderConversationView(
  conversation,
  messages,
  currentUserId,
  otherUser,
) {
  const displayName = getUserDisplayName(otherUser);
  const initials = getUserInitials(otherUser);

  return `
    <div class="chat-conversation">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="avatar">
          ${initials}
        </div>
        <div class="chat-header-info">
          <div class="chat-header-name">
            ${escapeHtml(displayName)}
          </div>
          ${
            conversation.class
              ? `<div class="chat-header-class">
                ${escapeHtml(conversation.class.name)}
              </div>`
              : ""
          }
        </div>
      </div>

      <!-- Messages Area -->
      <div
        id="messages-container"
        class="chat-messages"
      >
        ${
          messages.length === 0
            ? `<div id="empty-messages-placeholder">
              <p>No messages yet. Start the conversation!</p>
            </div>`
            : messages.map((msg) => renderMessage(msg, currentUserId)).join("")
        }
      </div>

      <!-- Message Input -->
      <div class="chat-input-area">
        <form
          hx-post="/chat/conversations/${conversation.id}/messages"
          hx-target="#messages-container"
          hx-swap="beforeend"
          hx-on::after-request="
            if(event.detail.successful) {
              this.reset(); 
              const container = document.getElementById('messages-container');
              if (container) {
                // Remove placeholder if it exists
                const placeholder = document.getElementById('empty-messages-placeholder');
                if (placeholder) {
                  placeholder.remove();
                }
                // Scroll to bottom after a brief delay to ensure DOM is updated
                setTimeout(() => {
                  container.scrollTop = container.scrollHeight;
                }, 100);
              }
            }
          "
        >
          <input
            type="text"
            name="content"
            placeholder="Type a message..."
            required
          />
          <button
            type="submit"
            class="btn btn-primary"
          >
            <i class="fa-solid fa-paper-plane"></i> Send
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * Render a single message
 * @param {Object} message - The message object
 * @param {string} currentUserId - ID of the current user
 * @returns {string} The HTML string for the message
 */
export function renderMessage(message, currentUserId) {
  const isOwnMessage = message.senderId === currentUserId;
  const senderName = getUserDisplayName(message.sender);
  const initials = getUserInitials(message.sender);
  const time = formatDateTime(message.createdAt);

  return `
    <div
      class="message ${isOwnMessage ? "message-own" : "message-other"}"
    >
      ${
        !isOwnMessage
          ? `<div class="avatar">
            ${initials}
          </div>`
          : ""
      }
      <div class="message-content">
        ${
          !isOwnMessage && message.sender
            ? `<div class="message-sender">
              ${escapeHtml(senderName)}
            </div>`
            : ""
        }
        <div class="message-bubble">
          ${escapeHtml(message.content)}
        </div>
        <div class="message-time">
          ${escapeHtml(time)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render new chat modal
 * @param {Array} recipients - List of possible recipients for new chats
 * @returns {string} The HTML string for the new chat modal
 */
function renderNewChatModal(recipients) {
  if (recipients.length === 0) {
    return `
      <div id="modal-new-chat" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Start New Conversation</h3>
            <button onclick="closeModal('modal-new-chat')" class="btn-close">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>No available recipients found. You need to be enrolled in a class with professors, TAs, or tutors.</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div id="modal-new-chat" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Start New Conversation</h3>
          <button onclick="closeModal('modal-new-chat')" class="btn-close">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="recipient-list">
            ${recipients
              .map((recipient) => {
                const displayName = getUserDisplayName(recipient.user);
                const initials = getUserInitials(recipient.user);
                const roles = recipient.roles.join(", ");
                const classes = recipient.classes
                  .map((c) => `${c.name} (${c.role})`)
                  .join(", ");

                return `
                  <div
                    class="recipient-item"
                    onclick="window.startConversation && window.startConversation('${recipient.user.id}')"
                  >
                    <div>
                      <div class="avatar">
                        ${initials}
                      </div>
                      <div class="recipient-info">
                        <div class="recipient-name">
                          ${escapeHtml(displayName)}
                        </div>
                        <div class="recipient-roles">
                          ${escapeHtml(roles)}
                        </div>
                        <div class="recipient-classes">
                          ${escapeHtml(classes)}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    </div>
    <script>
      // Make startConversation available globally
      window.startConversation = function(recipientId) {
        if (typeof closeModal === 'function') {
          closeModal('modal-new-chat');
        }
        
        // Use HTMX to submit
        if (typeof htmx !== 'undefined') {
          htmx.ajax('POST', '/chat/start', {
            values: { recipientId: recipientId },
            target: '.chat-main',
            swap: 'innerHTML'
          });
        } else {
          console.error('HTMX not loaded');
        }
      };
    </script>
  `;
}
