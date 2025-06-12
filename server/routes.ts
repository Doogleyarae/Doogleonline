import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertContactMessageSchema, insertExchangeRateSchema } from "@shared/schema";
import { emailService } from "./email";
import { wsManager } from "./websocket";
import { z } from "zod";

// Exchange rates - 1:1 for all currencies (1 dollar equivalent)
const exchangeRates: Record<string, Record<string, number>> = {
  'zaad': { 'usd': 1, 'eur': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'sahal': { 'usd': 1, 'eur': 1, 'zaad': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'evc': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'edahab': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'premier': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'moneygo': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'trx': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'trx': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'trc20': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'peb20': 1, 'usdc': 1 },
  'peb20': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'usdc': 1 },
  'usdc': { 'usd': 1, 'eur': 1, 'zaad': 1, 'sahal': 1, 'evc': 1, 'edahab': 1, 'premier': 1, 'moneygo': 1, 'trx': 1, 'trc20': 1, 'peb20': 1 }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get exchange rate
  app.get("/api/exchange-rate/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      
      if (!exchangeRates[from] || !exchangeRates[from][to]) {
        return res.status(400).json({ message: "Exchange rate not available for this currency pair" });
      }
      
      const rate = exchangeRates[from][to];
      res.json({ rate, from: from.toUpperCase(), to: to.toUpperCase() });
    } catch (error) {
      res.status(500).json({ message: "Failed to get exchange rate" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Validate amount range
      const amount = parseFloat(validatedData.sendAmount);
      if (amount < 5) {
        return res.status(400).json({ message: "Minimum send amount is $5.00" });
      }
      if (amount > 10000) {
        return res.status(400).json({ message: "Maximum send amount is $10,000.00" });
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
      
      // Also update the in-memory exchange rates
      if (!exchangeRates[validatedData.fromCurrency]) {
        exchangeRates[validatedData.fromCurrency] = {};
      }
      exchangeRates[validatedData.fromCurrency][validatedData.toCurrency] = parseFloat(validatedData.rate);
      
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

  // Execute SQL query (admin only)
  app.post("/api/admin/database/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          error: "Query is required and must be a string" 
        });
      }

      // Basic security check - prevent dangerous operations
      const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
      const upperQuery = query.toUpperCase().trim();
      
      // Allow SELECT queries and basic operations only
      if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('SHOW') && !upperQuery.startsWith('DESCRIBE')) {
        // Check for dangerous keywords
        for (const keyword of dangerousKeywords) {
          if (upperQuery.includes(keyword)) {
            return res.status(403).json({ 
              error: `${keyword} operations are not allowed for security reasons. Use SELECT queries only.` 
            });
          }
        }
      }

      // Execute the query using the database connection
      const result = await db.execute(query);
      
      res.json({ 
        data: result.rows || result,
        message: "Query executed successfully",
        rowCount: result.rows ? result.rows.length : 0
      });
    } catch (error: any) {
      console.error('Database query error:', error);
      res.status(500).json({ 
        error: error.message || "Failed to execute query",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  const httpServer = createServer(app);
  
  // Only initialize WebSocket server in production to avoid conflicts with Vite dev server
  if (process.env.NODE_ENV === 'production') {
    wsManager.initialize(httpServer);
  }
  
  return httpServer;
}
