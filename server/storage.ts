import { users, orders, contactMessages, exchangeRates, type User, type InsertUser, type Order, type InsertOrder, type ContactMessage, type InsertContactMessage, type ExchangeRate, type InsertExchangeRate } from "@shared/schema";
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
      'zaad': '+252611234567',
      'sahal': '+252612345678',
      'evc': '+252613456789',
      'edahab': '+252614567890',
      'premier': 'ACC-PREMIER-123456',
      'moneygo': '+252615678901',
      'trx': 'TRX1234567890ABCDEF',
      'trc20': '0x742d35CC6634C0532925a3b8D404FD8C',
      'peb20': '0x8A194C6634C0532925a3b8D404FD8C74',
      'usdc': '0x123456789ABCDEF0123456789ABCDEF01'
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
}

export const storage = new DatabaseStorage();
