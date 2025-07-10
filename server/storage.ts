import { users, orders, contactMessages, exchangeRates, currencyLimits, walletAddresses, balances, transactions, adminContactInfo, customerRestrictions, emailLogs, exchangeRateHistory, type User, type InsertUser, type Order, type InsertOrder, type ContactMessage, type InsertContactMessage, type ExchangeRate, type InsertExchangeRate, type CurrencyLimit, type InsertCurrencyLimit, type WalletAddress, type InsertWalletAddress, type Balance, type InsertBalance, type Transaction, type InsertTransaction, type AdminContactInfo, type InsertAdminContactInfo, type CustomerRestriction, type InsertCustomerRestriction, type EmailLog, type InsertEmailLog, type ExchangeRateHistory, type InsertExchangeRateHistory, systemStatus } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(orderId: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  
  // Contact message methods
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageResponse(messageId: number, response: string): Promise<ContactMessage | undefined>;
  
  // Exchange rate methods
  getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined>;
  getAllExchangeRates(): Promise<ExchangeRate[]>;
  updateExchangeRate(rate: InsertExchangeRate, changedBy?: string, changeReason?: string): Promise<ExchangeRate>;
  getExchangeRateHistory(from?: string, to?: string): Promise<ExchangeRateHistory[]>;
  
  // Currency limit methods
  getCurrencyLimit(from: string, to: string): Promise<CurrencyLimit | undefined>;
  getAllCurrencyLimits(): Promise<CurrencyLimit[]>;
  updateCurrencyLimit(limit: InsertCurrencyLimit): Promise<CurrencyLimit>;
  clearAllCurrencyLimits(): Promise<void>;
  
  // Wallet address methods
  getWalletAddress(method: string): Promise<WalletAddress | undefined>;
  getAllWalletAddresses(): Promise<WalletAddress[]>;
  updateWalletAddress(wallet: InsertWalletAddress): Promise<WalletAddress>;
  
  // Balance methods
  getBalance(currency: string): Promise<Balance | undefined>;
  getAllBalances(forceZero?: boolean): Promise<Balance[]>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  deductBalance(currency: string, amount: number): Promise<Balance | undefined>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByOrder(orderId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Admin contact information methods
  getAdminContactInfo(): Promise<AdminContactInfo | undefined>;
  updateAdminContactInfo(info: InsertAdminContactInfo): Promise<AdminContactInfo>;
  
  // Customer restriction methods
  getCustomerRestriction(customerIdentifier: string): Promise<CustomerRestriction | undefined>;
  createCustomerRestriction(restriction: InsertCustomerRestriction): Promise<CustomerRestriction>;
  updateCustomerRestriction(customerIdentifier: string, restriction: Partial<InsertCustomerRestriction>): Promise<CustomerRestriction | undefined>;
  checkCancellationLimit(customerIdentifier: string): Promise<{ canCancel: boolean; reason?: string }>;
  recordCancellation(customerIdentifier: string): Promise<void>;
  
  // Order workflow methods with balance management
  updateOrderStatusWithBalanceLogic(orderId: string, status: string): Promise<Order | undefined>;
  
  // Email delivery tracking methods
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getAllEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsByOrder(orderId: string): Promise<EmailLog[]>;
  getEmailLogsByAddress(emailAddress: string): Promise<EmailLog[]>;

  // Manual credit
  manualCredit({ currency, amount, reason }: { currency: string, amount: string, reason?: string }): Promise<Balance | undefined>;
  // Manual debit
  manualDebit({ currency, amount, reason }: { currency: string, amount: string, reason?: string }): Promise<Balance | undefined>;

  // System status methods
  getSystemStatus(): Promise<'on' | 'off'>;
  setSystemStatus(status: 'on' | 'off'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, role: "user" })
      .returning();
    return user;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    console.log('=== [createOrder] Attempting to create order ===');
    console.log('[createOrder] Received order:', insertOrder);
    try {
      const orderCount = await db.select().from(orders);
      const orderId = `DGL-${new Date().getFullYear()}-${(orderCount.length + 1).toString().padStart(6, '0')}`;
      
      // Payment wallet addresses based on receive method
      const receiveMethod = insertOrder.receiveMethod || 'unknown';
      const paymentWallets: Record<string, string> = {
        'zaad': '*880*637834431*amount#',
        'sahal': '*883*905865292*amount#',
        'evc': '*799*34996012*amount#',
        'edahab': '0626451011',
        'premier': '0616451011',
        'moneygo': 'U2778451',
        'trx': 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv',
        'trc20': 'THspUcX2atLi7e4cQdMLqNBrn13RrNaRkv',
        'peb20': '0x5f3c72277de38d91e12f6f594ac8353c21d73c83',
        'unknown': 'Unknown'
      };

      const paymentWallet = paymentWallets[receiveMethod] || 'Unknown';

      // Check if sufficient balance is available
      const receiveAmountNum = parseFloat(insertOrder.receiveAmount || '0');
      const receiveCurrency = receiveMethod.toUpperCase();
      
      const currentBalance = await this.getBalance(receiveCurrency);
      console.log(`[createOrder] Current balance for ${receiveCurrency}:`, currentBalance?.amount);
      if (!currentBalance || parseFloat(currentBalance.amount) < receiveAmountNum) {
        throw new Error(`Insufficient balance. Available: ${currentBalance?.amount || 0} ${receiveCurrency}, Required: ${receiveAmountNum} ${receiveCurrency}`);
      }

      console.log(`ORDER ${orderId}: Balance check passed - $${receiveAmountNum} ${receiveCurrency} available. Current balance: $${currentBalance.amount}`);

      // IMMEDIATELY DEDUCT BALANCE WHEN ORDER IS CREATED
      const newBalance = parseFloat(currentBalance.amount) - receiveAmountNum;
      await this.updateBalance({
        currency: receiveCurrency,
        amount: newBalance.toString()
      });

      console.log(`[createOrder] Deducted ${receiveAmountNum} from ${receiveCurrency}. New balance: ${newBalance}`);

      // Create the order
      const [newOrder] = await db.insert(orders).values({
        orderId,
        fullName: insertOrder.fullName,
        email: insertOrder.email,
        phoneNumber: insertOrder.phoneNumber,
        senderAccount: insertOrder.senderAccount,
        walletAddress: insertOrder.walletAddress,
        sendMethod: insertOrder.sendMethod,
        receiveMethod: insertOrder.receiveMethod,
        sendAmount: insertOrder.sendAmount,
        receiveAmount: insertOrder.receiveAmount,
        exchangeRate: insertOrder.exchangeRate,
        paymentWallet,
        status: 'pending'
      }).returning();
      
      console.log(`ORDER ${orderId}: Created successfully. Balance already deducted.`);

      // Log the transaction
      await this.createTransaction({
        orderId: orderId,
        type: "ORDER_CREATED",
        currency: receiveCurrency,
        amount: receiveAmountNum.toString(),
        fromWallet: "exchange_wallet",
        toWallet: "pending_orders",
        description: `Order created - ${receiveAmountNum} ${receiveCurrency} deducted from balance`
      });

      return newOrder;
    } catch (error) {
      console.log('=== [createOrder ERROR] ===');
      console.log('Order data:', insertOrder);
      console.log('Error object:', error);
      console.log('Error stack:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.orderId, orderId))
      .returning();
    return order || undefined;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db
      .insert(contactMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageResponse(messageId: number, response: string): Promise<ContactMessage | undefined> {
    const [message] = await db
      .update(contactMessages)
      .set({
        adminResponse: response,
        responseDate: new Date()
      })
      .where(eq(contactMessages.id, messageId))
      .returning();
    return message || undefined;
  }

  async getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined> {
    // Try both lowercase and uppercase for flexible lookup
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    // First try lowercase (most common in database)
    let [rate] = await db
      .select()
      .from(exchangeRates)
      .where(and(eq(exchangeRates.fromCurrency, fromLower), eq(exchangeRates.toCurrency, toLower)));
    
    // If not found, try uppercase
    if (!rate) {
      [rate] = await db
        .select()
        .from(exchangeRates)
        .where(and(eq(exchangeRates.fromCurrency, fromUpper), eq(exchangeRates.toCurrency, toUpper)));
    }
    
    return rate || undefined;
  }

  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates);
  }

  async updateExchangeRate(insertRate: InsertExchangeRate, changedBy: string = 'admin', changeReason?: string): Promise<ExchangeRate> {
    const existing = await this.getExchangeRate(insertRate.fromCurrency, insertRate.toCurrency);
    
    if (existing) {
      // Record the change in history before updating
      await db.insert(exchangeRateHistory).values({
        fromCurrency: insertRate.fromCurrency,
        toCurrency: insertRate.toCurrency,
        oldRate: existing.rate,
        newRate: insertRate.rate,
        changedBy: changedBy,
        changeReason: changeReason
      });
      
      // Force replace old data with new data - no merging, complete replacement
      const [rate] = await db
        .update(exchangeRates)
        .set({ 
          rate: insertRate.rate, 
          updatedAt: new Date(),
          fromCurrency: insertRate.fromCurrency,
          toCurrency: insertRate.toCurrency
        })
        .where(eq(exchangeRates.id, existing.id))
        .returning();
      console.log(`REPLACED old exchange rate data: ${existing.rate} → ${insertRate.rate} for ${insertRate.fromCurrency}/${insertRate.toCurrency} (changed by: ${changedBy})`);
      return rate;
    } else {
      // Record the change in history for new rates
      await db.insert(exchangeRateHistory).values({
        fromCurrency: insertRate.fromCurrency,
        toCurrency: insertRate.toCurrency,
        oldRate: null,
        newRate: insertRate.rate,
        changedBy: changedBy,
        changeReason: changeReason || 'Initial rate setup'
      });
      
      // Insert completely new data
      const [rate] = await db
        .insert(exchangeRates)
        .values(insertRate)
        .returning();
      console.log(`INSERTED new exchange rate data: ${insertRate.rate} for ${insertRate.fromCurrency}/${insertRate.toCurrency} (changed by: ${changedBy})`);
      return rate;
    }
  }

  async getExchangeRateHistory(from?: string, to?: string): Promise<ExchangeRateHistory[]> {
    if (from && to) {
      return await db
        .select()
        .from(exchangeRateHistory)
        .where(and(
          eq(exchangeRateHistory.fromCurrency, from),
          eq(exchangeRateHistory.toCurrency, to)
        ))
        .orderBy(desc(exchangeRateHistory.createdAt));
    } else if (from) {
      return await db
        .select()
        .from(exchangeRateHistory)
        .where(eq(exchangeRateHistory.fromCurrency, from))
        .orderBy(desc(exchangeRateHistory.createdAt));
    } else if (to) {
      return await db
        .select()
        .from(exchangeRateHistory)
        .where(eq(exchangeRateHistory.toCurrency, to))
        .orderBy(desc(exchangeRateHistory.createdAt));
    } else {
      return await db
        .select()
        .from(exchangeRateHistory)
        .orderBy(desc(exchangeRateHistory.createdAt));
    }
  }

  async getCurrencyLimit(from: string, to: string): Promise<CurrencyLimit | undefined> {
    const [limit] = await db.select().from(currencyLimits)
      .where(and(eq(currencyLimits.fromCurrency, from), eq(currencyLimits.toCurrency, to)));
    return limit || undefined;
  }

  async getAllCurrencyLimits(): Promise<CurrencyLimit[]> {
    return await db.select().from(currencyLimits);
  }

  async updateCurrencyLimit(insertLimit: InsertCurrencyLimit): Promise<CurrencyLimit> {
    const existing = await this.getCurrencyLimit(insertLimit.fromCurrency, insertLimit.toCurrency);
    
    // Enforce $10,000 maximum limit at database level
    const enforceMaxAmount = Math.min(parseFloat(insertLimit.maxAmount || "10000"), 10000).toString();
    
    if (existing) {
      // Force replace old limit data with new data - complete replacement with $10,000 enforcement
      const [limit] = await db
        .update(currencyLimits)
        .set({ 
          minAmount: insertLimit.minAmount, 
          maxAmount: enforceMaxAmount, // Use enforced maximum
          updatedAt: new Date(),
          fromCurrency: insertLimit.fromCurrency,
          toCurrency: insertLimit.toCurrency
        })
        .where(eq(currencyLimits.id, existing.id))
        .returning();
      console.log(`REPLACED old currency limit data: min ${existing.minAmount} → ${insertLimit.minAmount}, max ${existing.maxAmount} → ${enforceMaxAmount} for ${insertLimit.fromCurrency} (enforced $10,000 maximum)`);
      return limit;
    } else {
      // Insert completely new limit data with $10,000 enforcement
      const [limit] = await db
        .insert(currencyLimits)
        .values({
          ...insertLimit,
          maxAmount: enforceMaxAmount // Use enforced maximum
        })
        .returning();
      console.log(`INSERTED new currency limit data: min ${insertLimit.minAmount}, max ${enforceMaxAmount} for ${insertLimit.fromCurrency} (enforced $10,000 maximum)`);
      return limit;
    }
  }

  async clearAllCurrencyLimits(): Promise<void> {
    await db.delete(currencyLimits);
    console.log('Cleared all currency limit overrides from database');
  }

  async getWalletAddress(method: string): Promise<WalletAddress | undefined> {
    const [wallet] = await db.select().from(walletAddresses).where(eq(walletAddresses.method, method));
    return wallet || undefined;
  }

  async getAllWalletAddresses(): Promise<WalletAddress[]> {
    return await db.select().from(walletAddresses);
  }

  async updateWalletAddress(insertWallet: InsertWalletAddress): Promise<WalletAddress> {
    const existing = await this.getWalletAddress(insertWallet.method);
    
    if (existing) {
      const [wallet] = await db
        .update(walletAddresses)
        .set({ 
          address: insertWallet.address, 
          updatedAt: new Date() 
        })
        .where(eq(walletAddresses.id, existing.id))
        .returning();
      return wallet;
    } else {
      const [wallet] = await db
        .insert(walletAddresses)
        .values(insertWallet)
        .returning();
      return wallet;
    }
  }

  async getBalance(currency: string): Promise<Balance | undefined> {
    const [balance] = await db.select().from(balances).where(eq(balances.currency, currency.toLowerCase()));
    return balance || undefined;
  }

  async getAllBalances(forceZero = false): Promise<Balance[]> {
    const balancesList = await db.select().from(balances);
    // Merge balances with the same currency (case-insensitive)
    const merged: Record<string, Balance> = {};
    for (const b of balancesList) {
      const upper = b.currency.toUpperCase();
      if (!merged[upper]) {
        merged[upper] = { ...b, currency: upper };
      } else {
        // If duplicate, sum the amounts
        merged[upper].amount = (parseFloat(merged[upper].amount) + parseFloat(b.amount)).toString();
      }
    }
    const result = Object.values(merged).map(b => ({ ...b, currency: b.currency.toUpperCase(), amount: forceZero ? '0' : b.amount }));
    return result;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    // Always store currency as uppercase
    const currencyUpper = insertBalance.currency.toUpperCase();
    // Delete all other rows for this currency (case-insensitive)
    // Use a raw SQL query for compatibility
    await db.execute(`DELETE FROM balances WHERE UPPER(currency) = $1`, [currencyUpper]);
    // Log before update
    console.log(`[updateBalance] CLEANED: All rows for currency=${currencyUpper} deleted before update.`);

    // Use upsert to avoid duplicate key errors (should only be one row now)
    const [balance] = await db
      .insert(balances)
      .values({
        currency: currencyUpper,
        amount: insertBalance.amount,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: balances.currency,
        set: {
          amount: insertBalance.amount,
          updatedAt: new Date()
        }
      })
      .returning();

    // Log after update
    console.log(`[updateBalance] AFTER: currency=${balance.currency}, updatedAmount=${balance.amount}`);
    
    // Handle EVC Plus currency synchronization - when updating EVC or EVCPLUS, sync both
    if (currencyUpper === 'EVC' || currencyUpper === 'EVCPLUS') {
      const syncCurrency = currencyUpper === 'EVC' ? 'EVCPLUS' : 'EVC';
      await db.execute(`DELETE FROM balances WHERE UPPER(currency) = $1`, [syncCurrency]);
      await db
        .insert(balances)
        .values({
          currency: syncCurrency,
          amount: insertBalance.amount,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: balances.currency,
          set: {
            amount: insertBalance.amount,
            updatedAt: new Date()
          }
        });
      console.log(`[updateBalance] SYNC: currency=${syncCurrency}, syncedAmount=${insertBalance.amount}`);
    }
    
    // Notify WebSocket clients about balance update
    const { wsManager } = await import('./websocket');
    wsManager.notifyBalanceUpdate(currencyUpper, parseFloat(insertBalance.amount));
    
    return { ...balance, currency: currencyUpper };
  }

  async deductBalance(currency: string, amount: number): Promise<Balance | undefined> {
    const currentBalance = await this.getBalance(currency);
    if (!currentBalance) {
      // Initialize balance if it doesn't exist
      return await this.updateBalance({ 
        currency: currency.toLowerCase(), 
        amount: (0 - amount).toString() 
      });
    }

    const currentAmount = parseFloat(currentBalance.amount);
    const newAmount = currentAmount - amount;
    
    return await this.updateBalance({ 
      currency: currency.toLowerCase(), 
      amount: newAmount.toString() 
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getTransactionsByOrder(orderId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.orderId, orderId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getAdminContactInfo(): Promise<AdminContactInfo | undefined> {
    const [info] = await db.select().from(adminContactInfo).limit(1);
    return info || undefined;
  }

  async updateAdminContactInfo(insertInfo: InsertAdminContactInfo): Promise<AdminContactInfo> {
    const existing = await this.getAdminContactInfo();
    
    if (existing) {
      // Force replace old contact data with new data - complete replacement
      const [info] = await db
        .update(adminContactInfo)
        .set({ 
          email: insertInfo.email,
          whatsapp: insertInfo.whatsapp,
          telegram: insertInfo.telegram,
          updatedAt: new Date()
        })
        .where(eq(adminContactInfo.id, existing.id))
        .returning();
      console.log(`REPLACED old admin contact info: Email ${existing.email} → ${insertInfo.email}, WhatsApp ${existing.whatsapp} → ${insertInfo.whatsapp}, Telegram ${existing.telegram} → ${insertInfo.telegram}`);
      return info;
    } else {
      // Insert completely new contact info
      const [info] = await db
        .insert(adminContactInfo)
        .values(insertInfo)
        .returning();
      console.log(`INSERTED new admin contact info: Email ${insertInfo.email}, WhatsApp ${insertInfo.whatsapp}, Telegram ${insertInfo.telegram}`);
      return info;
    }
  }

  async updateOrderStatusWithBalanceLogic(orderId: string, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(orderId);
    if (!order) return undefined;
    console.log(`[updateOrderStatusWithBalanceLogic] Order:`, order, 'New status:', status);
    // If this is a test order, skip all balance logic
    if (order.status === 'test' || order.status === 'new' || status === 'test' || status === 'new') {
      // Just update status, skip balance changes
      await db.update(orders).set({ status }).where(eq(orders.orderId, orderId));
      return await this.getOrder(orderId);
    }

    const receiveAmountNum = parseFloat(order.receiveAmount || '0');
    const receiveCurrency = (order.receiveMethod || 'unknown').toUpperCase();

    // Begin transaction-like logic for balance management
    try {
      // Handle status transitions according to workflow
      if (status === "cancelled") {
        // Restore the balance that was deducted when order was created
        const currentBalance = await this.getBalance(receiveCurrency);
        if (currentBalance) {
          const restoredBalance = parseFloat(currentBalance.amount) + receiveAmountNum;
          console.log(`[updateOrderStatusWithBalanceLogic] Restoring ${receiveAmountNum} to ${receiveCurrency}. Old balance: ${currentBalance.amount}, New balance: ${restoredBalance}`);
          await this.updateBalance({
            currency: receiveCurrency,
            amount: restoredBalance.toString()
          });
          
          console.log(`ORDER ${orderId}: Cancelled - Restored $${receiveAmountNum} ${receiveCurrency} to balance. New balance: $${restoredBalance}`);
        }

        // Log the cancellation transaction
        await this.createTransaction({
          orderId: order.orderId,
          type: "CANCELLED",
          currency: receiveCurrency,
          amount: receiveAmountNum.toString(),
          fromWallet: "pending_orders",
          toWallet: "exchange_wallet",
          description: `Order cancelled - ${receiveAmountNum} ${receiveCurrency} restored to balance`
        });

        // Update order status to cancelled
        await db
          .update(orders)
          .set({ 
            status: status, 
            updatedAt: new Date() 
          })
          .where(eq(orders.orderId, orderId));
      } else if (status === "completed") {
        // Balance was already deducted when order was created
        // Just log the completion transaction
        await this.createTransaction({
          orderId: order.orderId,
          type: "COMPLETED",
          currency: receiveCurrency,
          amount: receiveAmountNum.toString(),
          fromWallet: "exchange_wallet",
          toWallet: "customer_wallet",
          description: `Order completed - ${receiveAmountNum} ${receiveCurrency} paid to customer`
        });

        console.log(`[updateOrderStatusWithBalanceLogic] Order completed. No balance change. Status: completed`);

        // Update order status
        await db
          .update(orders)
          .set({ 
            status: status, 
            updatedAt: new Date() 
          })
          .where(eq(orders.orderId, orderId));
      } else if (status === "paid") {
        // Balance was already deducted when order was created
        // Just log the payment transaction
        await this.createTransaction({
          orderId: order.orderId,
          type: "PAID",
          currency: receiveCurrency,
          amount: receiveAmountNum.toString(),
          fromWallet: "exchange_wallet",
          toWallet: "customer_wallet",
          description: `Order paid - ${receiveAmountNum} ${receiveCurrency} reserved for customer`
        });

        console.log(`[updateOrderStatusWithBalanceLogic] Order marked as paid. No balance change. Status: paid`);

        // Update order status
        await db
          .update(orders)
          .set({ 
            status: status, 
            updatedAt: new Date() 
          })
          .where(eq(orders.orderId, orderId));
      } else {
        // For other status changes, just update status
        await db
          .update(orders)
          .set({ 
            status: status, 
            updatedAt: new Date() 
          })
          .where(eq(orders.orderId, orderId));
      }

      // Return updated order
      return await this.getOrder(orderId);
    } catch (error) {
      console.error('Error updating order status with balance logic:', error);
      throw error;
    }
  }

  async getCustomerRestriction(customerIdentifier: string): Promise<CustomerRestriction | undefined> {
    const [restriction] = await db
      .select()
      .from(customerRestrictions)
      .where(eq(customerRestrictions.customerIdentifier, customerIdentifier));
    return restriction || undefined;
  }

  async createCustomerRestriction(insertRestriction: InsertCustomerRestriction): Promise<CustomerRestriction> {
    const [restriction] = await db
      .insert(customerRestrictions)
      .values(insertRestriction)
      .returning();
    return restriction;
  }

  async updateCustomerRestriction(customerIdentifier: string, restriction: Partial<InsertCustomerRestriction>): Promise<CustomerRestriction | undefined> {
    const [updated] = await db
      .update(customerRestrictions)
      .set({
        ...restriction,
        updatedAt: new Date(),
      })
      .where(eq(customerRestrictions.customerIdentifier, customerIdentifier))
      .returning();
    return updated || undefined;
  }

  async checkCancellationLimit(customerIdentifier: string): Promise<{ canCancel: boolean; reason?: string }> {
    const restriction = await this.getCustomerRestriction(customerIdentifier);
    
    if (!restriction) {
      return { canCancel: true };
    }

    // Check if customer is currently restricted
    if (restriction.restrictedUntil && new Date() < new Date(restriction.restrictedUntil)) {
      const hoursLeft = Math.ceil((new Date(restriction.restrictedUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60));
      return { 
        canCancel: false, 
        reason: `You have reached the maximum cancellation limit. You can cancel orders again in ${hoursLeft} hours.` 
      };
    }

    // Check if customer has reached 3 cancellations in the last 24 hours
    if (restriction.cancellationCount >= 3 && restriction.lastCancellationAt) {
      const hoursSinceLastCancellation = (new Date().getTime() - new Date(restriction.lastCancellationAt).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCancellation < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceLastCancellation);
        return { 
          canCancel: false, 
          reason: `You have reached the maximum cancellation limit (3 per day). You can cancel orders again in ${hoursLeft} hours.` 
        };
      }
      
      // Reset count if 24 hours have passed
      await this.updateCustomerRestriction(customerIdentifier, {
        cancellationCount: 0,
        restrictedUntil: null,
      });
      return { canCancel: true };
    }

    return { canCancel: true };
  }

  async recordCancellation(customerIdentifier: string): Promise<void> {
    const restriction = await this.getCustomerRestriction(customerIdentifier);
    const now = new Date();
    
    if (!restriction) {
      // Create new restriction record
      await this.createCustomerRestriction({
        customerIdentifier,
        cancellationCount: 1,
        lastCancellationAt: now,
        restrictedUntil: null,
      });
    } else {
      const newCount = restriction.cancellationCount + 1;
      let restrictedUntil = null;
      
      // If this is the 3rd cancellation, restrict for 24 hours
      if (newCount >= 3) {
        restrictedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      }
      
      await this.updateCustomerRestriction(customerIdentifier, {
        cancellationCount: newCount,
        lastCancellationAt: now,
        restrictedUntil,
      });
    }
  }

  async createEmailLog(insertLog: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db.insert(emailLogs).values(insertLog).returning();
    return log;
  }

  async getAllEmailLogs(): Promise<EmailLog[]> {
    return await db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByOrder(orderId: string): Promise<EmailLog[]> {
    return await db.select().from(emailLogs)
      .where(eq(emailLogs.orderId, orderId))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByAddress(emailAddress: string): Promise<EmailLog[]> {
    return await db.select().from(emailLogs)
      .where(eq(emailLogs.emailAddress, emailAddress))
      .orderBy(desc(emailLogs.sentAt));
  }

  // Manual credit
  async manualCredit({ currency, amount, reason }: { currency: string, amount: string, reason?: string }) {
    const current = await this.getBalance(currency);
    const newAmount = (parseFloat(current?.amount || '0') + parseFloat(amount)).toString();
    console.log(`[manualCredit] Crediting ${amount} to ${currency}. Old balance: ${current?.amount}, New balance: ${newAmount}`);
    await this.updateBalance({ currency, amount: newAmount });
    await this.createTransaction({
      orderId: null,
      type: 'manual-credit',
      currency,
      amount,
      fromWallet: 'manual',
      toWallet: 'exchange_wallet',
      description: reason || 'Manual credit by admin'
    });
    return await this.getBalance(currency);
  }
  // Manual debit
  async manualDebit({ currency, amount, reason }: { currency: string, amount: string, reason?: string }) {
    const current = await this.getBalance(currency);
    const newAmount = (parseFloat(current?.amount || '0') - parseFloat(amount)).toString();
    console.log(`[manualDebit] Debiting ${amount} from ${currency}. Old balance: ${current?.amount}, New balance: ${newAmount}`);
    await this.updateBalance({ currency, amount: newAmount });
    await this.createTransaction({
      orderId: null,
      type: 'manual-debit',
      currency,
      amount,
      fromWallet: 'exchange_wallet',
      toWallet: 'manual',
      description: reason || 'Manual debit by admin'
    });
    return await this.getBalance(currency);
  }

  // System status methods
  async getSystemStatus(): Promise<'on' | 'off'> {
    try {
      const [row] = await db.select().from(systemStatus).limit(1);
      return (row?.status === 'off') ? 'off' : 'on';
    } catch (error) {
      console.log('System status table not found, defaulting to ON:', error);
      return 'on';
    }
  }
  async setSystemStatus(status: 'on' | 'off'): Promise<void> {
    try {
      const [existing] = await db.select().from(systemStatus).limit(1);
      if (existing) {
        await db.update(systemStatus).set({ status }).where(systemStatus.id === existing.id);
      } else {
        await db.insert(systemStatus).values({ status }).execute();
      }
    } catch (error) {
      console.error('Error setting system status:', error);
      // If table doesn't exist, we'll just log the error but not crash
    }
  }
}

export const storage = new DatabaseStorage();
