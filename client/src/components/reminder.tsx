import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ReminderProps {
  reminders?: Reminder[];
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  className?: string;
}

export default function Reminder({ 
  reminders = [], 
  onDismiss, 
  onMarkAsRead,
  className 
}: ReminderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localReminders, setLocalReminders] = useState<Reminder[]>(reminders);

  useEffect(() => {
    setLocalReminders(reminders);
  }, [reminders]);

  const unreadCount = localReminders.filter(r => !r.read).length;

  const handleDismiss = (id: string) => {
    setLocalReminders(prev => prev.filter(r => r.id !== id));
    onDismiss?.(id);
  };

  const handleMarkAsRead = (id: string) => {
    setLocalReminders(prev => 
      prev.map(r => r.id === id ? { ...r, read: true } : r)
    );
    onMarkAsRead?.(id);
  };

  const getIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeStyles = (type: Reminder['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (localReminders.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Reminders Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Reminders</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {localReminders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No reminders
              </p>
            ) : (
              localReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    getTypeStyles(reminder.type),
                    !reminder.read && "ring-2 ring-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {getIcon(reminder.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {reminder.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {reminder.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {reminder.timestamp.toLocaleString()}
                        </p>
                        {reminder.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={reminder.action.onClick}
                            className="mt-2"
                          >
                            {reminder.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!reminder.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(reminder.id)}
                          className="h-6 w-6"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismiss(reminder.id)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for managing reminders
export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const addReminder = (reminder: Omit<Reminder, 'id' | 'timestamp' | 'read'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setReminders(prev => [newReminder, ...prev]);
  };

  const dismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const markAsRead = (id: string) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, read: true } : r)
    );
  };

  const clearAll = () => {
    setReminders([]);
  };

  return {
    reminders,
    addReminder,
    dismissReminder,
    markAsRead,
    clearAll,
  };
} 