import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Order, ContactMessage } from "@shared/schema";

interface Notification {
  id: string;
  type: 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: messages = [] } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact'],
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    generateNotifications();
  }, [orders.length, messages.length]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    // Order notifications
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const processingOrders = orders.filter(order => order.status === 'processing');
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return orderDate >= oneDayAgo;
    });

    if (pendingOrders.length > 0) {
      newNotifications.push({
        id: 'pending-orders',
        type: 'order',
        title: 'Pending Orders',
        message: `${pendingOrders.length} orders waiting for payment confirmation`,
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionUrl: '/admin/dashboard'
      });
    }

    if (processingOrders.length > 0) {
      newNotifications.push({
        id: 'processing-orders',
        type: 'order',
        title: 'Orders in Progress',
        message: `${processingOrders.length} orders currently being processed`,
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionUrl: '/admin/dashboard'
      });
    }

    // Recent activity
    if (recentOrders.length > 0) {
      newNotifications.push({
        id: 'recent-activity',
        type: 'order',
        title: 'Recent Activity',
        message: `${recentOrders.length} new orders in the last 24 hours`,
        timestamp: new Date(),
        read: false,
        priority: 'low',
        actionUrl: '/admin/analytics'
      });
    }

    // Message notifications
    const recentMessages = messages.filter(message => {
      const messageDate = new Date(message.createdAt);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return messageDate >= oneDayAgo;
    });

    if (recentMessages.length > 0) {
      newNotifications.push({
        id: 'new-messages',
        type: 'message',
        title: 'New Messages',
        message: `${recentMessages.length} new support messages received`,
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionUrl: '/admin/dashboard'
      });
    }

    // System notifications
    const totalVolume = orders.reduce((sum, order) => sum + parseFloat(order.sendAmount), 0);
    if (totalVolume > 10000) {
      newNotifications.push({
        id: 'volume-milestone',
        type: 'system',
        title: 'Volume Milestone',
        message: `Platform has processed over $${totalVolume.toFixed(2)} in total volume`,
        timestamp: new Date(),
        read: false,
        priority: 'low'
      });
    }

    setNotifications(newNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                        notification.read ? 'opacity-60' : ''
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getPriorityIcon(notification.priority)}
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => dismissNotification(notification.id)}
                            className="h-6 w-6"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}