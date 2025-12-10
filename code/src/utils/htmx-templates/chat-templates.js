/**
 * HTMX Templates for Chat Interface
 * code/src/utils/htmx-templates/chat-templates.js
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Format date/time for display
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
 */
function getUserDisplayName(user) {
  return user?.preferredName || user?.name || "Unknown User";
}

/**
 * Get user initials
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
 */
export function renderChatPage(
  conversations = [],
  recipients = [],
  currentUserId,
) {
  return `
    <div id="chat-page-root">
      <div class="chat-container" style="display: grid; grid-template-columns: 350px 1fr; height: calc(100vh - 120px); gap: var(--space-4);">
        <!-- Conversation List Sidebar -->
        <div class="chat-sidebar" style="border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: white; overflow-y: auto;">
          <div class="chat-sidebar-header" style="padding: var(--space-4); border-bottom: 1px solid var(--color-border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Messages</h2>
            <button
              onclick="openModal('modal-new-chat')"
              class="btn btn-primary"
              style="padding: 6px 12px; font-size: 12px;"
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
        <div class="chat-main" style="border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: white; display: flex; flex-direction: column;">
          <div class="chat-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted);">
            <div style="text-align: center;">
              <i class="fa-solid fa-comments" style="font-size: 48px; margin-bottom: var(--space-4); opacity: 0.3;"></i>
              <p style="font-size: 16px; margin: 0;">Select a conversation to start chatting</p>
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
 */
export function renderConversationList(conversations, currentUserId) {
  if (conversations.length === 0) {
    return `
      <div style="padding: var(--space-6); text-align: center; color: var(--color-text-muted);">
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
          style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-subtle); cursor: pointer; transition: background 0.2s;"
          hx-get="/chat/conversations/${conv.id}"
          hx-target=".chat-main"
          hx-swap="innerHTML"
          onclick="this.style.background='var(--color-bg-subtle)'"
        >
          <div style="display: flex; gap: var(--space-3); align-items: center;">
            <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0;">
              ${
                otherUser.photoUrl
                  ? `<img src="${escapeHtml(otherUser.photoUrl)}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
                  : initials
              }
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                <div style="font-weight: ${isUnread ? "600" : "500"}; font-size: 14px; color: var(--color-text);">
                  ${escapeHtml(displayName)}
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted); white-space: nowrap;">
                  ${escapeHtml(timeAgo)}
                </div>
              </div>
              <div style="font-size: 13px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(preview)}
              </div>
              ${
                conv.class
                  ? `<div style="font-size: 11px; color: var(--color-brand-deep); margin-top: 2px;">
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
    <div class="chat-conversation" style="display: flex; flex-direction: column; height: 100%;">
      <!-- Chat Header -->
      <div class="chat-header" style="padding: var(--space-4); border-bottom: 1px solid var(--color-border-subtle); display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0;">
        <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
          ${
            otherUser.photoUrl
              ? `<img src="${escapeHtml(otherUser.photoUrl)}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
              : initials
          }
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 16px; color: var(--color-text);">
            ${escapeHtml(displayName)}
          </div>
          ${
            conversation.class
              ? `<div style="font-size: 12px; color: var(--color-text-muted);">
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
        style="flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);"
      >
        ${
          messages.length === 0
            ? `<div id="empty-messages-placeholder" style="text-align: center; color: var(--color-text-muted); padding: var(--space-8);">
              <p>No messages yet. Start the conversation!</p>
            </div>`
            : messages.map((msg) => renderMessage(msg, currentUserId)).join("")
        }
      </div>

      <!-- Message Input -->
      <div class="chat-input-area" style="padding: var(--space-4); border-top: 1px solid var(--color-border-subtle); flex-shrink: 0;">
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
          style="display: flex; gap: var(--space-2);"
        >
          <input
            type="text"
            name="content"
            placeholder="Type a message..."
            required
            style="flex: 1; padding: var(--space-3) var(--space-4); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); font-size: 14px;"
          />
          <button
            type="submit"
            class="btn btn-primary"
            style="padding: var(--space-3) var(--space-4);"
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
 */
export function renderMessage(message, currentUserId) {
  const isOwnMessage = message.senderId === currentUserId;
  const senderName = getUserDisplayName(message.sender);
  const initials = getUserInitials(message.sender);
  const time = formatDateTime(message.createdAt);

  return `
    <div
      class="message ${isOwnMessage ? "message-own" : "message-other"}"
      style="display: flex; gap: var(--space-2); align-items: flex-start; ${isOwnMessage ? "flex-direction: row-reverse;" : ""}"
    >
      ${
        !isOwnMessage
          ? `<div class="avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; flex-shrink: 0;">
            ${
              message.sender?.photoUrl
                ? `<img src="${escapeHtml(message.sender.photoUrl)}" alt="${escapeHtml(senderName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
                : initials
            }
          </div>`
          : ""
      }
      <div style="max-width: 70%; display: flex; flex-direction: column; ${isOwnMessage ? "align-items: flex-end;" : ""}">
        ${
          !isOwnMessage && message.sender
            ? `<div style="font-size: 12px; font-weight: 600; color: var(--color-text); margin-bottom: 4px;">
              ${escapeHtml(senderName)}
            </div>`
            : ""
        }
        <div
          class="message-bubble"
          style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); word-wrap: break-word; ${
            isOwnMessage
              ? "background: var(--color-brand-deep); color: white;"
              : "background: var(--color-bg-subtle); color: var(--color-text);"
          }"
        >
          ${escapeHtml(message.content)}
        </div>
        <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 4px; ${isOwnMessage ? "text-align: right;" : ""}">
          ${escapeHtml(time)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render new chat modal
 */
function renderNewChatModal(recipients) {
  if (recipients.length === 0) {
    return `
      <div id="modal-new-chat" class="modal-overlay">
        <div class="modal-card" style="max-width: 500px;">
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
      <div class="modal-card" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Start New Conversation</h3>
          <button onclick="closeModal('modal-new-chat')" class="btn-close">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div style="display: flex; flex-direction: column; gap: var(--space-2); max-height: 400px; overflow-y: auto;">
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
                    style="padding: var(--space-3); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;"
                    onclick="window.startConversation && window.startConversation('${recipient.user.id}')"
                    onmouseover="this.style.background='var(--color-bg-subtle)'"
                    onmouseout="this.style.background='white'"
                  >
                    <div style="display: flex; gap: var(--space-3); align-items: center;">
                      <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0;">
                        ${
                          recipient.user.photoUrl
                            ? `<img src="${escapeHtml(recipient.user.photoUrl)}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
                            : initials
                        }
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 14px; color: var(--color-text); margin-bottom: 2px;">
                          ${escapeHtml(displayName)}
                        </div>
                        <div style="font-size: 12px; color: var(--color-text-muted);">
                          ${escapeHtml(roles)}
                        </div>
                        <div style="font-size: 11px; color: var(--color-brand-deep); margin-top: 4px;">
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
