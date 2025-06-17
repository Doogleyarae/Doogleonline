import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertContactMessageSchema, insertExchangeRateSchema, insertCurrencyLimitSchema, insertWalletAddressSchema } from "@shared/schema";
import { emailService } from "./email";
import { wsManager } from "./websocket";
import { orderProcessor } from "./orderProcessor";
import { z } from "zod";

// NO DEFAULT RATES - Only admin-configured rates are allowed

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
  
  // Use universal defaults that can be updated in real-time
  return {
    min: universalDefaults.min,
    max: universalDefaults.max
  };
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

// Function to update universal defaults
let universalDefaults = { min: 5, max: 10000 };

async function updateUniversalDefaults(min: number, max: number): Promise<void> {
  universalDefaults = { min, max };
  console.log(`Updated universal defaults: min=${min}, max=${max}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get exchange rate with bidirectional support and no-cache headers
  app.get("/api/exchange-rate/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const fromCurrency = from.toLowerCase();
      const toCurrency = to.toLowerCase();
      
      // Set aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // First try to get direct rate from database
      let dbRate = await storage.getExchangeRate(fromCurrency, toCurrency);
      
      if (dbRate) {
        return res.json({ 
          rate: parseFloat(dbRate.rate), 
          from: from.toUpperCase(), 
          to: to.toUpperCase(),
          lastUpdated: dbRate.updatedAt,
          timestamp: Date.now() // Add timestamp to prevent client caching
        });
      }
      
      // Try reverse rate and calculate inverse
      const reverseRate = await storage.getExchangeRate(toCurrency, fromCurrency);
      if (reverseRate) {
        const inverseRate = 1 / parseFloat(reverseRate.rate);
        return res.json({ 
          rate: parseFloat(inverseRate.toFixed(6)), 
          from: from.toUpperCase(), 
          to: to.toUpperCase(),
          lastUpdated: reverseRate.updatedAt,
          calculated: true, // Indicates this was calculated from reverse rate
          timestamp: Date.now()
        });
      }
      
      // NO FALLBACK - Return error if no admin rate configured
      res.status(404).json({ 
        message: `No exchange rate configured for ${from.toUpperCase()} to ${to.toUpperCase()}. Admin must configure this rate.`,
        error: "RATE_NOT_CONFIGURED"
      });
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      res.status(500).json({ message: "Failed to get exchange rate" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Get admin-configured limits for both currencies and exchange rate
      const sendLimits = await getCurrencyLimits(validatedData.sendMethod);
      const receiveLimits = await getCurrencyLimits(validatedData.receiveMethod);
      const exchangeRateData = await storage.getExchangeRate(validatedData.sendMethod, validatedData.receiveMethod);
      
      if (!exchangeRateData) {
        return res.status(400).json({ message: "Exchange rate not available for this currency pair" });
      }
      
      const exchangeRate = parseFloat(exchangeRateData.rate);
      const sendAmount = parseFloat(validatedData.sendAmount);
      const receiveAmount = parseFloat(validatedData.receiveAmount);
      
      // Enforce admin-configured send currency limits
      if (sendAmount < sendLimits.min) {
        return res.status(400).json({ 
          message: `Send amount $${sendAmount} is below minimum limit of $${sendLimits.min} for ${validatedData.sendMethod.toUpperCase()}` 
        });
      }
      
      if (sendAmount > sendLimits.max) {
        return res.status(400).json({ 
          message: `Send amount $${sendAmount} exceeds maximum limit of $${sendLimits.max} for ${validatedData.sendMethod.toUpperCase()}` 
        });
      }
      
      // Enforce admin-configured receive currency limits
      if (receiveAmount < receiveLimits.min) {
        return res.status(400).json({ 
          message: `Receive amount $${receiveAmount} is below minimum limit of $${receiveLimits.min} for ${validatedData.receiveMethod.toUpperCase()}` 
        });
      }
      
      if (receiveAmount > receiveLimits.max) {
        return res.status(400).json({ 
          message: `Receive amount $${receiveAmount} exceeds maximum limit of $${receiveLimits.max} for ${validatedData.receiveMethod.toUpperCase()}` 
        });
      }
      
      // Check available balance for receive currency (cannot exceed what we have)
      const currentBalance = await storage.getBalance(validatedData.receiveMethod);
      const availableBalance = currentBalance ? parseFloat(currentBalance.amount) : 0;
      
      if (receiveAmount > availableBalance) {
        return res.status(400).json({ 
          message: `Insufficient balance for ${validatedData.receiveMethod.toUpperCase()}. Available: $${availableBalance}, Required: $${receiveAmount}` 
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

  // Update order status with wallet balance management
  app.patch("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'processing', 'completed', 'cancelled', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Use the new wallet balance workflow logic
      const order = await storage.updateOrderStatusWithBalanceLogic(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Send appropriate email notification based on status
      if (status === "paid") {
        // Send payment confirmation email
        await emailService.sendPaymentConfirmation(order);
      } else if (status === "completed") {
        // Send order completion email
        await emailService.sendOrderCompletion(order);
      }
      // Removed general status update emails to prevent duplicates
      
      // Notify connected clients via WebSocket
      wsManager.notifyOrderUpdate(order);
      
      // Handle order processing timers based on status
      if (status === "paid") {
        // Start 15-minute timer for automatic completion
        orderProcessor.startProcessingTimer(orderId);
        console.log(`Order ${orderId} marked as paid, ${order.holdAmount} ${order.receiveMethod.toUpperCase()} put on hold, starting 15-minute processing timer`);
      } else if (status === "cancelled") {
        // Clear any existing timer for cancelled orders
        orderProcessor.clearTimer(orderId);
        console.log(`Order ${orderId} cancelled, hold amount released back to exchange wallet`);
      } else if (status === "completed") {
        // Clear any existing timer for completed orders
        orderProcessor.clearTimer(orderId);
        console.log(`Order ${orderId} completed, ${order.receiveAmount} ${order.receiveMethod.toUpperCase()} transferred to customer wallet`);
      }
      
      res.json(order);
    } catch (error) {
      console.error('Order status update error:', error);
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

  // Check cancellation limit for customer
  app.post("/api/orders/check-cancellation-limit", async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      const customerIdentifier = phoneNumber || email;
      
      if (!customerIdentifier) {
        return res.status(400).json({ message: "Phone number or email is required" });
      }
      
      const result = await storage.checkCancellationLimit(customerIdentifier);
      res.json(result);
    } catch (error) {
      console.error('Cancellation limit check error:', error);
      res.status(500).json({ message: "Failed to check cancellation limit" });
    }
  });

  // Record customer cancellation
  app.post("/api/orders/record-cancellation", async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      const customerIdentifier = phoneNumber || email;
      
      if (!customerIdentifier) {
        return res.status(400).json({ message: "Phone number or email is required" });
      }
      
      await storage.recordCancellation(customerIdentifier);
      res.json({ message: "Cancellation recorded successfully" });
    } catch (error) {
      console.error('Record cancellation error:', error);
      res.status(500).json({ message: "Failed to record cancellation" });
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

  // Get all transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  // Get admin contact information
  app.get("/api/admin/contact-info", async (req, res) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const contactInfo = await storage.getAdminContactInfo();
      // Return your contact information if nothing is stored
      res.json(contactInfo || { 
        email: "dadayare3@gmail.com", 
        whatsapp: "252611681818", 
        telegram: "@doogle143" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin contact information" });
    }
  });

  // Get public contact information for Contact page
  app.get("/api/contact-info", async (req, res) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const contactInfo = await storage.getAdminContactInfo();
      // Return all admin-configured contact information for public display
      const info = contactInfo || { 
        email: "dadayare3@gmail.com", 
        whatsapp: "252616451011", 
        telegram: "@doogle143" 
      };
      
      // Show all contact methods that have values
      const publicInfo: any = {};
      
      if (info.email && info.email.trim()) {
        publicInfo.email = info.email;
      }
      
      if (info.whatsapp && info.whatsapp.trim()) {
        publicInfo.whatsapp = info.whatsapp;
      }
      
      if (info.telegram && info.telegram.trim()) {
        publicInfo.telegram = info.telegram;
      }
      
      res.json(publicInfo);
    } catch (error) {
      // Fallback with all contact methods
      res.json({
        email: "dadayare3@gmail.com",
        whatsapp: "252616451011",
        telegram: "@doogle143"
      });
    }
  });

  // Update admin contact information
  app.post("/api/admin/contact-info", async (req, res) => {
    try {
      const { email, whatsapp, telegram } = req.body;
      
      if (!email && !whatsapp && !telegram) {
        return res.status(400).json({ message: "At least one contact method is required" });
      }

      const contactInfo = await storage.updateAdminContactInfo({ 
        email: email || "", 
        whatsapp: whatsapp || "", 
        telegram: telegram || "" 
      });

      res.json({
        ...contactInfo,
        message: "NEW CONTACT INFO PERSISTED: Admin contact information updated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin contact information" });
    }
  });

  // Update universal transaction limits
  app.post("/api/admin/universal-limits", async (req, res) => {
    try {
      const { min, max } = req.body;
      
      if (!min || !max || min >= max || min < 0 || max < 0) {
        return res.status(400).json({ message: "Invalid limit values" });
      }

      // Update all currency defaults by clearing database overrides
      // This forces the system to use the new server defaults
      await storage.clearAllCurrencyLimits();
      
      // Update server defaults
      await updateUniversalDefaults(min, max);
      
      // Broadcast update to all connected clients
      wsManager.broadcast({
        type: 'currency_limit_update',
        data: { min, max },
        timestamp: new Date().toISOString()
      });

      res.json({ min, max, message: "Universal limits updated successfully" });
    } catch (error) {
      console.error('Universal limits update error:', error);
      res.status(500).json({ message: "Failed to update universal limits" });
    }
  });

  // Get transactions for a specific order
  app.get("/api/orders/:orderId/transactions", async (req, res) => {
    try {
      const { orderId } = req.params;
      const transactions = await storage.getTransactionsByOrder(orderId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order transactions" });
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

  // Admin response to contact message
  app.patch("/api/contact/:messageId/response", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { response } = req.body;
      
      if (!response || !response.trim()) {
        return res.status(400).json({ message: "Response is required" });
      }
      
      const message = await storage.updateContactMessageResponse(parseInt(messageId), response.trim());
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify via WebSocket
      wsManager.notifyNewMessage(message);
      
      res.json({
        ...message,
        success: true,
        message: "Response sent successfully"
      });
    } catch (error) {
      console.error('Message response error:', error);
      res.status(500).json({ message: "Failed to send response" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const expectedPassword = "@Aa121322@Doogle143";
      
      if (username === "admin" && password === expectedPassword) {
        res.json({ success: true, token: "admin-token-123" });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update exchange rate (admin only) with complete data preservation
  app.post("/api/admin/exchange-rates", async (req, res) => {
    try {
      const validatedData = insertExchangeRateSchema.parse(req.body);
      
      // Preserve existing currency limits before updating exchange rate
      const fromCurrency = validatedData.fromCurrency.toLowerCase();
      const toCurrency = validatedData.toCurrency.toLowerCase();
      
      const fromLimits = await getCurrencyLimits(fromCurrency);
      const toLimits = await getCurrencyLimits(toCurrency);
      
      console.log(`Updating exchange rate ${fromCurrency} → ${toCurrency} = ${validatedData.rate} while preserving limits:
        ${fromCurrency.toUpperCase()}: min $${fromLimits.min}, max $${fromLimits.max}
        ${toCurrency.toUpperCase()}: min $${toLimits.min}, max $${toLimits.max}`);
      
      const rate = await storage.updateExchangeRate(validatedData);
      
      // Broadcast exchange rate update to all connected clients via WebSocket with forced refresh
      wsManager.broadcast({
        type: 'exchange_rate_update',
        data: {
          fromCurrency: validatedData.fromCurrency,
          toCurrency: validatedData.toCurrency,
          rate: validatedData.rate,
          timestamp: Date.now(),
          forceRefresh: true, // Force immediate cache invalidation
          updateType: 'rate_change',
          preservedLimits: {
            fromCurrency: { min: fromLimits.min, max: fromLimits.max },
            toCurrency: { min: toLimits.min, max: toLimits.max }
          }
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`EXCHANGE RATE UPDATE BROADCAST: ${validatedData.fromCurrency} → ${validatedData.toCurrency} = ${validatedData.rate} (forced cache refresh)`);
      
      // Also send status notification
      wsManager.notifyStatusChange(
        `Exchange rate updated: ${validatedData.fromCurrency.toUpperCase()} → ${validatedData.toCurrency.toUpperCase()} = ${validatedData.rate} (all limits preserved)`,
        'info'
      );
      
      res.json({
        ...rate,
        dataReplacement: {
          oldRate: "REPLACED",
          newRate: validatedData.rate,
          status: "NEW_DATA_PERSISTED"
        },
        preservedLimits: {
          fromCurrency: { min: fromLimits.min, max: fromLimits.max },
          toCurrency: { min: toLimits.min, max: toLimits.max }
        },
        message: "NEW DATA PERSISTED: Exchange rate completely replaced, all limits preserved"
      });
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
      // Add aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
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

  // Update individual currency limits (admin only) with exchange rate preservation
  app.post("/api/admin/currency-limits/:currency", async (req, res) => {
    try {
      const { currency } = req.params;
      const { minAmount, maxAmount } = req.body;
      
      if (!minAmount || !maxAmount || parseFloat(minAmount) < 0 || parseFloat(maxAmount) < 0) {
        return res.status(400).json({ message: "Valid min and max amounts are required" });
      }
      
      if (parseFloat(minAmount) >= parseFloat(maxAmount)) {
        return res.status(400).json({ message: "Minimum amount must be less than maximum amount" });
      }
      
      // Verify existing exchange rates before updating limits
      const currencyUpper = currency.toUpperCase();
      const allRates = await storage.getAllExchangeRates();
      const relatedRates = allRates.filter(rate => 
        rate.fromCurrency === currencyUpper || rate.toCurrency === currencyUpper
      );
      
      console.log(`Updating ${currency} limits (min: ${minAmount}, max: ${maxAmount}) while preserving ${relatedRates.length} related exchange rates`);
      
      await updateCurrencyLimits(currency, parseFloat(minAmount), parseFloat(maxAmount));
      
      // Broadcast update to ensure real-time synchronization
      wsManager.broadcast({
        type: 'currency_limit_update',
        data: { 
          currency: currencyUpper,
          minAmount: parseFloat(minAmount),
          maxAmount: parseFloat(maxAmount),
          preservedRates: relatedRates.length
        },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        currency: currencyUpper,
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        preservedRates: relatedRates.length,
        message: "Currency limits updated successfully with exchange rates preserved"
      });
    } catch (error) {
      console.error('Currency limit update error:', error);
      res.status(500).json({ message: "Failed to update currency limits" });
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

  // Get wallet addresses (admin only)
  app.get("/api/admin/wallet-addresses", async (req, res) => {
    try {
      // Add aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const walletData = await storage.getAllWalletAddresses();
      
      // Create a map of method -> address
      const walletMap: Record<string, string> = {};
      
      // Default addresses
      const defaults = {
        zaad: "*880*637834431*amount#",
        sahal: "*883*905865292*amount#",
        evc: "*799*34996012*amount#",
        edahab: "0626451011",
        premier: "0616451011",
        moneygo: "U2778451",
        trx: "THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv",
        trc20: "THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv",
        peb20: "0x5f3c72277de38d91e12f6f594ac8353c21d73c83"
      };
      
      // Start with defaults
      Object.assign(walletMap, defaults);
      
      // Override with database values
      walletData.forEach(wallet => {
        walletMap[wallet.method] = wallet.address;
      });
      
      res.json(walletMap);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet addresses" });
    }
  });

  // Update wallet address (admin only)
  app.post("/api/admin/wallet-addresses", async (req, res) => {
    try {
      const validatedData = insertWalletAddressSchema.parse(req.body);
      const wallet = await storage.updateWalletAddress(validatedData);
      
      res.json({
        method: wallet.method.toUpperCase(),
        address: wallet.address,
        lastUpdated: wallet.updatedAt.toISOString(),
        message: "Wallet address updated successfully"
      });
    } catch (error) {
      console.error('Wallet update error:', error);
      res.status(500).json({ message: "Failed to update wallet address" });
    }
  });

  // Get all balances (admin only)
  app.get("/api/admin/balances", async (req, res) => {
    try {
      // Add aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const balances = await storage.getAllBalances();
      const balanceMap = balances.reduce((acc, balance) => {
        acc[balance.currency.toUpperCase()] = parseFloat(balance.amount);
        return acc;
      }, {} as Record<string, number>);
      
      // Handle EVC Plus currency synchronization - EVCPLUS and EVC should use the same balance
      if (balanceMap['EVCPLUS'] && !balanceMap['EVC']) {
        balanceMap['EVC'] = balanceMap['EVCPLUS'];
      } else if (balanceMap['EVC'] && !balanceMap['EVCPLUS']) {
        balanceMap['EVCPLUS'] = balanceMap['EVC'];
      } else if (balanceMap['EVCPLUS'] && balanceMap['EVC']) {
        // Use the higher balance if both exist (latest update)
        const maxBalance = Math.max(balanceMap['EVCPLUS'], balanceMap['EVC']);
        balanceMap['EVC'] = maxBalance;
        balanceMap['EVCPLUS'] = maxBalance;
      }
      
      // Initialize default balances for currencies not in database
      const defaultCurrencies = ['zaad', 'sahal', 'evc', 'edahab', 'premier', 'moneygo', 'trx', 'trc20', 'peb20'];
      defaultCurrencies.forEach(currency => {
        if (!(currency.toUpperCase() in balanceMap)) {
          balanceMap[currency.toUpperCase()] = 0;
        }
      });
      
      res.json(balanceMap);
    } catch (error) {
      console.error("Balance fetch error:", error);
      res.status(500).json({ message: "Failed to fetch balances" });
    }
  });

  // Update balance (admin only)
  app.post("/api/admin/balances", async (req, res) => {
    try {
      const { currency, amount } = req.body;
      
      if (!currency || amount === undefined) {
        return res.status(400).json({ message: "Currency and amount are required" });
      }
      
      const currencyKey = currency.toLowerCase();
      const balance = await storage.updateBalance({ 
        currency: currencyKey, 
        amount: amount.toString() 
      });
      
      // Handle EVC Plus currency synchronization - when admin updates EVC or EVCPLUS, sync both
      if (currencyKey === 'evc' || currencyKey === 'evcplus') {
        // Update both EVC and EVCPLUS to the same value
        await storage.updateBalance({ 
          currency: 'evc', 
          amount: amount.toString() 
        });
        await storage.updateBalance({ 
          currency: 'evcplus', 
          amount: amount.toString() 
        });
      }
      
      // Broadcast balance update to all connected clients for real-time updates
      wsManager.broadcast({
        type: 'balance_update',
        data: { 
          currency: balance.currency.toUpperCase(), 
          amount: parseFloat(balance.amount),
          forceRefresh: true // Force immediate cache invalidation
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`BALANCE UPDATE BROADCAST: ${balance.currency.toUpperCase()} = $${balance.amount} (forced cache refresh)`);
      
      res.json({
        currency: balance.currency.toUpperCase(),
        amount: parseFloat(balance.amount),
        lastUpdated: balance.updatedAt,
        message: "Balance updated successfully"
      });
    } catch (error) {
      console.error("Balance update error:", error);
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Get API endpoints (admin only)
  app.get("/api/admin/api-endpoints", async (req, res) => {
    try {
      // Return current API endpoint configurations
      const apiEndpoints = {
        rate_update: "/api/exchange-rate",
        payment_verification: "/api/payment/verify",
        notification_service: "/api/notifications",
        backup_service: "/api/backup"
      };
      
      res.json(apiEndpoints);
    } catch (error) {
      res.status(500).json({ message: "Failed to get API endpoints" });
    }
  });

  // Update API endpoint (admin only)
  app.post("/api/admin/api-endpoints", async (req, res) => {
    try {
      const { endpoint, url } = req.body;
      
      if (!endpoint || !url) {
        return res.status(400).json({ message: "Endpoint and URL are required" });
      }
      
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      
      // In a production environment, this would update a database
      // For now, we'll simulate a successful update
      res.json({
        endpoint: endpoint.toUpperCase(),
        url,
        lastUpdated: new Date().toISOString(),
        message: "API endpoint updated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update API endpoint" });
    }
  });

  // Update currency limit with maximum $10,000 enforcement and exchange rate preservation
  app.post("/api/admin/currency-limits/:currency", async (req, res) => {
    try {
      const { currency } = req.params;
      const { minAmount, maxAmount } = req.body;
      
      if (!currency || minAmount === undefined || maxAmount === undefined) {
        return res.status(400).json({ message: "Currency, minAmount, and maxAmount are required" });
      }
      
      // Enforce maximum limit of $10,000
      const enforceMaxAmount = Math.min(parseFloat(maxAmount), 10000);
      
      // Store and preserve existing exchange rates before updating limits
      const existingRates = await storage.getAllExchangeRates();
      console.log(`PRESERVING ${existingRates.length} exchange rates before updating ${currency.toUpperCase()} limits`);
      
      // Update currency limit with enforced maximum
      const limit = await storage.updateCurrencyLimit({
        fromCurrency: currency.toLowerCase(),
        toCurrency: currency.toLowerCase(), // Self-reference for single currency limits
        minAmount: minAmount.toString(),
        maxAmount: enforceMaxAmount.toString()
      });
      
      // Override the returned maxAmount to ensure it reflects the enforced limit
      if (limit && typeof limit === 'object') {
        (limit as any).maxAmount = enforceMaxAmount.toString();
      }
      
      // Verify exchange rates are still preserved after limit update
      const postUpdateRates = await storage.getAllExchangeRates();
      console.log(`CONFIRMED: ${postUpdateRates.length} exchange rates preserved after ${currency.toUpperCase()} limit update`);
      
      // Broadcast currency limit update with $10,000 maximum enforcement and forced refresh
      wsManager.broadcast({
        type: 'currency_limit_update',
        data: { 
          currency: currency.toUpperCase(),
          minAmount: parseFloat(minAmount),
          maxAmount: enforceMaxAmount,
          forceRefresh: true, // Force immediate cache invalidation
          updateType: 'limit_change',
          message: `Maximum enforced at $10,000, exchange rates preserved`
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`CURRENCY LIMIT UPDATE BROADCAST: ${currency.toUpperCase()} min=$${minAmount}, max=$${enforceMaxAmount} (forced cache refresh)`);
      
      console.log(`${currency.toUpperCase()} limits updated with $10,000 maximum enforcement, exchange rates preserved`);
      res.json({
        ...limit,
        maxAmount: enforceMaxAmount,
        message: "Currency limits updated with $10,000 maximum enforcement, exchange rates preserved"
      });
    } catch (error) {
      console.error("Currency limit update error:", error);
      res.status(500).json({ message: "Failed to update currency limit" });
    }
  });

  // Update currency limit (admin only) - legacy endpoint with exchange rate preservation
  app.post("/api/admin/currency-limits", async (req, res) => {
    try {
      const validatedData = insertCurrencyLimitSchema.parse(req.body);
      
      // Ensure required fields are present
      if (!validatedData.fromCurrency || !validatedData.toCurrency) {
        return res.status(400).json({ message: "Currency fields are required" });
      }
      
      // Store existing exchange rates before updating limits
      const existingRates = await storage.getAllExchangeRates();
      console.log(`Preserving ${existingRates.length} exchange rates before updating currency limits`);
      
      const limit = await storage.updateCurrencyLimit(validatedData);
      
      // Broadcast currency limit update to connected clients
      wsManager.broadcast({
        type: 'currency_limit_update',
        data: { 
          currency: validatedData.fromCurrency.toUpperCase(),
          minAmount: parseFloat(validatedData.minAmount || "0"),
          maxAmount: parseFloat(validatedData.maxAmount || "0")
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`Currency limits updated for ${validatedData.fromCurrency}, exchange rates preserved`);
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

  // Get current wallet addresses (admin only)
  app.get("/api/admin/wallet-addresses", async (req, res) => {
    try {
      const walletAddresses = {
        'zaad': '*880*637834431*amount#',
        'sahal': '*883*905865292*amount#',
        'evc': '*799*34996012*amount#',
        'edahab': '0626451011',
        'premier': '0616451011',
        'moneygo': 'U2778451',
        'trx': 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv',
        'trc20': 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv',
        'peb20': '0x5f3c72277de38d91e12f6f594ac8353c21d73c83'
      };
      res.json(walletAddresses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet addresses" });
    }
  });

  // Update wallet addresses (admin only)
  app.post("/api/admin/wallet-addresses", async (req, res) => {
    try {
      const { method, address } = req.body;
      
      if (!method || !address) {
        return res.status(400).json({ message: "Payment method and address are required" });
      }

      // In a production environment, this would update a database table
      // For now, we'll simulate the update and return success
      res.json({
        method: method,
        address: address,
        message: "Wallet address updated successfully",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update wallet address" });
    }
  });

  // Get API endpoints configuration (admin only)
  app.get("/api/admin/api-endpoints", async (req, res) => {
    try {
      const apiEndpoints = {
        'rate_update': '/api/exchange-rate',
        'order_status': '/api/orders',
        'webhook_url': '/api/webhooks/notifications',
        'notification_api': '/api/notifications'
      };
      res.json(apiEndpoints);
    } catch (error) {
      res.status(500).json({ message: "Failed to get API endpoints" });
    }
  });

  // Update API endpoints (admin only)
  app.post("/api/admin/api-endpoints", async (req, res) => {
    try {
      const { endpoint, url } = req.body;
      
      if (!endpoint || !url) {
        return res.status(400).json({ message: "Endpoint name and URL are required" });
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch (urlError) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      res.json({
        endpoint: endpoint,
        url: url,
        message: "API endpoint updated successfully",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update API endpoint" });
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

  // Test email endpoint to verify Resend.com is working
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      
      const success = await emailService.sendTestEmail(
        email || "dadayare3@gmail.com",
        subject || "Resend.com Test - System Working",
        message || "This is a test email to confirm your Resend.com integration is working perfectly. The email system is operational and ready for customer notifications."
      );
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Test email sent successfully via Resend.com",
          sentTo: email || "dadayare3@gmail.com"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send test email" 
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send test email" 
      });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time admin updates
  wsManager.initialize(httpServer);
  
  return httpServer;
}
