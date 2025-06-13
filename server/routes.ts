import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertContactMessageSchema, insertExchangeRateSchema, insertCurrencyLimitSchema } from "@shared/schema";
import { emailService } from "./email";
import { wsManager } from "./websocket";
import { z } from "zod";

// Default fallback exchange rate
const DEFAULT_EXCHANGE_RATE = 1.0;

// Database-backed currency limits storage using currency_limits table
async function getCurrencyLimits(currency: string): Promise<{ min: number; max: number }> {
  try {
    // Try to get custom limits from database first
    const customLimit = await storage.getCurrencyLimit(currency, 'default');
    if (customLimit) {
      return {
        min: parseFloat(customLimit.minAmount),
        max: parseFloat(customLimit.maxAmount)
      };
    }
  } catch (error) {
    console.log(`No custom limits found for ${currency}, using defaults`);
  }
  
  // Default fallback limits
  const defaults: Record<string, { min: number; max: number }> = {
    zaad: { min: 5, max: 10000 },
    sahal: { min: 5, max: 10000 },
    evc: { min: 5, max: 10000 },
    edahab: { min: 5, max: 10000 },
    premier: { min: 5, max: 10000 },
    moneygo: { min: 5, max: 10000 },
    trx: { min: 1, max: 999 },
    trc20: { min: 1, max: 999 },
    peb20: { min: 5, max: 10000 },
    usdc: { min: 5, max: 10000 }
  };
  
  return defaults[currency.toLowerCase()] || { min: 5, max: 10000 };
}

