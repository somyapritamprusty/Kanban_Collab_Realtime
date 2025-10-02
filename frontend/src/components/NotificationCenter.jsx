import React from "react";

function NotificationCenter({ notifications, onClose, onMarkRead }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
        <div>
          {unreadCount > 0 && (
            <button onClick={() => notifications.forEach(n => !n.read && onMarkRead(n.id))}>
              Mark all as read
            </button>
          )}
          <button onClick={onClose}>×</button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-item">No notifications</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? "" : "unread"} ${
                notification.type || ""
              }`}
              onClick={() => !notification.read && onMarkRead(notification.id)}
            >
              <div>
                {notification.message}
              </div>
              <small>
                {new Date(notification.createdAt).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationCenter;
