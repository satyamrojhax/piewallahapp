import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchNotifications, type Notification } from "@/services/notificationService";

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read or handle click
    console.log("Notification clicked:", notification);
  };

  const unreadCount = notifications.filter(n => !n.isSentNotification).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount > 99 ? '99+' : unreadCount} unread
            </Badge>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadNotifications} className="mt-4">
              Try Again
            </Button>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You're all caught up! We'll notify you when there are new announcements.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Header */}
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm">
                        {notification.heading}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <div 
                      className="line-clamp-3 [&>a]:text-primary [&>a]:underline hover:[&>a]:text-primary/80 [&>a]:break-all"
                      dangerouslySetInnerHTML={{
                        __html: notification.announcement.replace(
                          /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
                          (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
                        )
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
