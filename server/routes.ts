import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertContactMessageSchema, insertExchangeRateSchema, insertCurrencyLimitSchema } from "@shared/schema";
import { emailService } from "./email";
import { wsManager } from "./websocket";
import { orderProcessor } from "./orderProcessor";
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
      
      // Get currency-specific limits and exchange rate for this pair
      const currencyLimit = await storage.getCurrencyLimit(validatedData.sendMethod, validatedData.receiveMethod);
      const exchangeRateData = await storage.getExchangeRate(validatedData.sendMethod, validatedData.receiveMethod);
      
      if (!exchangeRateData) {
        return res.status(400).json({ message: "Exchange rate not available for this currency pair" });
      }
      
      // Use currency-specific limits if available, otherwise use global defaults
      const baseLimits = {
        minAmount: currencyLimit ? parseFloat(currencyLimit.minAmount) : 5,
        maxAmount: currencyLimit ? parseFloat(currencyLimit.maxAmount) : 10000,
      };
      
      const exchangeRate = parseFloat(exchangeRateData.rate);
      
      // Calculate dynamic limits based on exchange rate
      const dynamicLimits = {
        minSendAmount: baseLimits.minAmount,
        maxSendAmount: baseLimits.maxAmount,
        minReceiveAmount: baseLimits.minAmount * exchangeRate,
        maxReceiveAmount: baseLimits.maxAmount * exchangeRate,
      };
      
      // Validate send amount
      const sendAmount = parseFloat(validatedData.sendAmount);
      if (sendAmount < dynamicLimits.minSendAmount) {
        return res.status(400).json({ 
          message: `Minimum send amount is ${dynamicLimits.minSendAmount.toFixed(2)}` 
        });
      }
      if (sendAmount > dynamicLimits.maxSendAmount) {
        return res.status(400).json({ 
          message: `Maximum send amount is ${dynamicLimits.maxSendAmount.toFixed(2)}` 
        });
      }
      
      // Validate receive amount
      const receiveAmount = parseFloat(validatedData.receiveAmount);
      if (receiveAmount < dynamicLimits.minReceiveAmount) {
        return res.status(400).json({ 
          message: `Minimum receive amount is ${dynamicLimits.minReceiveAmount.toFixed(2)}` 
        });
      }
      if (receiveAmount > dynamicLimits.maxReceiveAmount) {
        return res.status(400).json({ 
          message: `Maximum receive amount is ${dynamicLimits.maxReceiveAmount.toFixed(2)}` 
        });
      }
      
      // Validate that the amounts match the exchange rate (with small tolerance for rounding)
      const calculatedReceiveAmount = sendAmount * exchangeRate;
      const amountDifference = Math.abs(receiveAmount - calculatedReceiveAmount);
      const tolerance = 0.02; // 2 cent tolerance for rounding differences
      
      if (amountDifference > tolerance) {
        return res.status(400).json({ 
          message: `Amount mismatch: expected receive amount ${calculatedReceiveAmount.toFixed(2)} based on current exchange rate` 
        });
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
      
      if (!['pending', 'processing', 'completed', 'cancelled', 'paid'].includes(status)) {
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
      
      // Handle order processing timers based on status
      if (status === "paid") {
        // Start 15-minute timer for automatic completion
        orderProcessor.startProcessingTimer(orderId);
        console.log(`Order ${orderId} marked as paid, starting 15-minute processing timer`);
      } else if (status === "cancelled") {
        // Clear any existing timer for cancelled orders
        orderProcessor.clearTimer(orderId);
        console.log(`Order ${orderId} cancelled, clearing processing timer`);
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get order processing status
  app.get("/api/orders/:orderId/processing-status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const isProcessing = orderProcessor.isProcessing(orderId);
      const remainingTime = orderProcessor.getRemainingTime(orderId);
      
      res.json({
        isProcessing,
        remainingTimeMinutes: remainingTime
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get processing status" });
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
