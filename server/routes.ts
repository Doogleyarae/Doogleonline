import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertContactMessageSchema, insertExchangeRateSchema } from "@shared/schema";
import { z } from "zod";

// Exchange rates (in a real app, these would come from an API)
const exchangeRates: Record<string, Record<string, number>> = {
  'zaad': { 'usd': 0.0018, 'eur': 0.0016, 'sahal': 1.05, 'evc': 1.0, 'edahab': 1.0, 'premier': 0.0018, 'moneygo': 1.0, 'trx': 0.018, 'trc20': 0.0018, 'peb20': 0.0018, 'usdc': 0.0018 },
  'sahal': { 'usd': 0.0017, 'eur': 0.0015, 'zaad': 0.95, 'evc': 0.95, 'edahab': 0.95, 'premier': 0.0017, 'moneygo': 0.95, 'trx': 0.017, 'trc20': 0.0017, 'peb20': 0.0017, 'usdc': 0.0017 },
  'evc': { 'usd': 0.0018, 'eur': 0.0016, 'zaad': 1.0, 'sahal': 1.05, 'edahab': 1.0, 'premier': 0.0018, 'moneygo': 1.0, 'trx': 0.018, 'trc20': 0.0018, 'peb20': 0.0018, 'usdc': 0.0018 },
  'edahab': { 'usd': 0.0018, 'eur': 0.0016, 'zaad': 1.0, 'sahal': 1.05, 'evc': 1.0, 'premier': 0.0018, 'moneygo': 1.0, 'trx': 0.018, 'trc20': 0.0018, 'peb20': 0.0018, 'usdc': 0.0018 },
  'premier': { 'usd': 1, 'eur': 0.89, 'zaad': 555, 'sahal': 588, 'evc': 555, 'edahab': 555, 'moneygo': 555, 'trx': 10, 'trc20': 1, 'peb20': 1, 'usdc': 1 },
  'moneygo': { 'usd': 0.0018, 'eur': 0.0016, 'zaad': 1.0, 'sahal': 1.05, 'evc': 1.0, 'edahab': 1.0, 'premier': 0.0018, 'trx': 0.018, 'trc20': 0.0018, 'peb20': 0.0018, 'usdc': 0.0018 },
  'trx': { 'usd': 0.1, 'eur': 0.089, 'zaad': 55.5, 'sahal': 58.8, 'evc': 55.5, 'edahab': 55.5, 'premier': 0.1, 'moneygo': 55.5, 'trc20': 0.1, 'peb20': 0.1, 'usdc': 0.1 },
  'trc20': { 'usd': 1, 'eur': 0.89, 'zaad': 555, 'sahal': 588, 'evc': 555, 'edahab': 555, 'premier': 1, 'moneygo': 555, 'trx': 10, 'peb20': 1, 'usdc': 1 },
  'peb20': { 'usd': 1, 'eur': 0.89, 'zaad': 555, 'sahal': 588, 'evc': 555, 'edahab': 555, 'premier': 1, 'moneygo': 555, 'trx': 10, 'trc20': 1, 'usdc': 1 },
  'usdc': { 'usd': 1, 'eur': 0.89, 'zaad': 555, 'sahal': 588, 'evc': 555, 'edahab': 555, 'premier': 1, 'moneygo': 555, 'trx': 10, 'trc20': 1, 'peb20': 1 }
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
      
      // Validate minimum amount
      if (parseFloat(validatedData.sendAmount) < 5) {
        return res.status(400).json({ message: "Minimum send amount is $5.00" });
      }
      
      const order = await storage.createOrder(validatedData);
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

  const httpServer = createServer(app);
  return httpServer;
}
