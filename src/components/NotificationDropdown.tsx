import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchNotifications, type Notification } from "@/services/notificationService";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
        const unread = data.filter(n => !n.isSentNotification).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    // Load notifications on component mount
    loadNotifications();
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <a
        href="/notifications"
        className="relative p-2 rounded-full hover:bg-muted/50 transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </a>
    </div>
  );
};

export default NotificationDropdown;
