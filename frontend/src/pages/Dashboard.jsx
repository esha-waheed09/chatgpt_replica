import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../context/AuthContext";

import api from "../api";

import "../dark-mode.css";

function Dashboard() {
  const { user, accessToken, logout } = useAuth();

  const [conversations, setConversations] = useState([]);

  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loadingConversation, setLoadingConversation] =
    useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [conversationToDelete, setConversationToDelete] =
    useState(null);

  const [deletingConversation, setDeletingConversation] =
    useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [resumeMode, setResumeMode] = useState(() => {
    return localStorage.getItem("resume_mode") === "on";
  });

  useEffect(() => {
    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      "resume_mode",
      resumeMode ? "on" : "off"
    );
  }, [resumeMode]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadConversations = async () => {
      try {
        const response = await api.get(
          "/chat/conversations/"
        );

        setConversations(response.data);
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      }
    };

    loadConversations();
  }, [accessToken]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    setOpenMenuId(null);
  };

  const handleSelectConversation = async (
    conversationId
  ) => {
    if (loadingConversation) {
      return;
    }

    setOpenMenuId(null);
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
    setLoadingConversation(true);

    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/`
      );

      setMessages(response.data.messages);
    } catch (error) {
      console.error(
        "Failed to load conversation:",
        error
      );

      setMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleOpenDeleteMenu = (
    event,
    conversationId
  ) => {
    event.stopPropagation();

    setOpenMenuId((currentId) =>
      currentId === conversationId
        ? null
        : conversationId
    );
  };

  const handleAskDelete = (
    event,
    conversation
  ) => {
    event.stopPropagation();

    setOpenMenuId(null);
    setConversationToDelete(conversation);
  };

  const handleCancelDelete = () => {
    if (deletingConversation) {
      return;
    }

    setConversationToDelete(null);
  };

  const handleDeleteConversation = async () => {
    if (
      !conversationToDelete ||
      deletingConversation
    ) {
      return;
    }

    setDeletingConversation(true);

    try {
      await api.delete(
        `/chat/conversations/${conversationToDelete.id}/delete/`
      );

      setConversations(
        (previousConversations) =>
          previousConversations.filter(
            (conversation) =>
              conversation.id !==
              conversationToDelete.id
          )
      );

      if (
        activeConversationId ===
        conversationToDelete.id
      ) {
        setActiveConversationId(null);
        setMessages([]);
        setInput("");
      }

      setConversationToDelete(null);
    } catch (error) {
      console.error(
        "Failed to delete conversation:",
        error
      );
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || sending) {
      return;
    }

    setInput("");

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setSending(true);

    try {
      const requestData = {
        message,
        resume_mode: resumeMode,
      };

      if (activeConversationId) {
        requestData.conversation_id =
          activeConversationId;
      }

      const response = await api.post(
        "/chat/",
        requestData
      );

      const {
        conversation_id,
        message: assistantMessage,
      } = response.data;

      setActiveConversationId(
        conversation_id
      );

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantMessage,
        },
      ]);

      const conversationsResponse =
        await api.get(
          "/chat/conversations/"
        );

      setConversations(
        conversationsResponse.data
      );
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Something went wrong while contacting the AI. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`chatgpt-app ${
        darkMode ? "dark-mode" : ""
      }`}
      onClick={() => setOpenMenuId(null)}
    >
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`chat-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <button
            className="new-chat-button"
            onClick={handleNewChat}
          >
            <span className="new-chat-icon">
              +
            </span>

            <span>New chat</span>
          </button>
        </div>

        <div className="conversation-section">
          <div className="conversation-heading">
            Today
          </div>

          {conversations.length === 0 ? (
            <div className="empty-conversations">
              No conversations yet
            </div>
          ) : (
            <div className="conversation-list">
              {conversations.map(
                (conversation) => (
                  <div
                    key={conversation.id}
                    className={`conversation-item-wrapper ${
                      activeConversationId ===
                      conversation.id
                        ? "active"
                        : ""
                    }`}
                  >
                    <button
                      className={`conversation-item ${
                        activeConversationId ===
                        conversation.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectConversation(
                          conversation.id
                        )
                      }
                    >
                      <span className="conversation-icon">
                        ◇
                      </span>

                      <span className="conversation-title">
                        {conversation.title}
                      </span>
                    </button>

                    <button
                      className="conversation-menu-button"
                      onClick={(event) =>
                        handleOpenDeleteMenu(
                          event,
                          conversation.id
                        )
                      }
                      title="Conversation options"
                    >
                      •••
                    </button>

                    {openMenuId ===
                      conversation.id && (
                      <div
                        className="conversation-menu"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <button
                          className="conversation-delete-option"
                          onClick={(event) =>
                            handleAskDelete(
                              event,
                              conversation
                            )
                          }
                        >
                          <span>🗑</span>

                          <span>
                            Delete chat
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode(
                (currentMode) =>
                  !currentMode
              )
            }
          >
            <span className="theme-toggle-icon">
              {darkMode ? "☀" : "☾"}
            </span>

            <span>
              {darkMode
                ? "Light mode"
                : "Dark mode"}
            </span>

            <span className="theme-toggle-status">
              {darkMode ? "ON" : "OFF"}
            </span>
          </button>

          <div className="user-profile">
            <div className="avatar">
              {user?.email
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <span className="user-name">
                {user?.email?.split("@")[0] ||
                  "User"}
              </span>

              <span className="user-email">
                {user?.email || ""}
              </span>
            </div>

            <button
              className="logout-button"
              onClick={logout}
              title="Log out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>

            <button className="model-button">
              <span>
                ChatGPT Replica
              </span>

              <span className="model-arrow">
                ▾
              </span>
            </button>

            {resumeMode && (
              <span className="resume-mode-badge">
                Resume mode
              </span>
            )}
          </div>

          <button
            type="button"
            className={`resume-mode-toggle ${
              resumeMode ? "active" : ""
            }`}
            onClick={() =>
              setResumeMode(
                (currentMode) =>
                  !currentMode
              )
            }
            title="Answer using Eshaal's resume"
          >
            <span>
              Resume mode
            </span>

            <span className="resume-mode-status">
              {resumeMode ? "ON" : "OFF"}
            </span>
          </button>
        </header>

        <section className="chat-content">
          {loadingConversation ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                ✦
              </div>

              <h1>
                Loading conversation...
              </h1>

              <p>
                Please wait while we load
                your messages.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                ✦
              </div>

              <h1>
                {resumeMode
                  ? "Ask about the resume"
                  : "How can I help you?"}
              </h1>

              <p>
                {resumeMode
                  ? "Resume mode is on. Answers will be grounded in Eshaal's resume."
                  : "Ask anything and start a conversation with your AI assistant."}
              </p>

              <div className="suggestion-grid">
                <button
                  onClick={() =>
                    setInput(
                      "Explain how artificial intelligence works"
                    )
                  }
                >
                  <strong>
                    Explain something
                  </strong>

                  <span>
                    Explain how artificial
                    intelligence works
                  </span>
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "Give me some creative ideas for a project"
                    )
                  }
                >
                  <strong>
                    Brainstorm ideas
                  </strong>

                  <span>
                    Give me creative project
                    ideas
                  </span>
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "Write a short Python program for me"
                    )
                  }
                >
                  <strong>
                    Write code
                  </strong>

                  <span>
                    Create a simple Python
                    program
                  </span>
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "Tell me an interesting fact"
                    )
                  }
                >
                  <strong>
                    Explore a topic
                  </strong>

                  <span>
                    Tell me something
                    interesting
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-row ${message.role}`}
                >
                  <div className="message-avatar">
                    {message.role ===
                    "user"
                      ? user?.email
                          ?.charAt(0)
                          .toUpperCase() ||
                        "U"
                      : "✦"}
                  </div>

                  <div className="message-body">
                    <div className="message-author">
                      {message.role ===
                      "user"
                        ? "You"
                        : "Clone"}
                    </div>

                    <div className="message-text">
                      {message.role ===
                      "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="message-row assistant">
                  <div className="message-avatar">
                    ✦
                  </div>

                  <div className="message-body">
                    <div className="message-author">
                      Clone
                    </div>

                    <div className="typing-indicator">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="composer-area">
          <form
            className="composer"
            onSubmit={handleSubmit}
          >
            <button
              type="button"
              className="composer-plus"
              title="Add"
            >
              +
            </button>

            <textarea
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  handleSubmit(event);
                }
              }}
              placeholder={
                resumeMode
                  ? "Ask about skills, projects, experience..."
                  : "Message ChatGPT Replica"
              }
              rows={1}
              disabled={
                sending ||
                loadingConversation
              }
            />

            <button
              type="submit"
              className="send-button"
              disabled={
                sending ||
                loadingConversation ||
                !input.trim()
              }
              title="Send message"
            >
              ↑
            </button>
          </form>

          <div className="composer-disclaimer">
            AI can make mistakes. Check
            important information.
          </div>
        </div>
      </main>

      {conversationToDelete && (
        <div
          className="delete-modal-overlay"
          onClick={handleCancelDelete}
        >
          <div
            className="delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-modal-icon">
              !
            </div>

            <h2>
              Delete chat?
            </h2>

            <p>
              This conversation will be
              permanently deleted. This
              action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                className="delete-cancel-button"
                onClick={handleCancelDelete}
                disabled={
                  deletingConversation
                }
              >
                Cancel
              </button>

              <button
                className="delete-confirm-button"
                onClick={
                  handleDeleteConversation
                }
                disabled={
                  deletingConversation
                }
              >
                {deletingConversation
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;