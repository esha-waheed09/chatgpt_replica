import {
  MessageSquare,
  Plus,
  Settings,
  User,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


function Sidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onProfile,
  onSettings,
}) {
  const { user, logout } = useAuth();


  return (
    <aside className="sidebar">

      <button
        className="new-chat-button"
        onClick={onNewChat}
      >
        <Plus size={18} />

        <span>
          New chat
        </span>
      </button>


      <div className="sidebar-section">

        <div className="sidebar-label">
          Recent
        </div>


        <div className="conversation-list">

          {conversations.length === 0 ? (
            <div className="empty-conversations">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={
                  activeConversationId === conversation.id
                    ? "conversation-item active"
                    : "conversation-item"
                }
                onClick={() =>
                  onSelectConversation(conversation.id)
                }
              >
                <MessageSquare size={17} />

                <span>
                  {conversation.title}
                </span>
              </button>
            ))
          )}

        </div>

      </div>


      <div className="sidebar-bottom">

        <button
          className="sidebar-menu-item"
          onClick={onProfile}
        >
          <User size={18} />

          <span>
            Profile
          </span>
        </button>


        <button
          className="sidebar-menu-item"
          onClick={onSettings}
        >
          <Settings size={18} />

          <span>
            Settings
          </span>
        </button>


        <div className="sidebar-user">

          <div className="user-avatar">
            {user?.email
              ?.charAt(0)
              .toUpperCase() || "U"}
          </div>


          <div className="user-info">

            <strong>
              {user?.email || "User"}
            </strong>

            <span>
              Verified account
            </span>

          </div>


          <button
            onClick={logout}
            className="logout-button"
          >
            Log out
          </button>

        </div>

      </div>

    </aside>
  );
}


export default Sidebar;