import { users, orders, contactMessages, exchangeRates, currencyLimits, walletAddresses, type User, type InsertUser, type Order, type InsertOrder, type ContactMessage, type InsertContactMessage, type ExchangeRate, type InsertExchangeRate, type CurrencyLimit, type InsertCurrencyLimit, type WalletAddress, type InsertWalletAddress } from "@shared/schema";
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
  
  // Wallet address methods
  getWalletAddress(method: string): Promise<WalletAddress | undefined>;
  getAllWalletAddresses(): Promise<WalletAddress[]>;
  updateWalletAddress(wallet: InsertWalletAddress): Promise<WalletAddress>;
  
  // Balance methods
  getBalance(currency: string): Promise<Balance | undefined>;
  getAllBalances(): Promise<Balance[]>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  deductBalance(currency: string, amount: number): Promise<Balance | undefined>;
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
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(and(eq(exchangeRates.fromCurrency, from), eq(exchangeRates.toCurrency, to)));
    return rate || undefined;
  }

  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates);
  }

  async updateExchangeRate(insertRate: InsertExchangeRate): Promise<ExchangeRate> {
    const existing = await this.getExchangeRate(insertRate.fromCurrency, insertRate.toCurrency);
    
    if (existing) {
      const [rate] = await db
        .update(exchangeRates)
        .set({ rate: insertRate.rate, updatedAt: new Date() })
        .where(eq(exchangeRates.id, existing.id))
        .returning();
      return rate;
    } else {
      const [rate] = await db
        .insert(exchangeRates)
        .values(insertRate)
        .returning();
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
      const [limit] = await db
        .update(currencyLimits)
        .set({ 
          minAmount: insertLimit.minAmount, 
          maxAmount: insertLimit.maxAmount, 
          updatedAt: new Date() 
        })
        .where(eq(currencyLimits.id, existing.id))
        .returning();
      return limit;
    } else {
      const [limit] = await db
        .insert(currencyLimits)
        .values(insertLimit)
        .returning();
      return limit;
    }
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
}

export const storage = new DatabaseStorage();
