import { pgTable, text, serial, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  walletAddress: text("wallet_address").notNull(),
  sendMethod: text("send_method").notNull(),
  receiveMethod: text("receive_method").notNull(),
  sendAmount: decimal("send_amount", { precision: 10, scale: 2 }).notNull(),
  receiveAmount: decimal("receive_amount", { precision: 10, scale: 2 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled
  paymentWallet: text("payment_wallet").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderId: true,
  paymentWallet: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Exchange rates schema for admin management
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  updatedAt: true,
});

export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;

// Users schema for existing setup
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, admin
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Currency limits schema for currency-specific exchange limits
export const currencyLimits = pgTable("currency_limits", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).notNull().default("5.00"),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }).notNull().default("10000.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCurrencyLimitSchema = createInsertSchema(currencyLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCurrencyLimit = z.infer<typeof insertCurrencyLimitSchema>;
export type CurrencyLimit = typeof currencyLimits.$inferSelect;
