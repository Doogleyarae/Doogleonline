import { storage } from "./storage";
import { emailService } from "./email";
import { wsManager } from "./websocket";

class OrderProcessor {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // Start processing timer when order is marked as paid
  startProcessingTimer(orderId: string) {
    // Clear existing timer if any
    this.clearTimer(orderId);

    console.log(`Starting 15-minute processing timer for order ${orderId}`);
    
    // Set timer for 15 minutes (900000 ms)
    const timer = setTimeout(async () => {
      try {
        console.log(`Processing timer completed for order ${orderId}, marking as completed`);
        
        // Update order status to completed
        const completedOrder = await storage.updateOrderStatus(orderId, "completed");
        
        if (completedOrder) {
          // Send completion email
          await emailService.sendStatusUpdate(completedOrder);
          
          // Notify connected clients
          wsManager.notifyOrderUpdate(completedOrder);
          
          console.log(`Order ${orderId} automatically completed after 15 minutes`);
        }
        
        // Remove timer from map
        this.timers.delete(orderId);
      } catch (error) {
        console.error(`Error auto-completing order ${orderId}:`, error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    this.timers.set(orderId, timer);
  }

  // Clear processing timer (for cancelled orders)
  clearTimer(orderId: string) {
    const existingTimer = this.timers.get(orderId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(orderId);
      console.log(`Cleared processing timer for order ${orderId}`);
    }
  }

  // Get remaining time for an order (in minutes)
  getRemainingTime(orderId: string): number {
    return this.timers.has(orderId) ? 15 : 0;
  }

  // Check if order is being processed
  isProcessing(orderId: string): boolean {
    return this.timers.has(orderId);
  }

  // Get all active timers count
  getActiveTimersCount(): number {
    return this.timers.size;
  }
}

export const orderProcessor = new OrderProcessor();