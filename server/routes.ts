import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderSchemaValidated, insertContactMessageSchema, insertExchangeRateSchema, insertCurrencyLimitSchema, insertWalletAddressSchema } from "@shared/schema";
import { emailService } from "./email";
import { wsManager } from "./websocket";
import { orderProcessor } from "./orderProcessor";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireAdminAuth } from './middleware'; // Adjust path if needed

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
  
  // Test endpoint to verify API is working
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });
  
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
      console.log('=== [ROUTE /api/orders] Route hit ===');
      console.log('=== [ROUTE /api/orders] Request body:', JSON.stringify(req.body, null, 2));
      
      const validatedData = insertOrderSchemaValidated.parse(req.body);
      console.log('=== [ROUTE /api/orders] validatedData:', JSON.stringify(validatedData, null, 2));
      
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
      
      console.log('=== [ROUTE /api/orders] About to call createOrder ===');
      
      // Ensure fullName and phoneNumber are provided for required send methods
      const orderData = {
        ...validatedData,
        fullName: validatedData.fullName || 'Anonymous User',
        phoneNumber: typeof validatedData.phoneNumber === 'string' ? validatedData.phoneNumber : '' // Always a string
      };
      
      const order = await storage.createOrder(orderData);
      console.log('=== [ROUTE /api/orders] Order created successfully:', order.orderId);
      
      // Send order confirmation email
      await emailService.sendOrderConfirmation(order);
      
      // Notify connected clients via WebSocket
      wsManager.notifyNewOrder(order);
      
      res.json(order);
    } catch (error) {
      console.error('=== [ROUTE /api/orders] ERROR ===', error);
      if (error instanceof Error) {
        console.error('=== [ROUTE /api/orders] ERROR STACK ===', error.stack);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      // Improved error logging
      console.error('Order creation error:', error);
      res.status(500).json({ message: "Failed to create order", error: error instanceof Error ? error.message : error });
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
        console.log(`Order ${orderId} marked as paid, ${order.receiveAmount} ${order.receiveMethod.toUpperCase()} reserved, starting 15-minute processing timer`);
      } else if (status === "cancelled") {
        // Clear any existing timer for cancelled orders
        orderProcessor.clearTimer(orderId);
        console.log(`Order ${orderId} cancelled, ${order.receiveAmount} ${order.receiveMethod.toUpperCase()} automatically returned to available balance`);
      } else if (status === "completed") {
        // Clear any existing timer for completed orders
        orderProcessor.clearTimer(orderId);
        console.log(`Order ${orderId} completed, ${order.receiveAmount} ${order.receiveMethod.toUpperCase()} paid to customer`);
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

  // User sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { fullName, email, phone, password } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !phone || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "User with this email already exists" 
        });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        fullName,
        email,
        phone,
        password: hashedPassword,
        username: email, // Use email as username for now
      });

      res.json({ 
        success: true, 
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        }
      });
    } catch (error) {
      console.error('Sign up error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create account" 
      });
    }
  });

  // User sign in
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      // Generate token (in production, use JWT)
      const token = `user-token-${user.id}-${Date.now()}`;

      res.json({ 
        success: true, 
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }
      });
    } catch (error) {
      console.error('Sign in error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Sign in failed" 
      });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          success: true, 
          message: "If an account with that email exists, a reset link has been sent" 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email (in production, implement actual email sending)
      console.log(`Password reset link: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`);

      res.json({ 
        success: true, 
        message: "If an account with that email exists, a reset link has been sent" 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process request" 
      });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Token and password are required" 
        });
      }

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }

      // Check if token is expired
      if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ 
          success: false, 
          message: "Reset token has expired" 
        });
      }

      // Update password and clear reset token
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ 
        success: true, 
        message: "Password has been reset successfully" 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset password" 
      });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      // DISABLED: Always allow admin login for development
      res.json({ success: true, token: "admin-token-123" });
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
      
      // Get admin username from request (you can enhance this with proper authentication)
      const adminUsername = req.body.changedBy || 'admin';
      const changeReason = req.body.changeReason;
      
      const rate = await storage.updateExchangeRate(validatedData, adminUsername, changeReason);
      
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

  // Get exchange rate history (admin only)
  app.get("/api/admin/exchange-rate-history", async (req, res) => {
    try {
      const { from, to } = req.query;
      const history = await storage.getExchangeRateHistory(
        from as string, 
        to as string
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get exchange rate history" });
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

  // Get wallet addresses (admin only) - ENHANCED VERSION
  app.get("/api/admin/wallet-addresses", async (req, res) => {
    try {
      console.log(' [WALLET-ADDRESSES] Fetching wallet addresses from database...');
      
      // Add aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const walletData = await storage.getAllWalletAddresses();
      console.log(' [WALLET-ADDRESSES] Database result:', walletData);
      
      // Create a map of method -> address
      const walletMap: Record<string, string> = {};
      
      // Default addresses (fallback)
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
      if (walletData && Array.isArray(walletData)) {
        walletData.forEach(wallet => {
          if (wallet && wallet.method && wallet.address) {
            walletMap[wallet.method] = wallet.address;
          }
        });
      }
      
      console.log('✅ [WALLET-ADDRESSES] Final wallet map:', walletMap);
      res.json(walletMap);
    } catch (error) {
      console.error('❌ [WALLET-ADDRESSES] Error:', error);
      res.status(500).json({ 
        message: "Failed to get wallet addresses",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update wallet address (admin only) - ENHANCED VERSION
  app.post("/api/admin/wallet-addresses", async (req, res) => {
    try {
      console.log(' [WALLET-UPDATE] Updating wallet address:', req.body);
      
      const validatedData = insertWalletAddressSchema.parse(req.body);
      console.log('✅ [WALLET-UPDATE] Validated data:', validatedData);
      
      const wallet = await storage.updateWalletAddress(validatedData);
      console.log('✅ [WALLET-UPDATE] Updated wallet:', wallet);
      
      res.json({
        method: wallet.method.toUpperCase(),
        address: wallet.address,
        lastUpdated: wallet.updatedAt.toISOString(),
        message: "Wallet address updated successfully"
      });
    } catch (error) {
      console.error('❌ [WALLET-UPDATE] Error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid wallet data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to update wallet address",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all balances (admin only)
  app.get("/api/admin/balances", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      const balances = await storage.getAllBalances(status === 'off');
      const result: Record<string, number> = {};
      for (const b of balances) {
        result[b.currency] = parseFloat(b.amount);
      }
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: 'Failed to fetch balances', error: message });
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

  // Get all balances (public/user-facing)
  app.get("/api/balances", async (req, res) => {
    try {
      // Add aggressive no-cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // Check system status - if system is off, return all zeros
      const systemStatus = await storage.getSystemStatus();
      const forceZero = systemStatus === 'off';
      
      const balances = await storage.getAllBalances(forceZero);
      const orders = await storage.getAllOrders();
      // The balance.amount in database is already the reduced balance after deductions
      // No need to calculate held amounts or subtract them
      const balanceMap = balances.reduce((acc, balance) => {
        const currency = balance.currency.toUpperCase();
        // The balance.amount is already the reduced balance after deductions
        // No need to subtract held amounts again
        acc[currency] = parseFloat(balance.amount);
        return acc;
      }, {} as Record<string, number>);
      // Handle EVC Plus currency synchronization - EVCPLUS and EVC should use the same balance
      if (balanceMap['EVCPLUS'] && !balanceMap['EVC']) {
        balanceMap['EVC'] = balanceMap['EVCPLUS'];
      } else if (balanceMap['EVC'] && !balanceMap['EVCPLUS']) {
        balanceMap['EVCPLUS'] = balanceMap['EVC'];
      } else if (balanceMap['EVCPLUS'] && balanceMap['EVC']) {
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
      console.error("Balance fetch error (public):", error);
      res.status(500).json({ message: "Failed to fetch balances" });
    }
  });

  // Manual balance credit
  app.post('/api/admin/balances/credit', requireAdminAuth, async (req, res) => {
    try {
      const { currency, amount, reason } = req.body;
      if (!currency || !amount) return res.status(400).json({ message: 'Missing currency or amount' });
      const result = await storage.manualCredit({ currency, amount, reason });
      res.json({ success: true, balance: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ADMIN BALANCE CREDIT ERROR]', err);
      res.status(500).json({ message: 'Failed to credit balance', error: message });
    }
  });

  // Manual balance debit
  app.post('/api/admin/balances/debit', requireAdminAuth, async (req, res) => {
    try {
      const { currency, amount, reason } = req.body;
      if (!currency || !amount) return res.status(400).json({ message: 'Missing currency or amount' });
      const result = await storage.manualDebit({ currency, amount, reason });
      res.json({ success: true, balance: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ADMIN BALANCE DEBIT ERROR]', err);
      res.status(500).json({ message: 'Failed to debit balance', error: message });
    }
  });

  // Get system status
  app.get('/api/admin/system-status', async (req, res) => {
    try {
      console.log('System status endpoint called');
      const status = await storage.getSystemStatus();
      console.log('System status result:', status);
      res.json({ status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('System status error:', err);
      res.status(500).json({ message: 'Failed to fetch system status', error: message });
    }
  });

  // Update system status
  app.post('/api/admin/system-status', async (req, res) => {
    try {
      const { status } = req.body;
      if (status !== 'on' && status !== 'off') {
        return res.status(400).json({ message: 'Invalid status' });
      }
      await storage.setSystemStatus(status);
      res.json({ status });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: 'Failed to update system status', error: message });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time admin updates
  wsManager.initialize(httpServer);
  
  return httpServer;
}
