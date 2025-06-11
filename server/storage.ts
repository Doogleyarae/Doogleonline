import { users, orders, contactMessages, type User, type InsertUser, type Order, type InsertOrder, type ContactMessage, type InsertContactMessage } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orders: Map<string, Order>;
  private contactMessages: Map<number, ContactMessage>;
  private currentUserId: number;
  private currentOrderId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.contactMessages = new Map();
    this.currentUserId = 1;
    this.currentOrderId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const orderId = `DGL-${new Date().getFullYear()}-${id.toString().padStart(6, '0')}`;
    const now = new Date();
    
    // Mock payment wallet addresses based on receive method
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

    const order: Order = {
      id,
      orderId,
      ...insertOrder,
      paymentWallet: paymentWallets[insertOrder.receiveMethod] || 'Unknown',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    this.orders.set(orderId, order);
    return order;
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (order) {
      const updatedOrder = { ...order, status, updatedAt: new Date() };
      this.orders.set(orderId, updatedOrder);
      return updatedOrder;
    }
    return undefined;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.currentMessageId++;
    const message: ContactMessage = {
      id,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values());
  }
}

export const storage = new MemStorage();
