import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { Order, ContactMessage } from '@shared/schema';

interface WSMessage {
  type: 'order_update' | 'new_order' | 'new_message' | 'status_change' | 'exchange_rate_update' | 'currency_limit_update' | 'balance_update' | 'system_status_update';
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log('WebSocket client connected. Total clients:', this.clients.size);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket client disconnected. Total clients:', this.clients.size);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
      
      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'status_change',
        data: { message: 'Connected to DoogleOnline live updates' },
        timestamp: new Date().toISOString()
      });
    });
  }

  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  broadcast(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    const deadClients: WebSocket[] = [];
    
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting to client:', error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    });
    
    // Clean up dead connections
    deadClients.forEach(ws => this.clients.delete(ws));
  }

  notifyNewOrder(order: Order) {
    this.broadcast({
      type: 'new_order',
      data: {
        orderId: order.orderId,
        customerName: order.fullName,
        amount: order.sendAmount,
        fromCurrency: order.sendMethod,
        toCurrency: order.receiveMethod,
        status: order.status
      },
      timestamp: new Date().toISOString()
    });
  }

  notifyOrderUpdate(order: Order) {
    this.broadcast({
      type: 'order_update',
      data: order, // Send complete order data for full UI updates
      timestamp: new Date().toISOString()
    });
  }

  notifyNewMessage(message: ContactMessage) {
    this.broadcast({
      type: 'new_message',
      data: {
        id: message.id,
        name: message.name,
        subject: message.subject,
        createdAt: message.createdAt
      },
      timestamp: new Date().toISOString()
    });
  }

  notifyStatusChange(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.broadcast({
      type: 'status_change',
      data: { message, type },
      timestamp: new Date().toISOString()
    });
  }

  notifyBalanceUpdate(currency: string, newBalance: number) {
    this.broadcast({
      type: 'balance_update',
      data: { 
        currency: currency.toUpperCase(), 
        amount: newBalance,
        forceRefresh: true, // Force immediate cache invalidation
        message: `Balance updated for ${currency.toUpperCase()}: $${newBalance.toLocaleString()}`
      },
      timestamp: new Date().toISOString()
    });
  }

  notifySystemStatusUpdate(status: 'on' | 'off') {
    this.broadcast({
      type: 'system_status_update',
      data: { 
        status,
        forceRefresh: true, // Force immediate cache invalidation
        message: `System status changed to: ${status.toUpperCase()}`
      },
      timestamp: new Date().toISOString()
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();