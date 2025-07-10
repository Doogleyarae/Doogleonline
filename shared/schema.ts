import { pgTable, text, serial, timestamp, decimal, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().default(""),
  phoneNumber: text("phone_number").notNull(),
  senderAccount: text("sender_account").notNull().default(""),
  walletAddress: text("wallet_address").notNull(),
  sendMethod: text("send_method").notNull(),
  receiveMethod: text("receive_method").notNull(),
  sendAmount: decimal("send_amount", { precision: 10, scale: 2 }).notNull(),
  receiveAmount: decimal("receive_amount", { precision: 10, scale: 2 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled, paid
  paymentWallet: text("payment_wallet").notNull(),
  holdAmount: decimal("hold_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  adminResponse: text("admin_response"),
  responseDate: timestamp("response_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchemaValidated = insertOrderSchema.extend({
  phoneNumber: z.string().optional(),
  fullName: z.string().optional(),
  sendMethod: z.string(),
}).superRefine((data, ctx) => {
  // Only require fullName for these send methods
  const requireFullName = ['zaad', 'sahal', 'evc', 'edahab', 'premier'];
  if (requireFullName.includes((data.sendMethod || '').toLowerCase())) {
    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name is required for this send method',
      });
    }
  }
  // phoneNumber is never required
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

// Wallet addresses schema for admin management
export const walletAddresses = pgTable("wallet_addresses", {
  id: serial("id").primaryKey(),
  method: text("method").notNull().unique(),
  address: text("address").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWalletAddressSchema = createInsertSchema(walletAddresses).omit({
  id: true,
  updatedAt: true,
});

export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddress = typeof walletAddresses.$inferSelect;

// Balance management schema for tracking currency balances
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  updatedAt: true,
});

export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;

// Transactions schema for tracking all wallet movements
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  type: text("type").notNull(), // HOLD, RELEASE, PAYOUT
  currency: text("currency").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fromWallet: text("from_wallet").notNull(), // exchange_wallet, customer_wallet
  toWallet: text("to_wallet").notNull(), // exchange_wallet, customer_wallet
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Admin contact information table
export const adminContactInfo = pgTable("admin_contact_info", {
  id: serial("id").primaryKey(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  telegram: text("telegram"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminContactInfoSchema = createInsertSchema(adminContactInfo).omit({
  id: true,
  updatedAt: true,
});

export type InsertAdminContactInfo = z.infer<typeof insertAdminContactInfoSchema>;
export type AdminContactInfo = typeof adminContactInfo.$inferSelect;

// Customer restrictions table for tracking order cancellations
export const customerRestrictions = pgTable("customer_restrictions", {
  id: serial("id").primaryKey(),
  customerIdentifier: text("customer_identifier").notNull(), // phone number or email
  cancellationCount: integer("cancellation_count").notNull().default(0),
  lastCancellationAt: timestamp("last_cancellation_at"),
  restrictedUntil: timestamp("restricted_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerRestrictionSchema = createInsertSchema(customerRestrictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerRestriction = z.infer<typeof insertCustomerRestrictionSchema>;
export type CustomerRestriction = typeof customerRestrictions.$inferSelect;

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  emailAddress: text("email_address").notNull(),
  emailType: text("email_type").notNull(), // order_confirmation, payment_confirmation, order_completion, test_email
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull().default("sent"), // sent, failed, pending
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Exchange rate history table for tracking all rate changes
export const exchangeRateHistory = pgTable("exchange_rate_history", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  oldRate: decimal("old_rate", { precision: 10, scale: 6 }),
  newRate: decimal("new_rate", { precision: 10, scale: 6 }).notNull(),
  changedBy: text("changed_by").notNull(), // username of admin who made the change
  changeReason: text("change_reason"), // optional reason for the change
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExchangeRateHistorySchema = createInsertSchema(exchangeRateHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertExchangeRateHistory = z.infer<typeof insertExchangeRateHistorySchema>;
export type ExchangeRateHistory = typeof exchangeRateHistory.$inferSelect;

export const systemStatus = pgTable('system_status', {
  id: serial('id').primaryKey(),
  status: varchar('status', { length: 8 }).notNull(), // 'on' or 'off'
});
