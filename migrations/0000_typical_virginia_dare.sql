CREATE TABLE "admin_contact_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"whatsapp" text,
	"telegram" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balances_currency_unique" UNIQUE("currency")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"admin_response" text,
	"response_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"min_amount" numeric(10, 2) DEFAULT '5.00' NOT NULL,
	"max_amount" numeric(10, 2) DEFAULT '10000.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_restrictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_identifier" text NOT NULL,
	"cancellation_count" integer DEFAULT 0 NOT NULL,
	"last_cancellation_at" timestamp,
	"restricted_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"email_address" text NOT NULL,
	"email_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rate_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"old_rate" numeric(10, 6),
	"new_rate" numeric(10, 6) NOT NULL,
	"changed_by" text NOT NULL,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"rate" numeric(10, 6) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone_number" text NOT NULL,
	"sender_account" text DEFAULT '' NOT NULL,
	"wallet_address" text NOT NULL,
	"send_method" text NOT NULL,
	"receive_method" text NOT NULL,
	"send_amount" numeric(10, 2) NOT NULL,
	"receive_amount" numeric(10, 2) NOT NULL,
	"exchange_rate" numeric(10, 6) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_wallet" text NOT NULL,
	"hold_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "system_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(8) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" text NOT NULL,
	"currency" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"from_wallet" text NOT NULL,
	"to_wallet" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"full_name" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"email_verified" text DEFAULT 'false',
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallet_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"address" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_addresses_method_unique" UNIQUE("method")
);
