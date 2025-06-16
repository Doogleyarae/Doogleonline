import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import type { Order } from '@shared/schema';

interface WSMessage {
  type: 'order_update' | 'new_order' | 'new_message' | 'status_change' | 'exchange_rate_update' | 'currency_limit_update' | 'balance_update';
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [, setLocation] = useLocation();

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected for real-time updates');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket connection closed');
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setTimeout(connect, 5000);
    }
  };

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'order_update':
        handleOrderUpdate(message.data);
        break;
      case 'status_change':
        console.log('Status update:', message.data.message);
        break;
      case 'exchange_rate_update':
      case 'currency_limit_update':
      case 'balance_update':
        // Trigger cache invalidation for exchange form
        window.dispatchEvent(new CustomEvent('admin-update', { detail: message }));
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const handleOrderUpdate = (order: Order) => {
    const currentOrder = sessionStorage.getItem('currentOrder');
    if (currentOrder) {
      const storedOrder = JSON.parse(currentOrder);
      
      // Check if this update is for the customer's current order
      if (storedOrder.orderId === order.orderId) {
        // Update stored order with new status
        sessionStorage.setItem('currentOrder', JSON.stringify(order));
        
        // Redirect customer based on new status
        if (order.status === 'completed') {
          setLocation('/order-completed');
        } else if (order.status === 'cancelled') {
          setLocation('/order-cancelled');
        }
        
        console.log(`Order ${order.orderId} status updated to: ${order.status}`);
      }
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    reconnect: connect
  };
}

export function useOrderStatusSync(orderId?: string) {
  const { isConnected } = useWebSocket();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!orderId) return;

    const handleStorageChange = () => {
      const currentOrder = sessionStorage.getItem('currentOrder');
      if (currentOrder) {
        const order = JSON.parse(currentOrder);
        if (order.orderId === orderId) {
          // Redirect based on status
          if (order.status === 'completed') {
            setLocation('/order-completed');
          } else if (order.status === 'cancelled') {
            setLocation('/order-cancelled');
          }
        }
      }
    };

    // Listen for sessionStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [orderId, setLocation]);

  return { isConnected };
}