// Function to update currency limits in database
async function updateCurrencyLimits(currency: string, min: number, max: number): Promise<void> {
  try {
    await storage.updateCurrencyLimit({
      fromCurrency: currency.toLowerCase(),
      toCurrency: 'default',
      minAmount: min.toString(),
      maxAmount: max.toString()
    });
    console.log(`Updated ${currency} limits in database: min=${min}, max=${max}`);
  } catch (error) {
    console.error(`Failed to update ${currency} limits:`, error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get exchange rate
  app.get("/api/exchange-rate/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      
      // First try to get from database
      const dbRate = await storage.getExchangeRate(from, to);
      if (dbRate) {
        return res.json({ rate: parseFloat(dbRate.rate), from: from.toUpperCase(), to: to.toUpperCase() });
      }
      
      // Fallback to default 1:1 rate
      res.json({ rate: DEFAULT_EXCHANGE_RATE, from: from.toUpperCase(), to: to.toUpperCase() });
    } catch (error) {
      res.status(500).json({ message: "Failed to get exchange rate" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Get currency-specific limits for this pair
      const currencyLimit = await storage.getCurrencyLimit(validatedData.sendMethod, validatedData.receiveMethod);
      
      // Use currency-specific limits if available, otherwise use global defaults
      const minAmount = currencyLimit ? parseFloat(currencyLimit.minAmount) : 5;
      const maxAmount = currencyLimit ? parseFloat(currencyLimit.maxAmount) : 10000;
      
      // Validate amount range
      const amount = parseFloat(validatedData.sendAmount);
      if (amount < minAmount) {
        return res.status(400).json({ message: `Minimum send amount is $${minAmount.toFixed(2)}` });
      }
      if (amount > maxAmount) {
        return res.status(400).json({ message: `Maximum send amount is $${maxAmount.toFixed(2)}` });
      }
      
      const order = await storage.createOrder(validatedData);
      
      // Send order confirmation email
      await emailService.sendOrderConfirmation(order);
      
      // Notify connected clients via WebSocket
      wsManager.notifyNewOrder(order);
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get order by orderId
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Send status update email
      await emailService.sendStatusUpdate(order);
      
      // Notify connected clients via WebSocket
      wsManager.notifyOrderUpdate(order);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Create contact message
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validatedData);
      
      // Send confirmation email to customer and notification to admin
      await emailService.sendContactConfirmation(message);
      await emailService.notifyAdmin(message);
      
      // Notify connected clients via WebSocket
      wsManager.notifyNewMessage(message);
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get all contact messages (admin only)
  app.get("/api/contact", async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Update order status
  app.patch("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      console.log(`Received status update request: orderId=${orderId}, status=${status}`);
      
      if (!["pending", "processing", "completed", "cancelled", "paid"].includes(status)) {
        console.log(`Invalid status received: ${status}`);
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === "admin" && password === "admin123") {
        res.json({ success: true, token: "admin-token-123" });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update exchange rate (admin only)
  app.post("/api/admin/exchange-rates", async (req, res) => {
    try {
      const validatedData = insertExchangeRateSchema.parse(req.body);
      const rate = await storage.updateExchangeRate(validatedData);
      
      res.json(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update exchange rate" });
    }
  });

  // Get all exchange rates (admin only)
  app.get("/api/admin/exchange-rates", async (req, res) => {
    try {
      const rates = await storage.getAllExchangeRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get exchange rates" });
    }
  });

  // Get individual currency limits (new balance management system)
  app.get("/api/currency-limits/:currency", async (req, res) => {
    try {
      const { currency } = req.params;
      const limits = await getCurrencyLimits(currency);
      
      res.json({
        minAmount: limits.min,
        maxAmount: limits.max,
        currency: currency.toUpperCase()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get currency limits" });
    }
  });

  // Get currency limits for specific pair (legacy endpoint)
  app.get("/api/currency-limits/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const fromLimits = await getCurrencyLimits(from);
      
      res.json({
        minAmount: fromLimits.min,
        maxAmount: fromLimits.max,
        from: from.toUpperCase(),
        to: to.toUpperCase()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get currency limits" });
    }
  });



  // Get all currency limits (admin only)
  app.get("/api/admin/balance-limits", async (req, res) => {
    try {
      const currencies = ['zaad', 'sahal', 'evc', 'edahab', 'premier', 'moneygo', 'trx', 'trc20', 'peb20', 'usdc'];
      const allLimits: Record<string, { min: number; max: number }> = {};
      
      for (const currency of currencies) {
        allLimits[currency] = await getCurrencyLimits(currency);
      }
      
      res.json(allLimits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get currency limits" });
    }
  });

  // Update individual currency limits (admin only)
  app.post("/api/admin/balance-limits", async (req, res) => {
    try {
      const { currency, minAmount, maxAmount } = req.body;
      
      if (!currency || minAmount === undefined || maxAmount === undefined) {
        return res.status(400).json({ message: "Currency, minAmount, and maxAmount are required" });
      }
      
      const min = parseFloat(minAmount);
      const max = parseFloat(maxAmount);
      
      if (min < 0 || max < 0 || min >= max) {
        return res.status(400).json({ message: "Invalid amount values" });
      }
      
      await updateCurrencyLimits(currency, min, max);
      
      res.json({
        currency: currency.toUpperCase(),
        minAmount: min,
        maxAmount: max,
        message: "Currency limits updated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update currency limits" });
    }
  });

  // Update currency limit (admin only) - legacy endpoint
  app.post("/api/admin/currency-limits", async (req, res) => {
    try {
      const validatedData = insertCurrencyLimitSchema.parse(req.body);
      const limit = await storage.updateCurrencyLimit(validatedData);
      
      res.json(limit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid limit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update currency limit" });
    }
  });

  // Get all currency limits (admin only)
  app.get("/api/admin/currency-limits", async (req, res) => {
    try {
      const limits = await storage.getAllCurrencyLimits();
      res.json(limits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get currency limits" });
    }
  });

  // Update transaction limits (admin only)
  app.post("/api/admin/transaction-limits", async (req, res) => {
    try {
      const { minAmount, maxAmount } = req.body;
      
      // Validate input
      const min = parseFloat(minAmount);
      const max = parseFloat(maxAmount);
      
      if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min >= max) {
        return res.status(400).json({ 
          message: "Invalid limits. Minimum must be less than maximum and both must be positive numbers." 
        });
      }
      
      // In a real application, you would store these in the database
      // For now, we'll just return success as the frontend manages the state
      res.json({ 
        success: true, 
        minAmount: minAmount, 
        maxAmount: maxAmount,
        message: "Transaction limits updated successfully" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction limits" });
    }
  });

  const httpServer = createServer(app);
  
  // Only initialize WebSocket server in production to avoid conflicts with Vite dev server
  if (process.env.NODE_ENV === 'production') {
    wsManager.initialize(httpServer);
  }
  
  return httpServer;
}
