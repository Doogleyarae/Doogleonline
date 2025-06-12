import type { Order, ContactMessage } from "@shared/schema";

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Mock email service - in production, integrate with SendGrid, Nodemailer, etc.
export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendOrderConfirmation(order: Order, customerEmail?: string): Promise<boolean> {
    try {
      const emailConfig: EmailConfig = {
        from: "noreply@doogleonline.com",
        to: customerEmail || "customer@example.com",
        subject: `Order Confirmation - ${order.orderId}`,
        html: this.generateOrderConfirmationHTML(order)
      };

      console.log("📧 Order confirmation email sent:", emailConfig.subject);
      return true;
    } catch (error) {
      console.error("❌ Failed to send order confirmation email:", error);
      return false;
    }
  }

  async sendStatusUpdate(order: Order, customerEmail?: string): Promise<boolean> {
    try {
      const emailConfig: EmailConfig = {
        from: "noreply@doogleonline.com",
        to: customerEmail || "customer@example.com",
        subject: `Order Status Update - ${order.orderId}`,
        html: this.generateStatusUpdateHTML(order)
      };

      console.log("📧 Status update email sent:", emailConfig.subject);
      return true;
    } catch (error) {
      console.error("❌ Failed to send status update email:", error);
      return false;
    }
  }

  async sendContactConfirmation(message: ContactMessage): Promise<boolean> {
    try {
      const emailConfig: EmailConfig = {
        from: "noreply@doogleonline.com",
        to: message.email,
        subject: "We received your message - DoogleOnline Support",
        html: this.generateContactConfirmationHTML(message)
      };

      console.log("📧 Contact confirmation email sent:", emailConfig.subject);
      return true;
    } catch (error) {
      console.error("❌ Failed to send contact confirmation email:", error);
      return false;
    }
  }

  async notifyAdmin(message: ContactMessage): Promise<boolean> {
    try {
      const emailConfig: EmailConfig = {
        from: "noreply@doogleonline.com",
        to: "admin@doogleonline.com",
        subject: `New Contact Message: ${message.subject}`,
        html: this.generateAdminNotificationHTML(message)
      };

      console.log("📧 Admin notification email sent:", emailConfig.subject);
      return true;
    } catch (error) {
      console.error("❌ Failed to send admin notification email:", error);
      return false;
    }
  }

  private generateOrderConfirmationHTML(order: Order): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .status-badge { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DoogleOnline</h1>
            <p>Order Confirmation</p>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Dear ${order.fullName},</p>
            <p>We've successfully received your exchange request. Here are the details:</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${order.status.toUpperCase()}</span></p>
              <p><strong>Exchange:</strong> ${order.sendAmount} ${order.sendMethod.toUpperCase()} → ${order.receiveAmount} ${order.receiveMethod.toUpperCase()}</p>
              <p><strong>Rate:</strong> ${parseFloat(order.exchangeRate).toFixed(6)}</p>
              <p><strong>Payment Wallet:</strong> ${order.paymentWallet}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Send your payment to the wallet address above</li>
              <li>We'll process your order within 15 minutes</li>
              <li>You'll receive another email when the transaction is complete</li>
            </ol>
            
            <p>You can track your order status anytime using Order ID: <strong>${order.orderId}</strong></p>
          </div>
          <div class="footer">
            <p>Thank you for choosing DoogleOnline</p>
            <p>For support, contact us at support@doogleonline.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateStatusUpdateHTML(order: Order): string {
    const statusMessages = {
      pending: "Your order is waiting for payment confirmation",
      processing: "We're processing your exchange request",
      completed: "Your exchange has been completed successfully!",
      cancelled: "Your order has been cancelled"
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-update { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .status-${order.status} { 
            background: ${order.status === 'completed' ? '#dcfce7' : order.status === 'processing' ? '#dbeafe' : '#fef3c7'}; 
            color: ${order.status === 'completed' ? '#166534' : order.status === 'processing' ? '#1e40af' : '#92400e'}; 
            padding: 15px; 
            border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DoogleOnline</h1>
            <p>Order Status Update</p>
          </div>
          <div class="content">
            <h2>Order ${order.orderId} Status Update</h2>
            <p>Dear ${order.fullName},</p>
            
            <div class="status-update status-${order.status}">
              <h3>Status: ${order.status.toUpperCase()}</h3>
              <p>${statusMessages[order.status as keyof typeof statusMessages]}</p>
            </div>
            
            <p><strong>Order Details:</strong></p>
            <p>Exchange: ${order.sendAmount} ${order.sendMethod.toUpperCase()} → ${order.receiveAmount} ${order.receiveMethod.toUpperCase()}</p>
            <p>Updated: ${new Date(order.updatedAt).toLocaleString()}</p>
            
            ${order.status === 'completed' ? 
              '<p style="color: #166534; font-weight: bold;">🎉 Your exchange is complete! The funds should be available in your wallet.</p>' :
              '<p>We\'ll keep you updated as your order progresses.</p>'
            }
          </div>
          <div class="footer">
            <p>Track your order: <a href="https://doogleonline.com/track">https://doogleonline.com/track</a></p>
            <p>For support, contact us at support@doogleonline.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateContactConfirmationHTML(message: ContactMessage): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Message Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DoogleOnline Support</h1>
            <p>Message Confirmation</p>
          </div>
          <div class="content">
            <h2>Thank you for contacting us!</h2>
            <p>Dear ${message.name},</p>
            <p>We've received your message and will respond within 24 hours.</p>
            
            <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px;">
              <h3>Your Message:</h3>
              <p><strong>Subject:</strong> ${message.subject}</p>
              <p><strong>Message:</strong> ${message.message}</p>
              <p><strong>Received:</strong> ${new Date(message.createdAt).toLocaleString()}</p>
            </div>
            
            <p>Our support team will review your inquiry and get back to you as soon as possible.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing DoogleOnline</p>
            <p>For urgent matters, you can also reach us at +252 61 234 5678</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAdminNotificationHTML(message: ContactMessage): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Message</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .message-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 New Contact Message</h1>
            <p>DoogleOnline Admin Panel</p>
          </div>
          <div class="content">
            <h2>New Support Request</h2>
            <p>A new contact message has been received and requires attention.</p>
            
            <div class="message-details">
              <h3>Message Details</h3>
              <p><strong>From:</strong> ${message.name}</p>
              <p><strong>Email:</strong> ${message.email}</p>
              <p><strong>Subject:</strong> ${message.subject}</p>
              <p><strong>Message:</strong></p>
              <p style="background: #f8f9fa; padding: 10px; border-radius: 4px;">${message.message}</p>
              <p><strong>Received:</strong> ${new Date(message.createdAt).toLocaleString()}</p>
            </div>
            
            <p><a href="https://doogleonline.com/admin/dashboard" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = EmailService.getInstance();