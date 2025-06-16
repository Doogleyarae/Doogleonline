import { users, orders, contactMessages, exchangeRates, currencyLimits, walletAddresses, balances, transactions, adminContactInfo, type User, type InsertUser, type Order, type InsertOrder, type ContactMessage, type InsertContactMessage, type ExchangeRate, type InsertExchangeRate, type CurrencyLimit, type InsertCurrencyLimit, type WalletAddress, type InsertWalletAddress, type Balance, type InsertBalance, type Transaction, type InsertTransaction, type AdminContactInfo, type InsertAdminContactInfo } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
  
  // Exchange rate methods
  getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined>;
  getAllExchangeRates(): Promise<ExchangeRate[]>;
  updateExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  
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
  getAllBalances(): Promise<Balance[]>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  deductBalance(currency: string, amount: number): Promise<Balance | undefined>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByOrder(orderId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Admin contact information methods
  getAdminContactInfo(): Promise<AdminContactInfo | undefined>;
  updateAdminContactInfo(info: InsertAdminContactInfo): Promise<AdminContactInfo>;
  
  // Order workflow methods with balance management
  updateOrderStatusWithBalanceLogic(orderId: string, status: string): Promise<Order | undefined>;
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
    const orderCount = await db.select().from(orders);
    const orderId = `DGL-${new Date().getFullYear()}-${(orderCount.length + 1).toString().padStart(6, '0')}`;
    
    // Payment wallet addresses based on receive method
    const paymentWallets: Record<string, string> = {
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

    const [order] = await db
      .insert(orders)
      .values({
        orderId,
        ...insertOrder,
        paymentWallet: paymentWallets[insertOrder.receiveMethod] || 'Unknown',
        status: 'pending',
      })
      .returning();
    return order;
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
    return await db.select().from(contactMessages);
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

  async updateExchangeRate(insertRate: InsertExchangeRate): Promise<ExchangeRate> {
    const existing = await this.getExchangeRate(insertRate.fromCurrency, insertRate.toCurrency);
    
    if (existing) {
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
      console.log(`REPLACED old exchange rate data: ${existing.rate} → ${insertRate.rate} for ${insertRate.fromCurrency}/${insertRate.toCurrency}`);
      return rate;
    } else {
      // Insert completely new data
      const [rate] = await db
        .insert(exchangeRates)
        .values(insertRate)
        .returning();
      console.log(`INSERTED new exchange rate data: ${insertRate.rate} for ${insertRate.fromCurrency}/${insertRate.toCurrency}`);
      return rate;
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
    
    if (existing) {
      // Force replace old limit data with new data - complete replacement
      const [limit] = await db
        .update(currencyLimits)
        .set({ 
          minAmount: insertLimit.minAmount, 
          maxAmount: insertLimit.maxAmount, 
          updatedAt: new Date(),
          fromCurrency: insertLimit.fromCurrency,
          toCurrency: insertLimit.toCurrency
        })
        .where(eq(currencyLimits.id, existing.id))
        .returning();
      console.log(`REPLACED old currency limit data: min ${existing.minAmount} → ${insertLimit.minAmount}, max ${existing.maxAmount} → ${insertLimit.maxAmount} for ${insertLimit.fromCurrency}`);
      return limit;
    } else {
      // Insert completely new limit data
      const [limit] = await db
        .insert(currencyLimits)
        .values(insertLimit)
        .returning();
      console.log(`INSERTED new currency limit data: min ${insertLimit.minAmount}, max ${insertLimit.maxAmount} for ${insertLimit.fromCurrency}`);
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

  async getAllBalances(): Promise<Balance[]> {
    return await db.select().from(balances);
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    const existing = await this.getBalance(insertBalance.currency);
    
    let balance: Balance;
    if (existing) {
      // Force replace old balance data with new data - complete replacement
      const [updatedBalance] = await db
        .update(balances)
        .set({ 
          amount: insertBalance.amount, 
          updatedAt: new Date(),
          currency: insertBalance.currency
        })
        .where(eq(balances.id, existing.id))
        .returning();
      balance = updatedBalance;
      console.log(`REPLACED old balance data: ${existing.amount} → ${insertBalance.amount} for ${insertBalance.currency}`);
    } else {
      // Insert completely new balance data
      const [newBalance] = await db
        .insert(balances)
        .values(insertBalance)
        .returning();
      balance = newBalance;
      console.log(`INSERTED new balance data: ${insertBalance.amount} for ${insertBalance.currency}`);
    }
    
    // Handle EVC Plus currency synchronization - when updating EVC or EVCPLUS, sync both
    const currency = insertBalance.currency.toLowerCase();
    if (currency === 'evc' || currency === 'evcplus') {
      const syncCurrency = currency === 'evc' ? 'evcplus' : 'evc';
      const syncExisting = await this.getBalance(syncCurrency);
      
      if (syncExisting) {
        await db
          .update(balances)
          .set({ 
            amount: insertBalance.amount, 
            updatedAt: new Date() 
          })
          .where(eq(balances.id, syncExisting.id));
      } else {
        await db
          .insert(balances)
          .values({
            currency: syncCurrency,
            amount: insertBalance.amount
          });
      }
    }
    
    return balance;
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

    const receiveAmountNum = parseFloat(order.receiveAmount);
    const receiveCurrency = order.receiveMethod.toUpperCase();

    // Begin transaction-like logic for balance management
    try {
      // Handle status transitions according to workflow
      if (status === "cancelled") {
        // C. Admin "Cancel" - Release hold amount back to available balance
        if (parseFloat(order.holdAmount) > 0) {
          // Increase available balance by hold amount
          const currentBalance = await this.getBalance(receiveCurrency);
          const currentAmount = currentBalance ? parseFloat(currentBalance.amount) : 0;
          const newAmount = currentAmount + parseFloat(order.holdAmount);
          
          await this.updateBalance({
            currency: receiveCurrency.toLowerCase(),
            amount: newAmount.toString()
          });

          // Log the release transaction
          await this.createTransaction({
            orderId: order.orderId,
            type: "RELEASE",
            currency: receiveCurrency,
            amount: order.holdAmount,
            fromWallet: "hold",
            toWallet: "exchange_wallet",
            description: `Released ${order.holdAmount} ${receiveCurrency} from hold - order cancelled`
          });

          // Update order to clear hold amount
          await db
            .update(orders)
            .set({ 
              status: status, 
              holdAmount: "0",
              updatedAt: new Date() 
            })
            .where(eq(orders.orderId, orderId));
        }
      } else if (status === "completed") {
        // D. Admin "Completed" - Decrease exchange wallet, increase customer wallet
        const currentBalance = await this.getBalance(receiveCurrency);
        const currentAmount = currentBalance ? parseFloat(currentBalance.amount) : 0;
        const newAmount = currentAmount - receiveAmountNum;
        
        // Update exchange wallet balance
        await this.updateBalance({
          currency: receiveCurrency.toLowerCase(),
          amount: newAmount.toString()
        });

        // Log the payout transaction
        await this.createTransaction({
          orderId: order.orderId,
          type: "PAYOUT",
          currency: receiveCurrency,
          amount: receiveAmountNum.toString(),
          fromWallet: "exchange_wallet",
          toWallet: "customer_wallet",
          description: `Payout ${receiveAmountNum} ${receiveCurrency} to customer - order completed`
        });

        // Update order status and clear hold amount
        await db
          .update(orders)
          .set({ 
            status: status, 
            holdAmount: "0",
            updatedAt: new Date() 
          })
          .where(eq(orders.orderId, orderId));
      } else if (status === "paid") {
        // When marked as paid, put amount on hold
        await this.createTransaction({
          orderId: order.orderId,
          type: "HOLD",
          currency: receiveCurrency,
          amount: receiveAmountNum.toString(),
          fromWallet: "exchange_wallet",
          toWallet: "hold",
          description: `Put ${receiveAmountNum} ${receiveCurrency} on hold - order paid`
        });

        // Update order with hold amount
        await db
          .update(orders)
          .set({ 
            status: status, 
            holdAmount: receiveAmountNum.toString(),
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
}

export const storage = new DatabaseStorage();
