import { Resend } from 'resend';
import type { Order, ContactMessage } from "@shared/schema";

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Initialize Resend with API key (optional)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
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
      const trackingLink = `${process.env.FRONTEND_URL || 'https://doogleonline.com'}/track/${order.orderId}`;
      
      const emailConfig = {
        from: "DoogleOnline <orders@doogleonline.com>",
        to: customerEmail || order.email || "customer@example.com",
        subject: `Order Confirmation - ${order.orderId}`,
        html: this.generateOrderConfirmationHTML(order, trackingLink)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Order confirmation email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock order confirmation email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      return false;
    }
  }

  async sendStatusUpdate(order: Order, customerEmail?: string): Promise<boolean> {
    try {
      const trackingLink = `${process.env.FRONTEND_URL || 'https://doogleonline.com'}/track/${order.orderId}`;
      
      const emailConfig = {
        from: "DoogleOnline <orders@doogleonline.com>",
        to: customerEmail || order.email || "customer@example.com",
        subject: `Order Status Update - ${order.orderId}`,
        html: this.generateStatusUpdateHTML(order, trackingLink)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Status update email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock status update email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send status update email:", error);
      return false;
    }
  }

  async sendContactConfirmation(message: ContactMessage): Promise<boolean> {
    try {
      const emailConfig = {
        from: "DoogleOnline Support <support@doogleonline.com>",
        to: message.email,
        subject: "We received your message - DoogleOnline Support",
        html: this.generateContactConfirmationHTML(message)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Contact confirmation email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock contact confirmation email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send contact confirmation email:", error);
      return false;
    }
  }

  async notifyAdmin(message: ContactMessage): Promise<boolean> {
    try {
      const emailConfig = {
        from: "DoogleOnline System <system@doogleonline.com>",
        to: "dadayare3@gmail.com",
        subject: `New Customer Message: ${message.subject}`,
        html: this.generateAdminNotificationHTML(message)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Admin notification email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock admin notification email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send admin notification email:", error);
      return false;
    }
  }

  async sendPaymentConfirmation(order: Order): Promise<boolean> {
    try {
      const trackingLink = `${process.env.FRONTEND_URL || 'https://doogleonline.com'}/track/${order.orderId}`;
      
      const emailConfig = {
        from: "DoogleOnline <orders@doogleonline.com>",
        to: order.email,
        subject: `Payment Received - Order ${order.orderId}`,
        html: this.generatePaymentConfirmationHTML(order, trackingLink)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Payment confirmation email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock payment confirmation email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send payment confirmation email:", error);
      return false;
    }
  }

  async sendOrderCompletion(order: Order): Promise<boolean> {
    try {
      const trackingLink = `${process.env.FRONTEND_URL || 'https://doogleonline.com'}/track/${order.orderId}`;
      
      const emailConfig = {
        from: "DoogleOnline <orders@doogleonline.com>",
        to: order.email,
        subject: `Order Completed - ${order.orderId}`,
        html: this.generateOrderCompletionHTML(order, trackingLink)
      };

      if (resend) {
        await resend.emails.send(emailConfig);
        console.log("Order completion email sent via Resend:", emailConfig.subject);
      } else {
        console.log("Mock order completion email sent:", emailConfig.subject);
      }
      return true;
    } catch (error) {
      console.error("Failed to send order completion email:", error);
      return false;
    }
  }

  private generateOrderConfirmationHTML(order: Order, trackingLink?: string): string {
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
            ${trackingLink ? `<p><a href="${trackingLink}" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Track Your Order</a></p>` : ''}
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

  private generateStatusUpdateHTML(order: Order, trackingLink?: string): string {
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
            ${trackingLink ? `<p><a href="${trackingLink}" style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Track Your Order</a></p>` : '<p>Track your order: <a href="https://doogleonline.com/track">https://doogleonline.com/track</a></p>'}
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

  private generatePaymentConfirmationHTML(order: Order, trackingLink?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #059669; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .processing-info { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Received!</h1>
            <p>We are processing your exchange</p>
          </div>
          <div class="content">
            <h2>Thank you for your payment!</h2>
            <p>Dear ${order.fullName},</p>
            <p>We have successfully received your payment and are now processing your exchange request.</p>
            
            <div class="payment-details">
              <h3>Payment Confirmed</h3>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>Amount Sent:</strong> ${order.sendAmount} ${order.sendMethod.toUpperCase()}</p>
              <p><strong>Amount to Receive:</strong> ${order.receiveAmount} ${order.receiveMethod.toUpperCase()}</p>
              <p><strong>Status:</strong> Payment Verified ✓</p>
            </div>
            
            <div class="processing-info">
              <h3>What happens next?</h3>
              <ol>
                <li>We are verifying your payment (this may take up to 15 minutes)</li>
                <li>Once verified, we'll process your exchange immediately</li>
                <li>You'll receive another email when your funds are sent</li>
              </ol>
            </div>
            
            ${trackingLink ? `<p><a href="${trackingLink}" style="background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Track Your Order</a></p>` : ''}
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

  private generateOrderCompletionHTML(order: Order, trackingLink?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .completion-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #16a34a; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .success-banner { background: #dcfce7; color: #166534; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Completed!</h1>
            <p>Your exchange has been processed successfully</p>
          </div>
          <div class="content">
            <div class="success-banner">
              Your ${order.receiveAmount} ${order.receiveMethod.toUpperCase()} has been sent to your wallet!
            </div>
            
            <h2>Exchange Complete</h2>
            <p>Dear ${order.fullName},</p>
            <p>Great news! Your exchange order has been completed successfully and your funds have been sent to your wallet address.</p>
            
            <div class="completion-details">
              <h3>Transaction Summary</h3>
              <p><strong>Order ID:</strong> ${order.orderId}</p>
              <p><strong>You Sent:</strong> ${order.sendAmount} ${order.sendMethod.toUpperCase()}</p>
              <p><strong>You Received:</strong> ${order.receiveAmount} ${order.receiveMethod.toUpperCase()}</p>
              <p><strong>Exchange Rate:</strong> ${parseFloat(order.exchangeRate).toFixed(6)}</p>
              <p><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">✓ COMPLETED</span></p>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Important Notes:</h3>
              <ul>
                <li>Your funds should appear in your wallet within a few minutes</li>
                <li>Keep this email as a record of your transaction</li>
                <li>Contact us if you don't receive your funds within 30 minutes</li>
              </ul>
            </div>
            
            ${trackingLink ? `<p><a href="${trackingLink}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Order Details</a></p>` : ''}
          </div>
          <div class="footer">
            <p>Thank you for choosing DoogleOnline for your exchange needs!</p>
            <p>For support, contact us at support@doogleonline.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = EmailService.getInstance();